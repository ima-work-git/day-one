# Unit of Work 依存関係 — Day One

## 依存関係マトリクス

| ユニット | Unit 1 インフラ | Unit 2 AI対話 | Unit 3 記録・ユーザー | Unit 4 フロントエンド |
|---|---|---|---|---|
| **Unit 1 インフラ** | — | 提供（DynamoDB・S3・Cognito） | 提供（DynamoDB・S3・Cognito・SES） | 提供（Amplify・API GW） |
| **Unit 2 AI対話** | 依存 | — | 依存（記録取得API） | 提供（WebSocket API） |
| **Unit 3 記録・ユーザー** | 依存 | 依存（Voice Cloning起動） | — | 提供（REST API） |
| **Unit 4 フロントエンド** | 依存 | 依存（WebSocket） | 依存（REST API） | — |

---

## 依存関係図

```
Unit 1: インフラ基盤
    |
    | AWS リソース提供（DynamoDB・S3・Cognito・SES・API GW）
    |
    +----------+----------+
    |          |          |
    v          v          v
Unit 2      Unit 3      Unit 4
AI対話      記録・ユーザー  フロントエンド
    |          |          |
    |          | REST API  |
    |          +--------->|
    |                     |
    | WebSocket API        |
    +-------------------->|
```

---

## ユニット間インターフェース

### Unit 2 → Unit 3（記録取得）
```
GET /records/{recordId}
→ DayOneRecord（フォーマット回答・Voice ID）
→ System Prompt 構築に使用
```

### Unit 3 → Unit 2（クローンボイス生成起動）
```
POST /voice/clone
→ 音声 S3 キー・ユーザー ID を渡す
→ 非同期で ElevenLabs Voice Cloning を実行
```

### Unit 2 → Unit 4（WebSocket）
```
WebSocket: wss://api.day-one.app/ws
→ 音声チャンク送受信
→ セッション開始・終了イベント
```

### Unit 3 → Unit 4（REST API）
```
REST: https://api.day-one.app/v1
→ 記録 CRUD・テンプレート・リマインド・認証
```

---

## 並行開発可能な組み合わせ

| フェーズ | 並行作業 |
|---|---|
| Phase 1 | Unit 1（インフラ）のみ |
| Phase 2 | Unit 2（AI対話）+ Unit 4（フロントモック） |
| Phase 3 | Unit 3（記録・ユーザー）+ Unit 4（API連携） |
| Phase 4 | 統合テスト |

**注意**: Unit 4 は Unit 1 完了前でも UI モック（静的）として開発開始可能。API 連携は Unit 2・3 完了後に実施。

---

## クリティカルパス

```
Unit 1（インフラ）
    → Unit 2（AI対話パイプライン）← ここが最重要・最長
        → Unit 4（WebSocket UI連携）
            → 統合テスト・デモ
```

Unit 2 の AI 対話パイプラインがクリティカルパス上にあり、最優先で着手する。
