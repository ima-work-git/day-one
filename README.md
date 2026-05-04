# Day One — 過去の自分が、今の自分を救う。

人は誰でも「Day One」を持っている。

入社初日の熱量。ダイエットを決意した朝。試合で負けた悔しさ。
あの瞬間の自分は、今の自分より強かった。

でも時間が経つと、その感情は薄れる。「初心に戻れ」と言われても、具体的にどうすればいいかわからない。

**Day One は、過去の自分の声で今の自分に語りかける。**
クローンボイス技術で再現された「あの日の自分」が、Day Twoになりかけているあなたに問いかける。

*「なぜ、始めたんだっけ？」*

---

## Day One カルチャーを、個人の人生へ

Amazonが提唱する「Day 1」とは、常に創業初日の緊張感・顧客への執着・発明への意欲を持ち続けることを指す。
組織が Day 2 に陥ると、意思決定は遅くなり、顧客から離れ、やがて停滞する。

この現象は、組織だけでなく個人にも起きる。

入社2年目の社員は、入社初日の熱量を忘れる。
ダイエットを始めた人は、2ヶ月後に決意を忘れる。
受験を決めた高校生は、受験期に「なぜ目指したか」を忘れる。

Day One は、Amazonが組織に問い続ける「Day 1精神」を、個人の人生に届けるサービスだ。
過去の自分の声を記録し、Day Two になりかけたときに、その声で語りかける。

---

## どう動くか

**1. 記録する（Day One）**
ガイド付きフォーマットで「今の気持ち・動機・やりたいこと・なりたい自分・なりたくない自分」をテキストで入力する。

**2. 声を残す**
入力した文章を読み上げながら録音する。クローンボイスが生成される。

**3. 対話する（Day Two になったとき）**
ホーム画面から話しかけたい「Day Oneの自分」を選択する。
過去の自分の声（クローンボイス）がリアルタイムで語りかけてくる。双方向AI対話で、初心を取り戻す。

---

## こんな人に

| シーン | Day One の使い方 |
|---|---|
| 🏢 **入社2年目の社員** | 入社初日の熱量を研修で振り返り、原点回帰 |
| 🥗 **ダイエット中の人** | 挫折しそうな夜、決意した日の自分の声を聞く |
| ⚾ **プロ野球選手** | 試合で打てなかった悔しさを保存し、練習の原動力に |
| 📚 **受験生** | 高1で記録した夢を、高3の受験期に思い出す |
| 🔄 **更生施設の利用者** | 出所日の決意を定期的に振り返り、再犯を防ぐ |

---

## 技術スタック

すべて AWS 上で稼働するクラウドネイティブ設計。

| レイヤー | 技術 |
|---|---|
| フロントエンド | [Next.js](https://nextjs.org/) / [AWS Amplify](https://aws.amazon.com/amplify/) |
| バックエンド | [AWS Lambda](https://aws.amazon.com/lambda/) + [API Gateway](https://aws.amazon.com/api-gateway/)（サーバーレス） |
| 音声認識（STT） | [Amazon Transcribe](https://aws.amazon.com/transcribe/) |
| LLM（応答生成） | [Amazon Bedrock Nova 2 Lite](https://aws.amazon.com/bedrock/) |
| クローンボイス（TTS） | [ElevenLabs Flash v2.5](https://elevenlabs.io/)（75ms・日本語対応） |
| データベース | [Amazon DynamoDB](https://aws.amazon.com/dynamodb/) |
| ストレージ | [Amazon S3](https://aws.amazon.com/s3/) |
| 認証 | [Amazon Cognito](https://aws.amazon.com/cognito/) |
| 通知 | [Amazon SES](https://aws.amazon.com/ses/) + [EventBridge](https://aws.amazon.com/eventbridge/) |
| IaC | [AWS CDK](https://aws.amazon.com/cdk/)（TypeScript）|

---

## ビジネスモデル

| セグメント | 提供価値 | 収益モデル |
|---|---|---|
| **BtoB（企業研修）** | 入社時の熱量を数年後に届ける仕組み。エンゲージメント向上・キャリア自立支援 | 月額・年額サブスクリプション（企業単位） |
| **BtoC（個人）** | ダイエット・スポーツ・受験など、あらゆる「決意」を守る | 月額・年額サブスクリプション（個人単位） |
| **教育機関** | 高校・大学がキャリア教育の一環として導入。高校生には無料配布 | 機関契約 |

---

## ドキュメント

| ドキュメント | 内容 |
|---|---|
| [要件定義書](aidlc-docs/inception/requirements/requirements.md) | 機能要件・非機能要件・ユーザーシナリオ |
| [ペルソナ定義](aidlc-docs/inception/user-stories/personas.md) | 5つのユーザーペルソナ |
| [ユーザーストーリー](aidlc-docs/inception/user-stories/stories.md) | ユーザーストーリー・受け入れ基準 |
| [アプリケーション設計](aidlc-docs/inception/application-design/application-design.md) | コンポーネント構成・サービス定義・データフロー |
| [Unit of Work](aidlc-docs/inception/application-design/unit-of-work.md) | 開発ユニット分割・実装優先順位 |

---

*Built with [AI-DLC Workflow](https://github.com/awslabs/aidlc-workflows) on [Kiro](https://kiro.dev)*
