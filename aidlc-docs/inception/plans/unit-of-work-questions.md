# Unit of Work 質問 — Day One

システムを並行開発可能なユニットに分解するための質問です。
各質問の `[Answer]:` の後に選択肢のアルファベットを記入してください。

---

## Question 1
開発チームの構成はどれに近いですか？

A) 1〜2名（全員がフルスタック。ユニットを小さく分けても並行開発できない）
B) 3〜4名（フロントエンド担当・バックエンド担当・AI担当などに分けられる）
C) まだ決まっていない
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 2
リポジトリ構成はどれを想定していますか？

A) モノレポ（フロントエンド・バックエンド・インフラを1つのリポジトリで管理）
B) マルチレポ（コンポーネントごとに別リポジトリ）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
ユニットの分割方針はどれが好みですか？

A) レイヤー別（フロントエンド / バックエンドAPI / AI処理 / インフラ）
B) 機能ドメイン別（記録機能 / 音声対話機能 / ユーザー管理 / 通知機能）
C) ハイブリッド（コアAI機能を独立させ、残りはレイヤー別）
D) Other (please describe after [Answer]: tag below)

[Answer]: D。今回の事情に合わせてのおすすめを教えなさい。

---

## Question 4
Construction フェーズでの実装優先順位はどれですか？

A) コアAI機能優先（クローンボイス生成・対話パイプラインを最初に実装）
B) ユーザー体験優先（記録フォーム・認証・基本UIを最初に実装）
C) インフラ優先（AWS環境・DynamoDB・S3・Cognitoを最初に構築）
D) Other (please describe after [Answer]: tag below)

[Answer]: A。本当に最低限の、ユーザが発話して、STT->LLM->TTS、で会話できるようにすることからです。まずはURLを発行してそのwebサイト上で会話できるようにする。

---

## Question 5
ハッカソン書類審査（5/10締切）後の予選（5/30）に向けて、
最初に動くデモとして最低限必要な機能はどれですか？

A) 記録入力 → 音声収録 → クローンボイス生成 → 対話（コアフロー一本）
B) 記録入力 → 音声収録 → クローンボイス生成 → 対話 + リマインド通知
C) 上記に加えてBtoB招待フロー（企業アカウント）も含める
D) Other (please describe after [Answer]: tag below)

[Answer]: A
