# Unit 1 インフラ基盤 — Functional Design 質問

Unit 1（インフラ基盤）の AWS CDK 実装に向けた質問です。
各質問の `[Answer]:` の後に選択肢のアルファベットを記入してください。

---

## Question 1
AWS CDK の言語はどれを使いますか？

A) TypeScript（推奨。型安全・エコシステムが充実）
B) Python
C) Other (please describe after [Answer]: tag below)

[Answer]: A。だけどAIのあなたが使う場合、Bも推奨になりませんか？

---

## Question 2
デプロイ先の AWS リージョンはどこですか？

A) ap-northeast-1（東京）← 日本語サービスのため推奨
B) us-east-1（バージニア）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
AWS アカウントの環境分離はどうしますか？

A) 1アカウント・1環境（dev のみ。シンプルで素早く始められる）
B) 1アカウント・複数環境（dev/prod をスタック名で分離）
C) 複数アカウント（dev/prod で別アカウント）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
DynamoDB のキャパシティモードはどれにしますか？

A) オンデマンド（PAY_PER_REQUEST）← 初期・ハッカソン向け。コスト予測しやすい
B) プロビジョニング済み（固定キャパシティ）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5
Cognito の Google ソーシャルログインは MVP に含めますか？

A) はい（Google OAuth 設定が必要。Google Cloud Console でクライアントID取得済みか確認が必要）
B) いいえ（メール＋パスワードのみ。後から追加）
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 6
AWS SES のメール送信ドメインはありますか？

A) ある（独自ドメインを持っている）
B) ない（SES のサンドボックスモードで開始。検証済みメールアドレスのみ送信可能）
C) Other (please describe after [Answer]: tag below)

[Answer]: C。分からない。imazato.work.aws@gmail.com　とかはメール送信ドメインには当てはまらない？多分無いんだろうな。

---

## Question 7
AWS Amplify のホスティングは CDK で管理しますか？

A) はい（CDK で Amplify アプリを定義する）
B) いいえ（Amplify は手動でコンソールから設定する）
C) Other (please describe after [Answer]: tag below)

[Answer]: A。こっちの方が簡単便利だと思っている。違ったら教えて。
