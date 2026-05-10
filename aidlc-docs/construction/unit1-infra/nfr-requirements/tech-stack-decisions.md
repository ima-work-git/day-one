# Unit 1 インフラ基盤 — Tech Stack Decisions

## 確定した技術スタック

| レイヤー | 技術 | 選定理由 |
|---|---|---|
| IaC | AWS CDK（TypeScript） | 型安全・エコシステム充実・Cognito等の出力値を自動注入可能 |
| コンピュート | AWS Lambda | サーバーレス・自動スケール・コスト効率 |
| API | Amazon API Gateway（REST + WebSocket） | Lambda との統合が容易・WebSocket 対応 |
| データベース | Amazon DynamoDB（オンデマンド） | サーバーレス構成との整合・自動スケール・接続管理不要 |
| ストレージ | Amazon S3 | 大容量音声・動画ファイルの保存・Presigned URL 対応 |
| 認証 | Amazon Cognito | BtoB 招待リンク対応・JWT 管理・Google ログイン拡張可能 |
| フロントエンド | Next.js / AWS Amplify | CDK との統合で環境変数自動注入・GitHub 連携デプロイ |
| 通知 | Amazon SES + EventBridge | AWS ネイティブ・スケジューラー機能内蔵 |
| LLM | Amazon Bedrock Nova 2 Lite | AWS ネイティブ・低コスト・1M トークンコンテキスト |
| STT | Amazon Transcribe | AWS ネイティブ・ストリーミング対応・日本語対応 |
| TTS | ElevenLabs Flash v2.5 | 日本語対応・75ms 低レイテンシ・クローンボイス生成対応 |

## MVP と本番の実装差分

| 項目 | MVP 実装 | 本番目標 |
|---|---|---|
| 監視 | CloudWatch Logs のみ | CloudWatch Alarm + X-Ray |
| セキュリティ | S3 SSE + HTTPS + Cognito | + KMS + CloudTrail + VPC + WAF |
| バックアップ | PITR のみ | PITR + 月次スナップショット |
| Cognito | メール認証のみ | + Google ソーシャルログイン |
| SES | サンドボックスモード | 本番モード（ドメイン検証・サンドボックス解除） |
| Lambda | デフォルト設定 | メモリ・タイムアウト最適化済み |

## スケールアップ戦略

```
フェーズ1（〜1,000同時接続）:
  - Lambda オンデマンド
  - DynamoDB オンデマンド
  - 追加設定不要

フェーズ2（〜10,000同時接続）:
  - Lambda Provisioned Concurrency（AI パイプライン）
  - DynamoDB キャパシティ監視・必要に応じてプロビジョニング

フェーズ3（〜100,000同時接続）:
  - マルチリージョン検討（東京 + 大阪）
  - DynamoDB グローバルテーブル
  - CloudFront CDN 追加
```
