# Unit 2 AI 対話パイプライン — ドメインエンティティ

## WebSocket セッション管理

```typescript
interface WebSocketSession {
  connectionId: string;    // API Gateway WebSocket 接続 ID
  userId: string;
  recordId: string;        // 対話する Day 1 記録
  elevenLabsVoiceId: string;
  conversationHistory: Message[];
  sessionSummary?: string; // 10ターン超えたら要約
  createdAt: string;
  lastActivityAt: string;
}
```

**保存場所**: DynamoDB `day1-conversations` テーブル（セッション終了時）
**一時保存**: Lambda のメモリ内（セッション中）

## Transcribe ストリーミング設定

```typescript
const transcribeConfig = {
  LanguageCode: 'ja-JP',
  MediaSampleRateHertz: 16000,
  MediaEncoding: 'pcm',
  // Final Results のみを使用する方針
  // - Partial Results（中間結果）は精度が低く書き換わるため使用しない
  // - Final Results は発話が一区切りついた（無音 0.5〜1秒）時点で確定
  // - 高精度なテキストが得られてから LLM に送る
  // - 結果: ユーザー発話終了から 0.5〜1秒後に LLM 処理開始
};
```

**STT 処理フロー：**
```
ユーザーが話す（音声チャンクを WebSocket 経由で送信）
    ↓
Transcribe Streaming がリアルタイムで処理
    ↓
発話が一区切りついたら（無音 0.5〜1秒）→ IsPartial: false の Final Result が返る
    ↓
Final Result のテキストを LLM（Nova 2 Lite）に送る
```

## ElevenLabs TTS リクエスト

```typescript
const ttsRequest = {
  text: responseText,
  model_id: 'eleven_flash_v2_5',
  output_format: 'mp3_22050_32',
  apply_language_text_normalization: false,  // 日本語でtrueにするとレイテンシ増加
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.75,
  },
};
```

## Nova 2 Lite リクエスト

```typescript
const bedrockRequest = {
  modelId: 'us.amazon.nova-lite-v2:0',  // クロスリージョン推論プロファイル
  messages: [
    { role: 'user', content: userText },
  ],
  system: [{ text: systemPrompt }],
  inferenceConfig: {
    maxTokens: 500,      // 対話応答は短めに
    temperature: 0.7,
    topP: 0.9,
  },
};
```
