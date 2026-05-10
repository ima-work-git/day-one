# Unit 2 AI 対話パイプライン — Functional Design 質問

Unit 2（AI 対話パイプライン）の実装に向けた質問です。
各質問の `[Answer]:` の後に選択肢のアルファベットを記入してください。

---

## Question 1
MVP の最初のデモとして、どの機能から動かしますか？

A) まず音声なしのテキスト対話から始める（WebSocket でテキスト送受信 → LLM 応答）
B) 最初から音声対話（STT → LLM → TTS の完全パイプライン）
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 2
Amazon Transcribe の STT 方式はどれを使いますか？

A) Streaming Transcription（リアルタイム。音声チャンクを送りながら逐次テキスト化）
B) StartTranscriptionJob（非同期バッチ。音声ファイル全体をアップロードして処理）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
ElevenLabs TTS の音声ストリーミング方式はどれを使いますか？

A) HTTP Streaming（`/v1/text-to-speech/{voice_id}/stream`。シンプルで実装しやすい）
B) WebSocket Streaming（ElevenLabs の WebSocket API。より低レイテンシだが複雑）
C) Other (please describe after [Answer]: tag below)

[Answer]: A。ただしAとBでエンドユーザ側で1,2秒以上変わってくるなら検討必要。Aの場合ってAIから音声重なったりする事故起きたりしない？一般的にBのイメージがあるんだよね。

---

## Question 4
クローンボイス生成（ElevenLabs Voice Cloning）のタイミングはどうしますか？

A) 録音完了直後に即座に生成（ユーザーが待つ。30秒〜数分かかる可能性）
B) バックグラウンドで非同期生成（録音後すぐに次の操作へ進める。完了時に通知）
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5
System Prompt の構成はどうしますか？（LLM に「過去の自分」として振る舞わせる）

A) シンプル（Day 1 記録の全テキストをそのまま注入）
B) 構造化（役割・記録日・各フォーマット項目を整理して注入）
C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 6
対話セッションの会話履歴はどこまで保持しますか？（LLM のコンテキストウィンドウ管理）

A) 直近10ターン（コスト・レイテンシのバランス）
B) セッション全体（Nova 2 Lite は 1M トークンコンテキストなので全部保持可能）
C) Other (please describe after [Answer]: tag below)

[Answer]: B。でも、レイテンシが増えるなら、直近10ターン+要約+構造化。
