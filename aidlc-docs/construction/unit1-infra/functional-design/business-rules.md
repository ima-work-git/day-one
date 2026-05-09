# Unit 1 インフラ基盤 — ビジネスルール・制約

## 録音セッション管理ルール

### ElevenLabs Instant Voice Cloning API 仕様（`POST /v1/voices/add`）
- **テキスト情報は不要**。音声ファイルのみ（マルチパート）でクローンボイスを生成できる
- **推奨録音時間**: 1〜2分（最低30秒以上。3分超は品質向上なし・悪化の可能性あり）
- **音質要件**: ノイズなし・-23dB〜-18dB RMS・MP3 128kbps以上
- **返却値**: `voice_id`（String）→ DynamoDB `VoiceModel.elevenLabsVoiceId` に保存
- テキスト入力（`answers`）と音声録音は完全に独立して管理する
- テキストは対話時の System Prompt 構築にのみ使用する

### 録音完了条件
- `VoiceModel.recordingSession.isComplete === true`
- `VoiceModel.recordingSession.durationSeconds >= 30`（最低30秒。推奨60秒以上）
- `VoiceModel.recordingSession.audioS3Key` が存在する

### クローンボイス生成トリガー条件
- `VoiceModel.status === 'pending'`
- 上記録音完了条件をすべて満たす
- 条件を満たした時点で ElevenLabs `POST /v1/voices/add` を呼び出す

### 録音フロー
1. テキスト入力完了 → `DayOneRecord.recordingStatus = 'text_only'` に更新
2. 録音開始 → `VoiceModel` レコードを `status: 'pending'` で作成
3. 録音完了（30秒以上）→ 音声を S3 にアップロード → `recordingSession.isComplete = true` に更新
4. クローンボイス生成ジョブ起動 → `VoiceModel.status = 'processing'` に更新
5. ElevenLabs から `voice_id` 取得 → `VoiceModel.elevenLabsVoiceId` に保存 → `status = 'completed'`
6. `DayOneRecord.voiceModelId` と `recordingStatus = 'voice_model_ready'` を更新

---

## ElevenLabs TTS（Flash v2.5）最速設定

### API 仕様
- **エンドポイント**: `POST /v1/text-to-speech/{voice_id}/stream`（ストリーミング必須）
- **model_id**: `eleven_flash_v2_5`
- **モデル推論レイテンシ**: ~75ms（TTFA は network + buffer 込みで実際 200〜500ms）

### 最速パラメータ設定
```json
{
  "text": "応答テキスト",
  "model_id": "eleven_flash_v2_5",
  "output_format": "mp3_22050_32",
  "apply_language_text_normalization": false,
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75
  }
}
```

**⚠️ 重要**: `apply_language_text_normalization` は日本語で `true` にすると**大幅にレイテンシが増加**する。`false`（デフォルト）のまま使用すること。

### ストリーミング方式
- **HTTP Streaming** を使用（WebSocket より実装がシンプル）
- Lambda → ElevenLabs へ HTTP ストリーミングリクエスト
- 受信した音声チャンクを即座に WebSocket 経由でクライアントへ転送
- クライアント側でバッファリングして再生

### 出力フォーマット選択
| フォーマット | 用途 | 備考 |
|---|---|---|
| `mp3_22050_32` | 最速・低帯域 | 音質は低め。リアルタイム対話向け |
| `mp3_44100_128` | バランス型 | デフォルト。Starter プラン以上 |
| `pcm_16000` | WebSocket向け | 低レイテンシだが Pro プラン必要 |

**MVP では `mp3_22050_32` を使用**（最速・Starter プランで利用可能）

---

## DynamoDB アクセスパターン

| 操作 | テーブル | アクセス方法 |
|---|---|---|
| ユーザー取得 | Users | PK: userId |
| 記録一覧取得（ユーザー別） | DayOneRecords | PK: userId |
| 記録一覧取得（企業別） | DayOneRecords | GSI: organizationId-createdAt-index |
| クローンボイス状態確認 | VoiceModels | PK: userId, SK: voiceModelId |
| 対話履歴取得 | ConversationSessions | GSI: userId-timestamp-index |
| リマインド一覧取得 | RemindSchedules | PK: userId |
| デフォルトテンプレート取得 | FormTemplates | PK: 'default-*' |

## S3 アクセス制御ルール

- **Presigned URL 有効期限**: アップロード用 15分、ダウンロード用 1時間
- **最大ファイルサイズ**: 音声 50MB、画像 10MB、動画 500MB
- **許可 MIME タイプ**:
  - 音声: `audio/wav`, `audio/mpeg`, `audio/webm`
  - 画像: `image/jpeg`, `image/png`
  - 動画: `video/mp4`

## Cognito ユーザー属性ルール

- `accountType` は登録時に設定し、変更不可
- `organizationId` は BtoB 招待フロー経由でのみ設定可能
- BtoB ユーザーは `organizationId` が必須

## SES 送信制限（サンドボックス）

- 送信先は検証済みメールアドレスのみ
- 1日あたり 200通、1秒あたり 1通の制限
- MVP 期間中はこの制限内で運用

## EventBridge スケジューラールール

- スケジュール名: `day1-reminder-{reminderId}`
- ターゲット: 通知 Lambda の ARN
- 入力: `{ "userId": "...", "recordId": "...", "reminderId": "..." }`
- 実行後: 単発スケジュールは自動削除、繰り返しスケジュールは維持

## IAM 最小権限原則

- Lambda ロールは必要なサービスのみにアクセス権限を付与
- S3 アクセスは `day1-media-*` バケットのみに限定
- DynamoDB アクセスは `day1-*` テーブルのみに限定
- Bedrock アクセスは `amazon.nova-lite-v2:0` モデルのみに限定

---

## System Prompt 構成ルール（MVP後フェーズ2）

### 前回会話の記憶を活用した System Prompt 拡張

**MVP の System Prompt**（静的）:
```
あなたは{userName}の{recordDate}時点の自分です。
以下の記録に基づいて、当時の気持ちで話してください:
{formAnswers}
```

**フェーズ2 の System Prompt**（動的・記憶あり）:
```
あなたは{userName}の{recordDate}時点の自分です。
以下の記録に基づいて、当時の気持ちで話してください:
{formAnswers}

【前回までの会話の記憶】
{sessionSummaries}  ← 直近N件のSessionSummaryを注入

今回の対話の冒頭では、前回の会話で出た「{openQuestions[0]}」から
自然に話を始めてください。
```

### SessionSummary 生成ルール
- 対話セッション終了後、Lambda が非同期で Nova 2 Lite を呼び出して生成
- 入力: `messages[]`（対話全文）
- 出力: `SessionSummary`（keyTopics・emotionalState・insights・openQuestions）
- 生成後 DynamoDB の `ConversationSessions.sessionSummary` に保存

### 次回セッションへの注入ルール
- 直近3件の `sessionSummary` を取得して System Prompt に追加
- `openQuestions` の最初の1件を冒頭の問いかけとして使用
- セッション数が0件の場合は MVP と同じ静的 System Prompt を使用
