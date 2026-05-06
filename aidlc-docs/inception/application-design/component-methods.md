# コンポーネントメソッド定義 — Day 1

## C-02: REST API Lambda

### RecordingHandler

```typescript
// Day 1 記録作成
createRecord(
  userId: string,
  input: {
    title: string,
    templateId: string,
    answers: FormAnswer[],   // フォーマット回答
    mediaFiles?: string[]    // S3 キー（任意）
  }
): Promise<{ recordId: string, presignedUrls: PresignedUrl[] }>

// 記録一覧取得
listRecords(
  userId: string,
  options?: { limit: number, cursor?: string }
): Promise<{ records: DayOneRecord[], nextCursor?: string }>

// 記録詳細取得
getRecord(
  userId: string,
  recordId: string
): Promise<DayOneRecord>
```

### VoiceHandler

```typescript
// クローンボイス生成ジョブ起動
startVoiceCloning(
  userId: string,
  recordId: string,
  audioS3Key: string
): Promise<{ jobId: string }>

// 生成ジョブ状態確認
getVoiceCloningStatus(
  userId: string,
  jobId: string
): Promise<{ status: 'pending' | 'processing' | 'completed' | 'failed', voiceId?: string }>
```

### UserHandler

```typescript
// プロフィール取得
getProfile(userId: string): Promise<UserProfile>

// BtoB 招待リンク発行
createInviteLink(
  organizationId: string,
  emails: string[],
  expiresInDays?: number   // デフォルト7日
): Promise<{ inviteLinks: InviteLink[] }>

// 招待リンク経由アカウント作成
joinOrganization(
  inviteToken: string,
  input: { name: string, password: string }
): Promise<{ userId: string }>
```

### FormTemplateHandler

```typescript
// デフォルトテンプレート一覧
listDefaultTemplates(): Promise<FormTemplate[]>

// カスタムテンプレート保存
saveCustomTemplate(
  userId: string,
  input: {
    baseTemplateId: string,
    items: FormItem[],       // 編集・追加済み項目（最大5項目 BtoC / 3項目 BtoB）
    title: string
  }
): Promise<{ templateId: string }>

// 組織テンプレート設定（BtoB管理者）
setOrganizationTemplate(
  organizationId: string,
  input: {
    items: FormItem[],
    requiredItemIds: string[],   // 必須項目（ロック）
    maxAdditionalItems: number   // ユーザー追加上限（デフォルト3）
  }
): Promise<{ templateId: string }>
```

### RemindHandler

```typescript
// リマインドスケジュール作成
createReminder(
  userId: string,
  input: {
    recordId: string,
    schedule: ReminderSchedule,  // cron 式または相対日時
    channel: 'email'             // 将来: 'push' も追加
  }
): Promise<{ reminderId: string }>
```

### S3Handler

```typescript
// Presigned URL 発行（アップロード用）
generateUploadUrl(
  userId: string,
  fileType: 'recording' | 'photo' | 'video',
  contentType: string
): Promise<{ presignedUrl: string, s3Key: string }>

// Presigned URL 発行（ダウンロード用）
generateDownloadUrl(
  userId: string,
  s3Key: string,
  expiresInSeconds?: number   // デフォルト 3600
): Promise<{ presignedUrl: string }>
```

---

## C-03: AI 処理パイプライン Lambda

### VoiceCloningProcessor

```typescript
// ElevenLabs クローンボイス生成（Instant Voice Cloning）
// POST /v1/voices/add - 音声ファイルのみ必要（テキスト不要）
cloneVoice(
  audioS3Key: string,   // S3 から取得した音声ファイル（最低30秒・推奨1〜2分）
  voiceName: string
): Promise<{ elevenLabsVoiceId: string }>
```

### ConversationProcessor

```typescript
// 対話ターン処理（WebSocket 経由で呼び出し）
processTurn(
  sessionId: string,
  audioChunk: Buffer,          // ユーザー音声チャンク
  context: ConversationContext // Day 1 記録・対話履歴
): Promise<{ audioChunk: Buffer, transcript: string }>

// STT: 音声→テキスト
transcribeAudio(
  audioChunk: Buffer
): Promise<{ text: string, isFinal: boolean }>

// LLM: 応答テキスト生成（Nova 2 Lite）
generateResponse(
  userText: string,
  systemPrompt: string,        // Day 1 記録から構築
  conversationHistory: Message[]
): Promise<{ responseText: string }>

// TTS: クローンボイス音声合成（ElevenLabs Flash v2.5）
// POST /v1/text-to-speech/{voice_id}/stream
// model_id: eleven_flash_v2_5, output_format: mp3_22050_32
// apply_language_text_normalization: false（日本語でtrueにするとレイテンシ大幅増加）
synthesizeSpeech(
  text: string,
  elevenLabsVoiceId: string
): Promise<{ audioChunk: Buffer }>
```

### SystemPromptBuilder

```typescript
// Day 1 記録から System Prompt を構築
buildSystemPrompt(
  record: DayOneRecord
): string
// 例: "あなたは{userName}の{recordDate}時点の自分です。
//      以下の記録に基づいて、当時の気持ちで話してください:
//      動機: {motivation}
//      やりたいこと: {goals}
//      なりたい人物像・なりたくない人物像: {persona}
//      ..."
```

---

## C-04: WebSocket Lambda

```typescript
// 接続確立
onConnect(connectionId: string, userId: string): Promise<void>

// メッセージ受信（音声チャンク）
onMessage(
  connectionId: string,
  message: { type: 'audio_chunk' | 'session_start' | 'session_end', data: any }
): Promise<void>

// 切断
onDisconnect(connectionId: string): Promise<void>

// クライアントへ送信
sendToClient(
  connectionId: string,
  message: { type: 'audio_chunk' | 'transcript' | 'session_ready', data: any }
): Promise<void>
```

---

## C-08: 通知 Lambda

```typescript
// リマインドメール送信
sendReminderEmail(
  userId: string,
  recordId: string,
  yearsAgo: number
): Promise<void>

// クローンボイス生成完了通知
sendVoiceReadyEmail(userId: string): Promise<void>

// BtoB 招待メール送信
sendInviteEmail(
  email: string,
  inviteToken: string,
  organizationName: string
): Promise<void>
```

---

## 型定義

```typescript
type FormAnswer = {
  itemId: string,
  question: string,
  answer: string
}

type FormItem = {
  id: string,
  question: string,
  isRequired: boolean,
  isLocked: boolean,    // BtoB 必須項目はロック
  order: number
}

type DayOneRecord = {
  recordId: string,
  userId: string,
  title: string,
  templateId: string,
  answers: FormAnswer[],
  voiceModelId?: string,
  createdAt: string,
  mediaFiles: string[]
}

type ConversationContext = {
  record: DayOneRecord,
  history: Message[],
  elevenLabsVoiceId: string
}

type Message = {
  role: 'user' | 'assistant',
  content: string,
  timestamp: string
}

type ReminderSchedule = {
  type: 'relative' | 'cron',
  value: string   // 例: "P2Y" (2年後) または "0 9 * * 1" (毎週月曜9時)
}
```
