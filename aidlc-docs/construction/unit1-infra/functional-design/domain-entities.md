# Unit 1 インフラ基盤 — ドメインエンティティ定義

## DynamoDB データモデル詳細

### Users テーブル

```typescript
interface User {
  userId: string;          // PK: Cognito Sub（UUID）
  email: string;
  name: string;
  accountType: 'btob' | 'btoc';
  organizationId?: string; // BtoB ユーザーのみ
  createdAt: string;       // ISO 8601
  updatedAt: string;
}
```

### DayOneRecords テーブル

```typescript
interface DayOneRecord {
  userId: string;          // PK
  recordId: string;        // SK: UUID
  title: string;           // 例: "入社初日" "ダイエット開始"
  templateId: string;      // 使用したフォーマットテンプレートID
  answers: FormAnswer[];   // フォーマット回答（テキスト入力）
  voiceModelId?: string;   // 生成済みクローンボイスモデルID
  recordingStatus: 'text_only' | 'recording_complete' | 'voice_model_ready';
  mediaFiles: string[];    // S3 キー一覧（写真・動画）
  organizationId?: string; // BtoB の場合
  createdAt: string;
  updatedAt: string;
}

interface FormAnswer {
  itemId: string;
  question: string;
  answer: string;
}
```

**設計メモ**:
- テキスト入力（`answers`）と音声録音は独立して管理する
- ElevenLabs Voice Cloning API はテキスト情報不要。音声データのみで Voice ID を生成できる
- テキストは対話時の System Prompt 構築に使用し、クローンボイス生成には使用しない

### VoiceModels テーブル

```typescript
interface VoiceModel {
  userId: string;              // PK
  voiceModelId: string;        // SK: UUID
  recordId: string;            // 紐付く Day 1 記録
  elevenLabsVoiceId?: string;  // ElevenLabs の Voice ID（生成完了後に設定）
  status: 'pending' | 'processing' | 'completed' | 'failed';

  // 録音セッション管理
  recordingSession: RecordingSession;

  createdAt: string;
  updatedAt: string;
}

interface RecordingSession {
  // 録音ファイルの S3 キー
  audioS3Key?: string;

  // 録音メタデータ
  durationSeconds?: number;    // 録音時間（秒）
  isComplete: boolean;         // 録音完了フラグ
  recordedAt?: string;         // 録音完了日時
}
```

**ElevenLabs Voice Cloning API の仕様**:
- テキスト情報は不要。音声データのみで Voice ID を生成できる
- 推奨録音時間: 10〜30秒（最低10秒以上）
- 対応フォーマット: MP3, WAV, M4A 等
- API エンドポイント: `POST /v1/voices/add`（音声ファイルをマルチパートで送信）

### ConversationSessions テーブル

```typescript
interface ConversationSession {
  sessionId: string;       // PK: UUID
  timestamp: string;       // SK: ISO 8601
  userId: string;
  recordId: string;        // 対話した Day 1 記録
  messages: Message[];     // 対話履歴
  memo?: string;           // 振り返りメモ
  duration: number;        // 対話時間（秒）

  // 構造化サマリ（MVP後フェーズ2）
  // LLM が対話終了後に自動生成。次回セッションの System Prompt に注入する
  sessionSummary?: SessionSummary;

  createdAt: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  audioS3Key?: string;     // 音声チャンクの S3 キー（任意）
  timestamp: string;
}

// MVP後フェーズ2: 前回会話の記憶を構造化して次回対話に活用
interface SessionSummary {
  // LLM が対話内容から抽出した構造化情報
  keyTopics: string[];         // 話題になったキーワード（例: ["転職", "上司との関係"]）
  emotionalState: string;      // ユーザーの感情状態（例: "不安・迷い"）
  insights: string[];          // 気づき・決意（例: ["初心を思い出した", "もう少し続けてみる"]）
  openQuestions: string[];     // 次回に続けたい問い（例: ["転職の件はどうなりましたか？"]）
  generatedAt: string;
}
```

**MVP後フェーズ2 の活用方法**:
- 対話セッション終了後、LLM が `messages` を分析して `sessionSummary` を自動生成・保存
- 次回の対話開始時、直近 N 件の `sessionSummary` を System Prompt に追加注入
- クローンボイスが冒頭で「前回、〇〇について話していましたね。その後どうですか？」と問いかける
- 継続的な関係性を持つ「過去の自分」として、より深い対話が可能になる

### RemindSchedules テーブル

```typescript
interface RemindSchedule {
  userId: string;          // PK
  reminderId: string;      // SK: UUID
  recordId: string;
  scheduleType: 'relative' | 'cron';
  scheduleValue: string;   // 例: "P2Y"（2年後）or "0 9 * * 1"（毎週月曜9時）
  channel: 'email';        // 将来: 'push' も追加
  eventBridgeRuleArn?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### FormTemplates テーブル

```typescript
interface FormTemplate {
  templateId: string;      // PK: UUID or 'default-general' 等
  name: string;            // 例: "汎用（標準）"
  type: 'default' | 'custom' | 'organization';
  items: FormItem[];
  ownerId?: string;        // カスタムテンプレートの場合: userId
  organizationId?: string; // 組織テンプレートの場合
  maxAdditionalItems: number; // ユーザーが追加できる上限
  createdAt: string;
  updatedAt: string;
}

interface FormItem {
  itemId: string;
  question: string;
  isRequired: boolean;
  isLocked: boolean;       // BtoB 必須項目はロック
  order: number;
}
```

### Organizations テーブル

```typescript
interface Organization {
  organizationId: string;  // PK: UUID
  name: string;
  adminUserId: string;
  templateId?: string;     // 組織用フォーマットテンプレート
  maxAdditionalItems: number; // 従業員が追加できる項目数上限（デフォルト3）
  createdAt: string;
  updatedAt: string;
}
```
