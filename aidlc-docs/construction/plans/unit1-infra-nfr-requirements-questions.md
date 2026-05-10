# Unit 1 インフラ基盤 — NFR Requirements 質問

**対象**: 本番製品としての非機能要件（スケーラビリティ・可用性・セキュリティ・パフォーマンス）
**注記**: MVP の実装では一部を簡略化するが、設計としては本番水準を定義する

各質問の `[Answer]:` の後に選択肢のアルファベットを記入してください。

---

## Question 1
同時接続ユーザー数の目標はどれですか？（本番サービスとして）

A) 小規模（〜1,000同時接続。中小企業数社・個人ユーザー数百人規模）
B) 中規模（〜10,000同時接続。企業数十社・個人ユーザー数千人規模）
C) 大規模（〜100,000同時接続。大企業・教育機関含む全国展開）
D) Other (please describe after [Answer]: tag below)

[Answer]: まずはA。売れてきたらB、Cと増やしたい。

---

## Question 2
サービスの目標稼働率（SLA）はどれですか？

A) 99%（月間約7時間のダウンタイム許容）
B) 99.9%（月間約44分のダウンタイム許容）
C) 99.99%（月間約4分のダウンタイム許容。マルチAZ必須）
D) Other (please describe after [Answer]: tag below)

[Answer]: A。

---

## Question 3
データの地理的冗長性はどうしますか？

A) シングルリージョン（東京のみ。コスト最適）
B) マルチリージョン（東京＋大阪。DR対応）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
ユーザーデータ（音声・個人情報）のセキュリティ要件はどれですか？

A) 基本レベル（S3 SSE・HTTPS・Cognito認証）
B) 強化レベル（A + KMS カスタムキー・CloudTrail監査ログ・VPC内Lambda）
C) 最高レベル（B + E2E暗号化・WAF・Shield）
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5
クローンボイス対話のレイテンシ目標はどれですか？（エンドツーエンド）

A) 3秒以内（STT + LLM + TTS の合計。現在の設計値）
B) 2秒以内（より高速なモデル選択・ストリーミング最適化が必要）
C) 1秒以内（リアルタイム会話レベル。高度な最適化が必要）
D) Other (please describe after [Answer]: tag below)

[Answer]: Aだが、2秒も目指したい。しかし現状の選択の時点でモデルは最速のはず。これ以上は費用が爆増しそうだから一旦Aだ。

---

## Question 6
DynamoDB のデータ保持・バックアップ方針はどれですか？

A) PITR（35日間）のみ
B) PITR ＋ 定期オンデマンドバックアップ（月次スナップショット）
C) PITR ＋ 別リージョンへのレプリケーション（グローバルテーブル）
D) Other (please describe after [Answer]: tag below)

[Answer]: A。これって35日間ごとにバックアップをとり、また次の35日後にその時点のバックアップをとりってこと？

---

## Question 7
監視・アラートの要件はどれですか？

A) CloudWatch Logs のみ（手動確認）
B) CloudWatch Alarm（エラー率・レイテンシ閾値超過でメール通知）
C) CloudWatch + AWS X-Ray（分散トレーシング）+ PagerDuty等のオンコール対応
D) Other (please describe after [Answer]: tag below)

[Answer]: Bだが、MVPではA。
