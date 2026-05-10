# アプリケーション設計概要 — Day 1

## 設計サマリ

| 項目 | 決定内容 |
|---|---|
| **バックエンド** | サーバーレス（AWS Lambda + API Gateway） |
| **フロントエンド** | Next.js（App Router）/ AWS Amplify |
| **LLM** | Amazon Bedrock Nova 2 Lite（1M context、価格はBedrock Pricingに準拠） |
| **TTS** | ElevenLabs Flash v2.5（日本語対応・75ms・クローンボイス対応） |
| **STT** | Amazon Transcribe |
| **データベース** | Amazon DynamoDB（フルサーバーレス構成） |
| **ストレージ** | Amazon S3（Presigned URL） |
| **認証** | Amazon Cognito（MVPは簡易登録・デモリンク、BtoB招待リンクはフェーズ2） |
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
| SVC-01 | RecordingService | Day 1 記録 CRUD |
| SVC-02 | VoiceService | クローンボイス生成・対話処理 |
| SVC-03 | UserService | ユーザー管理・BtoB招待（フェーズ2） |
| SVC-04 | FormTemplateService | フォーマットテンプレート管理 |
| SVC-05 | RemindService | リマインドスケジュール管理 |
| SVC-06 | ConversationService | 対話セッション管理・履歴保存 |
| SVC-07 | NotificationService | メール通知送信 |

---

## 主要データフロー

### Day 1 記録作成フロー
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
MVP: 運営者が研修用リンクまたは簡易メールを共有
フェーズ2: EventBridge → Lambda → DynamoDB（対象取得）→ SES（メール送信）
→ ユーザーがリンクをクリック → 対話フロー開始
```

---

## 技術選定の根拠

### Nova 2 Sonic を採用しなかった理由
Amazon Nova 2 Sonic（2025/12 リリース）は speech-to-speech 一体型モデルで低レイテンシのリアルタイム会話 AI を実現するが、Day 1 では採用しない。**決定的理由はクローンボイス機能がないこと** — Nova 2 Sonic は内蔵音声で応答するモデルで、特定話者（本人）の音声クローンを差し込む API がない。Day 1 のコアバリューである「過去の自分の声で応えてくれる双方向対話」を実現できないため不採用。加えて日本語は公式サポート外（英語・スペイン語・ドイツ語・フランス語・イタリア語・ポルトガル語・ヒンディー語のみ）。

### ElevenLabs Flash v2.5 を選んだ理由
- 日本語対応（32 言語）
- 75ms の超低レイテンシ（リアルタイム対話に十分）
- クローンボイス生成 API（Instant Voice Cloning：30 秒〜2 分の音声サンプル）
- 有料プランで商用利用可（最新条件は ElevenLabs 利用規約・料金ページに準拠）
- 録音前の本人同意取得が必須（FR-09 参照）

### DynamoDB を選んだ理由
- サーバーレス構成（Lambda）との完全な整合性
- スケールアウトが自動
- RDS のような接続管理が不要（Lambda のコールドスタート問題を回避）

---

## AI 機能の失敗時挙動（フォールバック設計）

実サービス品質を保つため、AI パイプライン各段の失敗時挙動を設計する。

| 失敗ケース | フォールバック | ユーザー通知 |
|---|---|---|
| クローンボイス生成失敗（ElevenLabs） | 通常 TTS（Amazon Polly）へフォールバックして対話継続 | 「クローンボイスを再生成できます」のリトライ導線 |
| AI 応答が遅い（5 秒超） | ローディング文言・スピナー表示 | 「考えています...」 |
| 録音品質が低い（無音・低音量・高ノイズ） | クライアント側で判定し再録音を案内 | 「もう少し大きな声で／静かな場所で再録音してください」 |
| STT 失敗（Transcribe） | テキスト入力モードへ切り替え | 「音声認識ができませんでした。テキスト入力に切り替えますか？」 |
| LLM エラー（Bedrock スロットリング等） | エラーメッセージ＋リトライボタン | 「混み合っています。もう一度お試しください」 |
| WebSocket 切断 | 自動再接続を最大 3 回試行 | 切断バナー → 再接続成功時に解除 |
| 外部 API（ElevenLabs）レート制限 | キューに溜めて非同期処理。完了時にメール通知 | 「クローンボイスを準備中です。完了次第お知らせします」 |

詳細は [要件定義書 NFR-07](../requirements/requirements.md#nfr-07-ai-機能の失敗時挙動フォールバック) を参照。

---

## MVP スコープ外（フェーズ2以降）

- BtoB 管理ダッシュボード（US-301〜303）
- 組織テンプレート編集・一括招待・企業単位の自動リマインド配信
- Amazon SNS によるプッシュ通知
- スマートフォンアプリ（iOS/Android）
- スマートデバイス連携
- E2E 暗号化
- **会話記憶・継続対話機能**（FR-08）: 前回の対話内容を構造化して記憶し、次回の冒頭の問いかけに活用する

---

## 詳細ドキュメント

- [コンポーネント定義](./components.md)
- [サービス定義](./services.md)
- [メソッド定義](./component-methods.md)
- [依存関係・データフロー](./component-dependency.md)
