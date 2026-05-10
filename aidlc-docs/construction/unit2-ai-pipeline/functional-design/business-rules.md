# Unit 2 AI 対話パイプライン — ビジネスルール

## 対話セッション管理ルール

### セッション開始条件
- `VoiceModel.status === 'completed'`（クローンボイス生成済み）
- `DayOneRecord.recordingStatus === 'voice_model_ready'`
- クローンボイス未生成の場合: ElevenLabs プリセットボイスで代替（デモ用）

### 会話履歴管理
- 直近10ターンをメモリに保持
- 10ターン超えたら古いターンを Nova 2 Lite で要約（`sessionSummary` に保存）
- セッション終了時に DynamoDB `day1-conversations` に全履歴を保存

### System Prompt 構築ルール
1. `DayOneRecord.answers` から全フォーマット回答を取得
2. 役割・記録日・各項目を構造化して注入
3. 「なりたい人物像・なりたくない人物像」は特に強調
4. 日本語で話すよう明示

## TTS HTTP Streaming ルール

### 音声の重なり防止
- クライアント側で「再生中フラグ」を管理
- 前の音声チャンクの再生が完了するまで次のチャンクをキューに積む
- Lambda 側では音声チャンクを順番に送信（並列送信しない）

### ストリーミング実装
```
Lambda → ElevenLabs /stream エンドポイント（HTTP）
    ↓ 音声チャンクを受信しながら
Lambda → API Gateway WebSocket → クライアント（逐次転送）
```

## クローンボイス生成ルール

### 生成トリガー条件
- `VoiceModel.recordingSession.isComplete === true`
- `VoiceModel.recordingSession.durationSeconds >= 30`
- `VoiceModel.recordingSession.audioS3Key` が存在する

### 生成後の処理
1. ElevenLabs `voice_id` を `VoiceModel.elevenLabsVoiceId` に保存
2. `VoiceModel.status = 'completed'` に更新
3. `DayOneRecord.voiceModelId` を更新
4. `DayOneRecord.recordingStatus = 'voice_model_ready'` に更新
5. SES で完了通知メール送信

## レイテンシ最適化ルール

### 目標: 応答開始まで 2〜3 秒以内
- **Transcribe**: Final Results のみ使用（`IsPartial: false` のイベントのみ処理）
  - 発話終了から 0.5〜1秒で確定テキストが得られる
  - 中間結果（Partial）は精度が低いため使用しない
- **Nova 2 Lite**: ストリーミングレスポンス（`InvokeModelWithResponseStream`）で最初のトークンが来たら即 TTS へ
- **ElevenLabs**: HTTP Streaming（最初のチャンクが届いたら即再生開始）
- `apply_language_text_normalization: false`（日本語でのレイテンシ増加を防ぐ）

### レイテンシ内訳（目安）
| ステージ | 時間 |
|---|---|
| Transcribe Final Result 確定 | 0.5〜1秒 |
| Nova 2 Lite 最初のトークン | 0.3〜0.7秒 |
| ElevenLabs 最初の音声チャンク | 0.1〜0.2秒 |
| WebSocket 転送 | ~0.05秒 |
| **合計（応答開始まで）** | **約 1〜2秒** |

### コールドスタート対策
- Lambda Provisioned Concurrency を ws-message-handler に設定（デモ前に必須）
- または事前ウォームアップリクエストを送る
