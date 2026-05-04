# アプリケーション設計概要 — Day One

## 設計サマリ

| 項目 | 決定内容 |
|---|---|
| **バックエンド** | サーバーレス（AWS Lambda + API Gateway） |
| **フロントエンド** | Next.js（App Router）/ AWS Amplify |
| **LLM** | Amazon Bedrock Nova 2 Lite（$0.08/$0.32 per 1M tokens） |
| **TTS** | ElevenLabs Flash v2.5（日本語対応・75ms・クローンボイス対応） |
| **STT** | Amazon Transcribe |
| **データベース** | Amazon DynamoDB（フルサーバーレス構成） |
| **ストレージ** | Amazon S3（Presigned URL） |
| **認証** | Amazon Cognito（BtoB招待リンク対応） |
| **通知** | Amazon SES（MVP）→ 将来 SNS プッシュ通知追加 |
| **リアルタイム通信** | WebSocket（API Gateway WebSocket API） |

---

## システム全体構成

```
[ユーザー]
    |
    | HTTPS / WebSocket
    v
+------------------------------------------+
|  C-01: Frontend (Next.js / AWS Amplify)  |
+------------------------------------------+
    |                    |
    | REST API           | WebSocket
    v                    v
+------------------+  +----------------------+
| C-02: REST API   |  | C-04: WebSocket API  |
| (API GW+Lambda)  |  | (API GW+Lambda)      |
+------------------+  +----------------------+
    |                    |
    |                    v
    |              +---------------------+
    |              | C-03: AI Pipeline   |
    |              | Transcribe (STT)    |
    |              | Nova 2 Lite (LLM)   |
    |              | ElevenLabs (TTS)    |
    |              +---------------------+
    |
    +----------+----------+----------+----------+
    |          |          |          |          |
    v          v          v          v          v
+--------+ +------+ +--------+ +--------+ +------+
|C-06    | |C-05  | |C-07    | |C-08    | |外部  |
|Dynamo  | |S3    | |Cognito | |SES     | |API   |
|DB      | |      | |        | |+EB     | |      |
+--------+ +------+ +--------+ +--------+ +------+
```

---

## コンポーネント一覧

| ID | コンポーネント | 技術 | 役割 |
|---|---|---|---|
| C-01 | フロントエンド | Next.js / Amplify | UI全体 |
| C-02 | REST API | API Gateway + Lambda | ビジネスロジック |
| C-03 | AI パイプライン | Transcribe + Nova 2 Lite + ElevenLabs | 音声対話処理 |
| C-04 | WebSocket API | API Gateway WS + Lambda | リアルタイム対話 |
| C-05 | メディアストレージ | Amazon S3 | 音声・画像・動画 |
| C-06 | データベース | Amazon DynamoDB | データ永続化 |
| C-07 | 認証 | Amazon Cognito | 認証・認可 |
| C-08 | 通知 | SES + EventBridge | メール・スケジュール |

---

## サービス一覧

| ID | サービス | 主な責務 |
|---|---|---|
| SVC-01 | RecordingService | Day One 記録 CRUD |
| SVC-02 | VoiceService | クローンボイス生成・対話処理 |
| SVC-03 | UserService | ユーザー管理・BtoB招待 |
| SVC-04 | FormTemplateService | フォーマットテンプレート管理 |
| SVC-05 | RemindService | リマインドスケジュール管理 |
| SVC-06 | ConversationService | 対話セッション管理・履歴保存 |
| SVC-07 | NotificationService | メール通知送信 |

---

## 主要データフロー

### Day One 記録作成フロー
```
Frontend → REST API → DynamoDB（記録保存）
                    → S3（Presigned URL発行）
                    → AI Pipeline（クローンボイス生成・非同期）
                    → SES（生成完了通知）
```

### クローンボイス対話フロー
```
Frontend → WebSocket API → AI Pipeline
                              → Transcribe（STT）
                              → DynamoDB（記録取得）
                              → Nova 2 Lite（LLM応答）
                              → ElevenLabs（TTS）
                           → WebSocket API → Frontend（音声再生）
```

### リマインドフロー
```
EventBridge → Lambda → DynamoDB（対象取得）→ SES（メール送信）
→ ユーザーがリンクをクリック → 対話フロー開始
```

---

## 技術選定の根拠

### Nova Sonic を採用しなかった理由
Nova Sonic（初代・Nova 2 Sonic）は音声→音声の一体型モデルで低レイテンシだが、**日本語非対応**（英語・スペイン語・仏語・伊語・独語のみ）かつ**クローンボイスの差し込みが不可**。Day One のコアバリューである「過去の自分の声で語りかける」を実現できないため不採用。

### ElevenLabs Flash v2.5 を選んだ理由
- 日本語対応（32言語）
- 75ms の超低レイテンシ（リアルタイム対話に十分）
- クローンボイス生成 API が利用可能
- Starter $5/月からスタート可能（ハッカソンデモ規模に最適）

### DynamoDB を選んだ理由
- サーバーレス構成（Lambda）との完全な整合性
- スケールアウトが自動
- RDS のような接続管理が不要（Lambda のコールドスタート問題を回避）

---

## MVP スコープ外（フェーズ2以降）

- BtoB 管理ダッシュボード（US-301〜303）
- Amazon SNS によるプッシュ通知
- スマートフォンアプリ（iOS/Android）
- スマートデバイス連携
- E2E 暗号化

---

## 詳細ドキュメント

- [コンポーネント定義](./components.md)
- [サービス定義](./services.md)
- [メソッド定義](./component-methods.md)
- [依存関係・データフロー](./component-dependency.md)
