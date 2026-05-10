# コンポーネント定義 — Day 1

## アーキテクチャ概要

```
+------------------+     +---------------------------+     +----------------------+
|   Frontend       |     |   API Layer               |     |   AI Pipeline        |
|   (Next.js)      |<--->|   (API Gateway + Lambda)  |<--->|   Transcribe         |
|                  |     |                           |     |   Nova 2 Lite        |
+------------------+     +---------------------------+     |   ElevenLabs v2.5    |
         |                          |                      +----------------------+
         | WebSocket                |
         v                          +----------+----------+----------+
+------------------+          +--------+  +--------+  +----------+
|  WebSocket API   |          |DynamoDB|  |   S3   |  | Cognito  |
|  (対話セッション) |          |(データ)|  |(メディア)|  | (認証)   |
+------------------+          +--------+  +--------+  +----------+
                                                |
                                    +---------------------+
                                    |  SES + EventBridge  |
                                    |  (通知・スケジューラ) |
                                    +---------------------+
```

**対話パイプライン**:
```
ユーザー音声
    → Amazon Transcribe (STT: 音声→テキスト)
    → Amazon Bedrock Nova 2 Lite (LLM: 「Day 1の自分」として応答生成)
    → ElevenLabs Flash v2.5 (TTS: クローンボイスで音声合成)
    → ユーザーへ音声出力
```

---

## コンポーネント一覧

### C-01: フロントエンド（Next.js）

| 項目 | 内容 |
|---|---|
| **技術** | Next.js（App Router）|
| **デプロイ** | AWS Amplify |
| **責務** | ユーザーインターフェース全体の提供 |

**主な責務**:
- Day 1 記録フォーム（ガイド付きフォーマット・カスタマイズ UI）
- 音声録音 UI（クローンボイス用音声収録：直前のテキストは参考表示）
- クローンボイス対話 UI（WebSocket 接続・音声ストリーミング再生）
- ホーム画面（登録済み Day 1 記録一覧・選択）
- リマインド設定 UI（MVPは個人簡易設定・研修用リンク導線）
- 認証フロー（Cognito 連携）

---

### C-02: REST API（API Gateway + Lambda）

| 項目 | 内容 |
|---|---|
| **技術** | Amazon API Gateway（REST）+ AWS Lambda（Node.js）|
| **責務** | REST API エンドポイントの提供・ビジネスロジックの実行 |

**主な責務**:
- ユーザー管理 API（登録・プロフィール。BtoB招待リンク発行はフェーズ2）
- Day 1 記録 CRUD API
- フォーマットテンプレート管理 API（MVPはデフォルト・カスタム、組織テンプレートはフェーズ2）
- クローンボイス生成ジョブの起動・状態管理
- リマインドスケジュール管理 API（企業単位の一括配信はフェーズ2）
- S3 Presigned URL 発行

---

### C-03: AI 処理パイプライン（Lambda）

| 項目 | 内容 |
|---|---|
| **技術** | AWS Lambda + Amazon Transcribe + Amazon Bedrock（Nova 2 Lite）+ ElevenLabs Flash v2.5 |
| **責務** | 音声認識・LLM 応答生成・クローンボイス音声合成 |

**処理フロー**:
1. **STT**: Amazon Transcribe でユーザー音声をテキスト変換
2. **LLM**: Amazon Bedrock Nova 2 Lite で「Day 1の自分」として応答テキスト生成（Day 1 記録の文脈を System Prompt に注入）
3. **TTS**: ElevenLabs Flash v2.5 でクローンボイスによる音声合成（75ms レイテンシ）

**クローンボイス生成**:
- ElevenLabs Voice Cloning API を呼び出し、ユーザーの録音音声からクローンボイスモデルを生成
- 生成された Voice ID を DynamoDB に保存

**技術選定根拠**:
- **Nova 2 Lite**: 1M トークンコンテキスト。価格は Amazon Bedrock Pricing に準拠。AWS ネイティブ
- **ElevenLabs Flash v2.5**: 日本語対応（32 言語）・75ms レイテンシ・Instant Voice Cloning（30 秒〜2 分音声サンプル）。商用利用条件は ElevenLabs の有料プラン・利用規約に準拠
- **Nova 2 Sonic 非採用理由**: クローンボイス機能がない（決定的：本人の音声クローンを差し込む API がなく Day 1 の根幹を満たせず）／加えて日本語が公式サポート外

---

### C-04: WebSocket API（対話セッション管理）

| 項目 | 内容 |
|---|---|
| **技術** | Amazon API Gateway（WebSocket API）+ Lambda |
| **責務** | リアルタイム音声対話のセッション管理・ストリーミング中継 |

**主な責務**:
- WebSocket 接続の確立・維持・切断
- 音声チャンクのリアルタイム中継（クライアント → Transcribe → Nova 2 Lite → ElevenLabs → クライアント）
- 対話セッションの状態管理（DynamoDB）

---

### C-05: メディアストレージ（S3）

| 項目 | 内容 |
|---|---|
| **技術** | Amazon S3 |
| **責務** | ユーザーのメディアファイル（音声・画像・動画）の保存・管理 |

**主な責務**:
- 音声録音ファイルの保存（クローンボイス生成用）
- 画像・動画ファイルの保存
- Presigned URL によるセキュアなアップロード・ダウンロード
- サーバーサイド暗号化（SSE-S3）

**バケット構成**:
```
day-one-media/
├── users/{userId}/records/{recordId}/recordings/   # クローンボイス用音声（recordIdごとに分離）
├── users/{userId}/records/{recordId}/photos/       # 写真
├── users/{userId}/records/{recordId}/videos/       # 動画
└── users/{userId}/voice-models/{voiceModelId}/     # ElevenLabs Voice ID メタデータ
```

---

### C-06: データベース（DynamoDB）

| 項目 | 内容 |
|---|---|
| **技術** | Amazon DynamoDB |
| **責務** | アプリケーションデータの永続化 |

**主なテーブル**:
- **Users**: ユーザープロフィール・アカウント種別（MVPは個人単位、企業紐付けはフェーズ2）
- **DayOneRecords**: Day 1 記録（フォーマット回答・メタデータ）
- **VoiceModels**: クローンボイスモデルの状態・ElevenLabs Voice ID
- **ConversationSessions**: 対話セッション履歴・振り返りメモ
- **RemindSchedules**: リマインドスケジュール設定
- **FormTemplates**: フォーマットテンプレート（MVPはデフォルト・カスタム、組織テンプレートはフェーズ2）
- **Organizations**: 企業アカウント情報（BtoB、フェーズ2）

---

### C-07: 認証・認可（Amazon Cognito）

| 項目 | 内容 |
|---|---|
| **技術** | Amazon Cognito User Pools + Identity Pools |
| **責務** | ユーザー認証・認可・セッション管理 |

**主な責務**:
- メール＋パスワード認証
- Google ソーシャルログイン（Cognito Federated Identity）
- BtoB 招待リンク経由のアカウント作成（Cognito カスタムフロー、フェーズ2）
- JWT トークン発行・検証
- BtoB/BtoC アカウント種別のカスタム属性管理（フェーズ2）

---

### C-08: 通知サービス（SES + EventBridge）

| 項目 | 内容 |
|---|---|
| **技術** | Amazon SES + Amazon EventBridge + Lambda |
| **責務** | リマインドメール・通知メールの送信・スケジュール管理 |

**主な責務**:
- リマインドメール送信（「X年前のあなたが話しかけています」）
- クローンボイス生成完了通知メール
- BtoB 招待メール送信（フェーズ2）
- EventBridge Scheduler によるリマインドスケジュール実行（MVPは個人簡易設定、企業一括配信はフェーズ2）
- 将来拡張: Amazon SNS によるプッシュ通知
