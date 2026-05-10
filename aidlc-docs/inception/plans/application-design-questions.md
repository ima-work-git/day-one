# アプリケーション設計 質問

Day 1 のコンポーネント・サービス設計を決めるための質問です。
各質問の `[Answer]:` の後に選択肢のアルファベットを記入してください。

---

## Question 1
バックエンドのアーキテクチャはどれを想定していますか？

A) モノリシック（単一サービス。シンプルで開発が速い）
B) マイクロサービス（機能ごとに独立したサービス。スケーラブルだが複雑）
C) モジュラーモノリス（単一デプロイだが内部はモジュール分割。中間的なアプローチ）
D) サーバーレス（AWS Lambda中心。コスト効率が高いがコールドスタートに注意）
E) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Question 2
フロントエンドのフレームワークはどれを想定していますか？

A) Next.js（React ベース。SSR/SSG対応。フルスタック開発も可能）
B) React（SPA。柔軟性が高い）
C) Vue.js / Nuxt.js
D) まだ決めていない（設計後に選定）
E) Other (please describe after [Answer]: tag below)

[Answer]: A。MVPでは Next.js（App Router）を採用する。

---

## Question 3
クローンボイス生成・AI対話の処理はどこで行いますか？

A) バックエンドAPIサーバー内で処理（シンプルだが負荷が集中）
B) 専用のAI処理サービスとして分離（非同期キュー経由）
C) AWS Lambda などサーバーレス関数として実装
D) まだ決めていない
E) Other (please describe after [Answer]: tag below)

[Answer]: C。AI処理は Lambda ベースで実装する。LLM は Amazon Bedrock Nova 2 Lite、STT は Amazon Transcribe、クローンボイス生成・TTS は ElevenLabs Flash v2.5 を採用する。

---

## Question 4
リアルタイム音声対話（クローンボイスとの双方向対話）の通信方式はどれを想定していますか？

A) WebSocket（双方向リアルタイム通信。対話に最適）
B) HTTP ストリーミング（Server-Sent Events）
C) REST API のポーリング（シンプルだがリアルタイム性が低い）
D) まだ決めていない
E) Other (please describe after [Answer]: tag below)

[Answer]: A。リアルタイム対話には WebSocket を採用する。

---

## Question 5
データベースの構成はどれを想定していますか？

A) RDS（PostgreSQL）のみ（リレーショナル。ユーザー・記録・対話履歴を一元管理）
B) RDS（PostgreSQL）＋ DynamoDB（ユーザーデータはRDS、対話履歴などはDynamoDB）
C) DynamoDB のみ（フルサーバーレス構成）
D) まだ決めていない
E) Other (please describe after [Answer]: tag below)

[Answer]: C。サーバーレス構成との整合性を優先し、DynamoDB のみを採用する。

---

## Question 6
認証・認可の実装方針はどれですか？

A) Amazon Cognito（AWSマネージド。BtoB/BtoC両対応、招待リンク機能も実装可能）
B) 自前JWT認証（柔軟だが実装コストが高い）
C) Auth0 などサードパーティ認証サービス
D) まだ決めていない
E) Other (please describe after [Answer]: tag below)

[Answer]: A。Amazon Cognito を採用する。

---

## Question 7
メディアファイル（音声・画像・動画）の処理パイプラインはどれを想定していますか？

A) クライアント → S3直接アップロード（Presigned URL）→ Lambda でポスト処理
B) クライアント → バックエンドAPI → S3 → Lambda でポスト処理
C) まだ決めていない
D) Other (please describe after [Answer]: tag below)

[Answer]: A。S3 Presigned URL による直接アップロードを採用する。

---

## Question 8
通知（プッシュ通知・メール）の実装はどれを想定していますか？

A) Amazon SES（メール）＋ Amazon SNS（プッシュ通知）
B) Amazon SES（メール）のみ（プッシュ通知は後回し）
C) サードパーティ通知サービス（SendGrid、Firebase Cloud Messaging など）
D) まだ決めていない
E) Other (please describe after [Answer]: tag below)

[Answer]: B。MVPでは Amazon SES によるメール通知のみとし、プッシュ通知はフェーズ2以降で検討する。
