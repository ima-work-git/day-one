# 要件確認質問

idea.md の内容をもとに、サービス「Day 1」の要件を明確にするための質問です。
各質問の `[Answer]:` の後に選択肢のアルファベットを記入してください。
選択肢に該当するものがない場合は最後の選択肢（Other）を選び、自由記述してください。

---

## Question 1
最初にリリースするターゲットセグメントはどれですか？（最も注力するもの1つ）

A) BtoB（企業研修・研修会社）
B) BtoB（婚活・結婚関連）
C) BtoB（刑務所・更生施設）
D) BtoC（個人起業家・フリーランス・スポーツ選手）
E) BtoB・BtoC 両方同時にリリース
F) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
MVP（最初のリリース）として最優先で実装する機能はどれですか？

A) テキスト記録＋クローンボイス生成＋音声対話
B) テキスト・音声・画像の記録＋定期リマインド通知
C) テキスト記録＋定期リマインド通知（クローンボイスは後回し）
D) クローンボイス対話のみに特化したシンプルな体験
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
クローンボイス生成に使用する技術方針はどれですか？

A) 既存のサードパーティAPIを利用する（例：ElevenLabs、Resemble AI など）
B) AWS のサービスを活用して構築する（Amazon Polly 等）
C) 自社でモデルを構築・ファインチューニングする
D) まだ決めていない（要件定義後に技術選定する）
E) Other (please describe after [Answer]: tag below)

[Answer]: A。クローンボイス生成・TTS は既存のサードパーティ API を利用する。AWS では STT、LLM、認証、ストレージ、サーバーレス基盤を中心に活用する。

---

## Question 4
プラットフォームの優先順位はどれですか？

A) スマートフォンアプリ（iOS / Android）を最優先
B) Webアプリケーションを最優先
C) Web＋スマートフォンアプリを同時にリリース
D) スマートスピーカー・家具連携デバイスを最優先
E) Other (please describe after [Answer]: tag below)

[Answer]: B。MVPはBtoB研修文脈で実施するが、企業管理ダッシュボードは含めず、従業員本人のコア体験を優先する。

---

## Question 5
BtoB向けの管理機能（企業ダッシュボード）の優先度はどれですか？

A) MVP に含める（企業管理者が従業員の記録・進捗を管理できる機能）
B) MVP には含めない（まず従業員本人のコア体験を完成させる）
C) 管理機能は別プロダクトとして後から開発する
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 6
「Day 1 の記録」はいつ行うことを想定していますか？（記録タイミング）

A) ユーザーが任意のタイミングで記録する（自由）
B) 特定のイベント時に記録する（入社日・結婚式・出所日など、BtoB側が設定）
C) A と B の両方をサポートする
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 7
「過去の自分との対話」の形式はどれを想定していますか？

A) 事前に録音した音声メッセージを再生する（一方向）
B) クローンボイスがリアルタイムで応答する（双方向AI対話）
C) まず一方向から始め、将来的に双方向に発展させる
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 8
ユーザーデータ（音声・動画・テキスト）の保存・管理方針はどれですか？

A) クラウド保存（AWS S3 等）でどこからでもアクセス可能
B) デバイスローカル保存を基本とし、クラウドはバックアップのみ
C) クラウド保存だが、エンドツーエンド暗号化で高プライバシーを確保
D) Other (please describe after [Answer]: tag below)

[Answer]: A。MVPではクラウド保存を採用し、将来的にエンドツーエンド暗号化を検討する。

---

## Question 9
マネタイズモデルはどれを想定していますか？

A) BtoB向けサブスクリプション（月額・年額）
B) BtoC向けサブスクリプション（月額・年額）
C) BtoB・BtoC 両方のサブスクリプション
D) 初期費用＋保守費用（BtoB向けエンタープライズ契約）
E) フリーミアム（基本無料、プレミアム機能は有料）
F) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 10
ハッカソンの書類審査（2026年5月10日締切）に向けて、設計ドキュメントで特に強調したい点はどれですか？

A) ビジネスインパクト・社会的意義（ターゲットの多様性・課題解決）
B) 技術的な革新性（クローンボイスAI・マルチモーダル記録）
C) ユーザー体験・感情的な価値（初心に戻る体験の設計）
D) スケーラビリティ・ビジネスモデルの拡張性
E) 上記すべてをバランスよく
F) Other (please describe after [Answer]: tag below)

[Answer]: A / C。ビジネスインパクト、ユーザー体験、AWS の Day 1 精神とのテーマ適合性を強調する。

---

## Question 11: セキュリティ拡張
このプロジェクトにセキュリティ拡張ルールを適用しますか？

A) はい — すべてのセキュリティルールをブロッキング制約として適用する（本番グレードのアプリケーション向け推奨）
B) いいえ — セキュリティルールをスキップする（PoC、プロトタイプ、実験的プロジェクト向け）
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 12: プロパティベーステスト拡張
このプロジェクトにプロパティベーステスト（PBT）ルールを適用しますか？

A) はい — すべてのPBTルールをブロッキング制約として適用する（ビジネスロジック・データ変換・ステートフルコンポーネントを持つプロジェクト向け推奨）
B) 部分的 — 純粋関数とシリアライゼーションのラウンドトリップにのみPBTルールを適用する
C) いいえ — PBTルールをスキップする（シンプルなCRUDアプリ・UIのみのプロジェクト向け）
D) Other (please describe after [Answer]: tag below)

[Answer]: C。ハッカソン MVP では必須対象外とし、必要に応じて純粋関数・データ変換部分に限定して追加する。
