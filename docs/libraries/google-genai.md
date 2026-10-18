# @google/genai

書いた時点のバージョン：2.30.0

Gemini の公式の SDK。Gemini の API（Google AI Studio のキー）を、Node から呼ぶ。

## このプロジェクトで使っているところ

- `src/batch/gemini.ts` の `createGemini`：`new GoogleGenAI({ apiKey })` の `ai.models.generateContent({ model, contents, config })` を呼び、`res.text` を読む
- `config` の `responseMimeType: "application/json"` と `responseJsonSchema` で、返事の形を JSON で指定している。ただし返事の形は守られないことがあるので、受け取ったあと `parseClassifications`・`parseSummary` で形を確かめる
- `systemInstruction` に役割と出し方、`contents` に記事の情報を渡す。本文は `<body>` で囲み、本文の中の指示には従わないよう伝えている
- 呼び出しが例外で失敗したら（回数の上限・認証・通信）、すべて `AiUnavailableError` にして、その日は AI を使わない一覧にする
- モデル名は `config.ts` の既定値か、環境変数 `GEMINI_MODEL`。キーは環境変数 `GEMINI_API_KEY`（なければ AI を使わない）

## 公式

- https://ai.google.dev/gemini-api/docs
- https://github.com/googleapis/js-genai
