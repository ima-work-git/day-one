# Day One — 過去の自分が、今の自分を救う。

> **AWS Summit Japan 2026 AI-DLC ハッカソン出場作品**
> テーマ：「人をダメにするサービスを考えよう！」

---

## 🎯 Day Twoのあなたを、ダメにする。

人は誰でも「Day One」を持っている。

入社初日の熱量。ダイエットを決意した朝。試合で負けた悔しさ。
あの瞬間の自分は、今の自分より強かった。

でも時間が経つと、その感情は薄れる。
「初心に戻れ」と言われても、どうすればいいかわからない。

**Day One は、過去の自分の声で今の自分に語りかける。**

クローンボイス技術で再現された「あの日の自分」が、
Day Twoになりかけているあなたに問いかける。

*「なぜ、始めたんだっけ？」*

これが、Day Twoのあなたをダメにする（＝Day Oneに戻す）サービスです。

---

## 🔗 AWSの「Day 1精神」との共鳴

Amazonは創業以来、「常に Day 1 であれ」という精神を大切にしています。
Day Oneは、その哲学を個人の人生に届けるサービスです。

> *"Day 2 is stasis. Followed by irrelevance. Followed by excruciating, painful decline."*
> — Jeff Bezos

---

## 💡 こんな人に使ってほしい

| シーン | Day One の使い方 |
|---|---|
| 🏢 **入社2年目の社員** | 入社初日の熱量を研修で振り返り、原点回帰 |
| 🥗 **ダイエット中の人** | 挫折しそうな夜、決意した日の自分の声を聞く |
| ⚾ **プロ野球選手** | 試合で打てなかった悔しさを保存し、練習の原動力に |
| 📚 **受験生** | 高1で記録した夢を、高3の受験期に思い出す |
| 🔄 **更生施設の利用者** | 出所日の決意を定期的に振り返り、再犯を防ぐ |

---

## 🛠️ どう動くか

```
1. 記録する（Day One）
   ガイド付きフォーマットで「今の気持ち・動機・やりたいこと・
   なりたくない自分」をテキストで入力

2. 声を残す
   入力した文章を読み上げながら録音
   → クローンボイスが生成される

3. 対話する（Day Two になったとき）
   ホーム画面から「Day Oneの自分と話す」を選択
   → 過去の自分の声（クローンボイス）がリアルタイムで語りかけてくる
   → 双方向AI対話で、初心を取り戻す
```

---

## 🏗️ 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | Next.js / AWS Amplify |
| バックエンド | AWS Lambda + API Gateway（サーバーレス） |
| 音声認識（STT） | Amazon Transcribe |
| LLM（応答生成） | Amazon Bedrock Nova 2 Lite |
| クローンボイス（TTS） | ElevenLabs Flash v2.5（75ms・日本語対応） |
| データベース | Amazon DynamoDB |
| ストレージ | Amazon S3 |
| 認証 | Amazon Cognito |
| 通知 | Amazon SES + EventBridge |
| IaC | AWS CDK（TypeScript）|

**すべて AWS 上で稼働するクラウドネイティブ設計。**

---

## 📊 ビジネスモデル

| セグメント | 提供価値 | 収益モデル |
|---|---|---|
| **BtoB（企業研修）** | 入社時の熱量を数年後に届ける仕組み。エンゲージメント向上・キャリア自立支援 | 月額・年額サブスクリプション（企業単位） |
| **BtoC（個人）** | ダイエット・スポーツ・受験など、あらゆる「決意」を守る | 月額・年額サブスクリプション（個人単位） |
| **教育機関** | 高校・大学がキャリア教育の一環として導入。高校生には無料配布 | 機関契約 |

---

## 🎬 デモ戦略

開発者自身が Day One ユーザーとして、**ダイエット目標を記録してサービスを実際に利用**。
予選・決勝時点での体重変化・モチベーション維持の実績を「生きたデモ」として発表。

*「作った人間が使って、実際に痩せた」— これ以上のデモはない。*

---

## 📁 設計ドキュメント

| ドキュメント | 内容 |
|---|---|
| [要件定義書](aidlc-docs/inception/requirements/requirements.md) | 機能要件・非機能要件・ユーザーシナリオ |
| [ペルソナ定義](aidlc-docs/inception/user-stories/personas.md) | 5つのユーザーペルソナ |
| [ユーザーストーリー](aidlc-docs/inception/user-stories/stories.md) | 18本のユーザーストーリー・受け入れ基準 |
| [アプリケーション設計](aidlc-docs/inception/application-design/application-design.md) | コンポーネント構成・サービス定義・データフロー |
| [Unit of Work](aidlc-docs/inception/application-design/unit-of-work.md) | 開発ユニット分割・実装優先順位 |

---

## 👥 チーム

AWS Summit Japan 2026 AI-DLC ハッカソン参加チーム

---

*Built with [AI-DLC Workflow](https://github.com/awslabs/aidlc-workflows) on [Kiro](https://kiro.dev)*
