# コンポーネント依存関係 — Day One

## 依存関係マトリクス

| 依存元 → 依存先 | C-01 Frontend | C-02 REST API | C-03 AI Pipeline | C-04 WebSocket | C-05 S3 | C-06 DynamoDB | C-07 Cognito | C-08 SES |
|---|---|---|---|---|---|---|---|---|
| **C-01 Frontend** | — | ✅ REST | — | ✅ WS | ✅ Presigned | — | ✅ Auth | — |
| **C-02 REST API** | — | — | ✅ 非同期起動 | — | ✅ Presigned URL | ✅ CRUD | ✅ JWT検証 | ✅ 招待メール |
| **C-03 AI Pipeline** | — | — | — | ✅ 音声送信 | ✅ 音声取得 | ✅ 記録取得 | — | ✅ 完了通知 |
| **C-04 WebSocket** | — | — | ✅ 対話処理 | — | — | ✅ セッション管理 | ✅ JWT検証 | — |
| **C-05 S3** | — | — | — | — | — | — | — | — |
| **C-06 DynamoDB** | — | — | — | — | — | — | — | — |
| **C-07 Cognito** | — | — | — | — | — | — | — | — |
| **C-08 SES** | — | — | — | — | — | ✅ スケジュール取得 | — | — |

---

## データフロー図

### フロー1: Day One 記録作成

```
C-01 Frontend
    |
    | POST /records (フォーマット回答)
    v
C-02 REST API
    |-- DynamoDB に記録保存 --> C-06 DynamoDB
    |-- S3 Presigned URL 発行 --> C-05 S3
    |-- クローンボイス生成ジョブ起動（非同期）
    v
C-03 AI Pipeline
    |-- S3 から録音音声取得 --> C-05 S3
    |-- ElevenLabs Voice Cloning API 呼び出し
    |-- Voice ID を DynamoDB に保存 --> C-06 DynamoDB
    |-- 完了通知メール送信 --> C-08 SES
```

### フロー2: クローンボイス対話セッション

```
C-01 Frontend
    |
    | WebSocket 接続確立（JWT 認証）
    v
C-04 WebSocket API
    |-- JWT 検証 --> C-07 Cognito
    |-- セッション状態保存 --> C-06 DynamoDB
    |
    | 音声チャンク受信
    v
C-03 AI Pipeline
    |-- STT: Amazon Transcribe（音声→テキスト）
    |-- Day One 記録取得 --> C-06 DynamoDB
    |-- LLM: Nova 2 Lite（応答テキスト生成）
    |-- TTS: ElevenLabs Flash v2.5（クローンボイス音声合成）
    |
    | 音声チャンク返送
    v
C-04 WebSocket API
    |
    | 音声ストリーミング
    v
C-01 Frontend（音声再生）
```

### フロー3: リマインド通知

```
Amazon EventBridge Scheduler
    |
    | スケジュール時刻に Lambda 起動
    v
C-08 SES + Lambda
    |-- DynamoDB からリマインド対象取得 --> C-06 DynamoDB
    |-- リマインドメール送信（SES）
    |   メール内容: 「X年前のあなたが話しかけています」
    |   + 対話セッション開始 URL
    v
ユーザー（メール受信）
    |
    | URL クリック
    v
C-01 Frontend → フロー2（対話セッション）
```

### フロー4: BtoB 従業員招待

```
C-01 Frontend（管理者）
    |
    | POST /organizations/invite
    v
C-02 REST API
    |-- Cognito でユーザー事前登録 --> C-07 Cognito
    |-- 招待トークン生成・DynamoDB 保存 --> C-06 DynamoDB
    |-- 招待メール送信 --> C-08 SES
    v
従業員（メール受信）
    |
    | 招待リンクをクリック
    v
C-01 Frontend
    |
    | POST /organizations/join（パスワード設定）
    v
C-02 REST API
    |-- Cognito アカウント有効化 --> C-07 Cognito
    |-- DynamoDB に企業紐付け保存 --> C-06 DynamoDB
```

---

## 外部サービス依存

| 外部サービス | 用途 | 代替案 |
|---|---|---|
| **ElevenLabs Flash v2.5** | クローンボイス生成・TTS | Voxtral TTS（日本語非対応のため現時点では不可） |
| **Amazon Transcribe** | STT（音声→テキスト） | Whisper API |
| **Amazon Bedrock Nova 2 Lite** | LLM（応答生成） | Claude Haiku（コスト高） |
| **Amazon Cognito** | 認証・認可 | Auth0 |
| **Amazon SES** | メール通知 | SendGrid |
| **Amazon EventBridge** | スケジューラー | CloudWatch Events |

---

## 通信パターン

| パターン | 使用箇所 |
|---|---|
| **REST（同期）** | フロントエンド ↔ REST API（記録CRUD・テンプレート管理） |
| **WebSocket（双方向）** | フロントエンド ↔ WebSocket API（リアルタイム音声対話） |
| **S3 Presigned URL** | フロントエンド → S3（メディアアップロード・ダウンロード） |
| **非同期（Lambda 直接起動）** | REST API → AI Pipeline（クローンボイス生成） |
| **EventBridge → Lambda** | スケジューラー → 通知サービス（リマインド） |
