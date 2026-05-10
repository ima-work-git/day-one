# Unit 2 AI 対話パイプライン — Functional Design

## 設計決定サマリ

| 項目 | 決定内容 |
|---|---|
| **MVP 開始方法** | 最初から音声対話（STT → LLM → TTS の完全パイプライン） |
| **STT 方式** | Amazon Transcribe Streaming Transcription（リアルタイム） |
| **TTS ストリーミング** | ElevenLabs HTTP Streaming（`/stream` エンドポイント） |
| **クローンボイス生成** | 録音完了直後に即座に生成（ユーザーが待つ。完了まで UI でプログレス表示） |
| **System Prompt** | 構造化（役割・記録日・各フォーマット項目を整理して注入） |
| **会話履歴** | 直近10ターン + セッションサマリ + 構造化（レイテンシとコストのバランス） |

---

## AI 対話パイプライン フロー

```
[ブラウザ]
    |
    | WebSocket 接続（wss://）
    v
[API Gateway WebSocket]
    |
    | $connect → ws-connect-handler
    | $default → ws-message-handler（メイン処理）
    | $disconnect → ws-disconnect-handler
    v
[ws-message-handler Lambda]
    |
    | 1. 音声チャンク受信（base64 エンコード）
    v
[Amazon Transcribe Streaming]
    |
    | 2. 音声 → テキスト（リアルタイム）
    v
[Amazon Bedrock Nova 2 Lite]
    |
    | 3. System Prompt + 会話履歴 + ユーザーテキスト → 応答テキスト生成
    v
[ElevenLabs Flash v2.5 HTTP Streaming]
    |
    | 4. 応答テキスト → クローンボイス音声（ストリーミング）
    v
[ws-message-handler Lambda]
    |
    | 5. 音声チャンクを WebSocket 経由でクライアントへ転送
    v
[ブラウザ]
    音声再生
```

---

## System Prompt 構造

```
あなたは {userName} の {recordDate} 時点の自分です。
以下の記録に基づいて、当時の気持ちと視点で話してください。
現在の自分（{userName}）と対話しています。

【記録情報】
記録タイトル: {title}
記録日: {recordDate}

【フォーマット回答】
{formAnswers.map(a => `${a.question}: ${a.answer}`).join('\n')}

【対話ルール】
- 常に当時の自分として話す（「あのとき私は...」「入社した日、私は...」）
- 現在の自分を励ます・原点に戻す言葉をかける
- 「なりたくない自分」の記録があれば、それを使って警告する
- 感情的・共感的に話す。冷たい分析はしない
- 日本語で話す
```

---

## 会話履歴管理

### 保持方針
- **直近10ターン**: メモリに保持してリクエストに含める
- **セッションサマリ**: 10ターンを超えたら古いターンを LLM で要約して圧縮
- **DynamoDB 保存**: セッション終了時に全履歴を保存（振り返り・フェーズ2の記憶機能用）

### コンテキスト構成（LLM リクエスト）
```
System Prompt（固定）
+ セッションサマリ（あれば）
+ 直近10ターンの会話履歴
+ 今回のユーザー発話
```

---

## クローンボイス生成フロー

```
[録音完了]
    |
    | 音声ファイル（WAV/MP3、30秒〜2分）
    v
[voice-handler Lambda]
    |
    | 1. S3 から音声ファイルを取得
    | 2. ElevenLabs POST /v1/voices/add（マルチパート）
    | 3. voice_id を DynamoDB VoiceModels に保存
    | 4. DayOneRecord.recordingStatus = 'voice_model_ready' に更新
    | 5. SES で完了通知メール送信
    v
[完了通知]
    ユーザーに「クローンボイスの準備ができました」メール
```

**注意**: 生成には数秒〜数十秒かかる。UI でプログレスバーを表示し、完了まで待機させる。

---

## WebSocket メッセージプロトコル

### クライアント → サーバー

```typescript
// 対話セッション開始
{ action: 'session_start', recordId: string, userId: string }

// 音声チャンク送信
{ action: 'audio_chunk', data: string /* base64 */ }

// セッション終了
{ action: 'session_end' }
```

### サーバー → クライアント

```typescript
// STT 中間結果
{ type: 'transcript_partial', text: string }

// STT 確定結果
{ type: 'transcript_final', text: string }

// LLM 応答テキスト
{ type: 'response_text', text: string }

// TTS 音声チャンク
{ type: 'audio_chunk', data: string /* base64 */ }

// セッション準備完了
{ type: 'session_ready', voiceId: string }

// エラー
{ type: 'error', message: string }
```

---

## エラーハンドリング

| エラー | 対応 |
|---|---|
| Transcribe 接続失敗 | 3回リトライ後、エラーメッセージをクライアントへ送信 |
| Nova 2 Lite タイムアウト | 30秒タイムアウト設定。エラー時は「もう一度話しかけてください」 |
| ElevenLabs API エラー | 指数バックオフで3回リトライ。失敗時はテキストのみ返す |
| WebSocket 切断 | DynamoDB にセッション状態を保存。再接続時に復元 |
| クローンボイス未生成 | デフォルトボイス（ElevenLabs プリセット）で代替 |
