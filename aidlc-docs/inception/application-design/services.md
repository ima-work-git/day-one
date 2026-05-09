# サービス定義 — Day 1

## サービス一覧

### SVC-01: RecordingService（記録サービス）

**責務**: Day 1 記録の作成・管理・フォーマット処理

**エンドポイント**:
- `POST /records` — 新規 Day 1 記録作成
- `GET /records` — ユーザーの記録一覧取得
- `GET /records/{recordId}` — 記録詳細取得
- `PUT /records/{recordId}` — 記録更新
- `DELETE /records/{recordId}` — 記録削除

**オーケストレーション**:
1. フォーマット回答をバリデーション
2. DynamoDB（DayOneRecords）に保存
3. S3 Presigned URL を発行（メディアアップロード用）
4. クローンボイス生成ジョブを非同期起動（VoiceService へ）

---

### SVC-02: VoiceService（クローンボイスサービス）

**責務**: クローンボイスの生成・管理・対話処理

**エンドポイント**:
- `POST /voice/clone` — クローンボイス生成ジョブ起動
- `GET /voice/status/{jobId}` — 生成ジョブの状態確認
- `GET /voice/{voiceId}` — クローンボイス情報取得

**オーケストレーション（クローンボイス生成）**:
1. S3 から録音音声を取得
2. ElevenLabs Voice Cloning API を呼び出し
3. 生成された Voice ID を DynamoDB（VoiceModels）に保存
4. 生成完了通知を NotificationService へ

**オーケストレーション（対話処理）**:
1. WebSocket 経由でユーザー音声チャンクを受信
2. Amazon Transcribe で音声→テキスト変換（STT）
3. DynamoDB から Day 1 記録を取得し System Prompt を構築
4. Amazon Bedrock Nova 2 Lite で応答テキスト生成
5. ElevenLabs Flash v2.5 でクローンボイス音声合成（TTS）
6. 音声チャンクを WebSocket 経由でクライアントへストリーミング

---

### SVC-03: UserService（ユーザーサービス）

**責務**: ユーザー管理・認証・BtoB 招待

**エンドポイント**:
- `POST /users/register` — ユーザー登録
- `GET /users/me` — プロフィール取得
- `PUT /users/me` — プロフィール更新
- `POST /organizations/invite` — BtoB 招待リンク発行
- `POST /organizations/join` — 招待リンク経由でのアカウント作成

**オーケストレーション（BtoB 招待）**:
1. 管理者が招待メールアドレスを登録
2. Cognito でユーザーを事前登録（FORCE_CHANGE_PASSWORD 状態）
3. 招待リンク（トークン付き）を生成
4. NotificationService 経由で招待メール送信
5. 従業員がリンクをクリック → パスワード設定 → アカウント有効化

---

### SVC-04: FormTemplateService（フォーマットテンプレートサービス）

**責務**: フォーマットテンプレートの管理・カスタマイズ

**エンドポイント**:
- `GET /templates` — デフォルトテンプレート一覧取得
- `GET /templates/{templateId}` — テンプレート詳細取得
- `POST /templates/custom` — カスタムテンプレート保存
- `PUT /templates/custom/{templateId}` — カスタムテンプレート更新
- `POST /organizations/templates` — 組織用テンプレート設定（BtoB管理者）

**テンプレート種別**:
- デフォルト（汎用・企業研修・スポーツ・受験・ダイエット）
- ユーザーカスタム（BtoC: 最大5項目追加）
- 組織テンプレート（BtoB管理者設定: 必須項目ロック・追加上限設定）

---

### SVC-05: RemindService（リマインドサービス）

**責務**: リマインドスケジュールの管理・通知実行

**エンドポイント**:
- `POST /reminders` — リマインドスケジュール作成
- `GET /reminders` — スケジュール一覧取得
- `PUT /reminders/{reminderId}` — スケジュール更新
- `DELETE /reminders/{reminderId}` — スケジュール削除

**オーケストレーション（リマインド実行）**:
1. EventBridge Scheduler がスケジュール時刻に Lambda を起動
2. DynamoDB（RemindSchedules）から対象ユーザーを取得
3. NotificationService 経由でリマインドメール送信
4. 対話セッション開始 URL を生成してメールに含める

---

### SVC-06: ConversationService（対話セッションサービス）

**責務**: 対話セッションの管理・履歴保存・会話記憶の構造化（フェーズ2）

**エンドポイント**:
- `POST /conversations` — 対話セッション開始
- `GET /conversations` — セッション履歴一覧
- `GET /conversations/{sessionId}` — セッション詳細
- `PUT /conversations/{sessionId}/memo` — 振り返りメモ保存

**オーケストレーション**:
1. セッション開始時に DayOneRecord を取得し System Prompt を構築
2. 【フェーズ2】直近3件の SessionSummary を取得して System Prompt に追加注入
3. WebSocket セッション ID を発行
4. VoiceService に対話処理を委譲
5. セッション終了時に履歴を DynamoDB（ConversationSessions）に保存
6. 【フェーズ2】セッション終了後、非同期で Nova 2 Lite を呼び出して SessionSummary を自動生成・保存

---

### SVC-07: NotificationService（通知サービス）

**責務**: メール通知の送信

**内部 API**（他サービスから呼び出し）:
- `sendReminderEmail(userId, recordId)` — リマインドメール送信
- `sendVoiceReadyEmail(userId)` — クローンボイス生成完了通知
- `sendInviteEmail(email, inviteToken)` — BtoB 招待メール送信

**将来拡張**:
- Amazon SNS によるプッシュ通知対応
