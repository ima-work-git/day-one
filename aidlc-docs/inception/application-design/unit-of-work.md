# Unit of Work 定義 — Day One

## 分割方針

**機能ドメイン別**（モノレポ構成）

- 各ユニットに集中して開発できる
- Q4の「まず会話パイプラインを動かす」優先順位と整合
- モノレポ内でディレクトリを分けて管理

## リポジトリ構成

```
day-one/                          # モノレポルート
├── frontend/                     # Unit 4: Next.js フロントエンド
│   ├── app/
│   ├── components/
│   └── package.json
├── backend/
│   ├── api/                      # Unit 3: REST API Lambda
│   ├── ai-pipeline/              # Unit 2: AI 対話パイプライン Lambda
│   ├── websocket/                # Unit 2: WebSocket Lambda
│   └── notification/             # Unit 3: 通知 Lambda
├── infra/                        # Unit 1: AWS CDK インフラ定義
│   ├── lib/
│   └── bin/
├── shared/                       # 共通型定義・ユーティリティ
└── package.json
```

---

## ユニット一覧

### Unit 1: インフラ基盤（Infrastructure Foundation）

**優先度**: 最初に構築（他ユニットの前提）
**実装期間目安**: 1〜2日

**スコープ**:
- AWS CDK によるインフラ定義（IaC）
- DynamoDB テーブル作成（Users・DayOneRecords・VoiceModels・ConversationSessions・RemindSchedules・FormTemplates・Organizations）
- S3 バケット作成・バケットポリシー設定
- Amazon Cognito User Pool 設定（BtoB/BtoC・Google ソーシャルログイン）
- API Gateway（REST + WebSocket）のスタブ作成
- Amazon SES ドメイン検証・送信設定
- EventBridge Scheduler 設定
- IAM ロール・ポリシー設定
- AWS Amplify ホスティング設定

**完了条件**:
- `cdk deploy` で全リソースが AWS 上に作成される
- DynamoDB・S3・Cognito が正常に動作確認できる

---

### Unit 2: AI 対話パイプライン（AI Conversation Pipeline）

**優先度**: 最優先（ハッカソンのコアバリュー）
**実装期間目安**: 3〜5日

**スコープ**:
- WebSocket API Lambda（接続・メッセージ・切断ハンドラ）
- AI 対話処理 Lambda:
  - Amazon Transcribe による STT（音声→テキスト）
  - Amazon Bedrock Nova 2 Lite による LLM 応答生成
  - ElevenLabs Flash v2.5 による TTS（クローンボイス音声合成）
  - System Prompt Builder（Day One 記録から「過去の自分」プロンプト構築）
- ElevenLabs Voice Cloning API 連携（クローンボイス生成）
- 対話セッション管理（DynamoDB ConversationSessions）
- 振り返りメモ保存 API

**MVP デモ最小構成**（まず動かすもの）:
1. WebSocket 接続確立
2. ユーザー音声 → Transcribe（STT）→ テキスト
3. テキスト → Nova 2 Lite（LLM）→ 応答テキスト
4. 応答テキスト → ElevenLabs（TTS）→ 音声
5. 音声をクライアントへストリーミング返送

**完了条件**:
- ブラウザから音声で話しかけると、クローンボイスで応答が返ってくる
- 応答開始まで 2〜3 秒以内

---

### Unit 3: 記録・ユーザー管理（Recording & User Management）

**優先度**: Unit 2 と並行または直後
**実装期間目安**: 3〜4日

**スコープ**:
- ユーザー認証 API（Cognito 連携・JWT 検証）
- Day One 記録 CRUD API（作成・取得・更新・削除）
- フォーマットテンプレート管理 API（デフォルト5種・カスタム保存）
- S3 Presigned URL 発行 API（音声・画像・動画アップロード）
- クローンボイス生成ジョブ起動・状態管理 API
- リマインドスケジュール管理 API
- BtoB 招待リンク発行 API（MVP 簡易版：手動リンク共有）
- 通知 Lambda（SES メール送信：リマインド・生成完了・招待）

**完了条件**:
- 記録の作成・取得・削除が API 経由で動作する
- 音声ファイルを S3 にアップロードできる
- クローンボイス生成ジョブが起動し、完了通知メールが届く

---

### Unit 4: フロントエンド（Frontend）

**優先度**: Unit 1・2・3 と並行（UI モックから開始可能）
**実装期間目安**: 4〜5日

**スコープ**:
- Next.js プロジェクト初期設定（App Router・Tailwind CSS）
- 認証フロー（ログイン・登録・Cognito 連携）
- ホーム画面（Day One 記録一覧・選択）
- Day One 記録フォーム（ガイド付きフォーマット・カスタマイズ UI）
- 音声録音 UI（テキスト読み上げ収録・録音コントロール）
- クローンボイス対話 UI（WebSocket 接続・音声ストリーミング再生）
- リマインド設定 UI
- 振り返りメモ入力 UI

**完了条件**:
- ブラウザから記録作成→音声収録→対話の一連フローが動作する
- レスポンシブ対応（スマートフォンブラウザでも動作）

---

## 実装順序（推奨）

```
Week 1（書類審査後〜予選準備）:
  Day 1-2: Unit 1（インフラ基盤）
  Day 3-5: Unit 2（AI対話パイプライン）← 最優先
  Day 3-5: Unit 4（フロントエンド・モック）← 並行

Week 2（予選デモ準備）:
  Day 6-8: Unit 3（記録・ユーザー管理）
  Day 6-8: Unit 4（フロントエンド・API連携）← 並行
  Day 9-10: 統合テスト・デモ準備
```

---

## 技術スタック（確定）

| レイヤー | 技術 |
|---|---|
| フロントエンド | Next.js（App Router）/ Tailwind CSS / AWS Amplify |
| バックエンド | AWS Lambda（Node.js）/ API Gateway |
| AI パイプライン | Amazon Transcribe / Bedrock Nova 2 Lite / ElevenLabs Flash v2.5 |
| データベース | Amazon DynamoDB |
| ストレージ | Amazon S3 |
| 認証 | Amazon Cognito |
| 通知 | Amazon SES / EventBridge |
| IaC | AWS CDK（TypeScript）|
| リポジトリ | モノレポ（GitHub）|
