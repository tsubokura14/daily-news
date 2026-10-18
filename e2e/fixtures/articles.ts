import type { Article, DailyList } from "../../src/shared/articles.ts";

// 画面を撮るための記事。合意した画面（記事の並びと文言）に合わせて作る。
// 日付は 2026-10-17（土）。7:00 より後に取得した、ふつうの日の一覧

export const LATEST_DATE = "2026-10-17";

const hn = (id: number): Pick<Article, "id" | "source"> => ({
  id: `hn-${id}`,
  source: "hackernews",
});

/** キーワードに関連する記事8件と、キーワード外の記事3件。表示する順 */
export const articles: Article[] = [
  {
    ...hn(1),
    titleEn: "Remote code execution in a widely used compression library",
    url: "https://openwall.com/lists/oss-security/zip-rce",
    domain: "openwall.com",
    reaction: 5,
    ai: {
      titleJa: "広く使われる圧縮ライブラリに、遠隔からコードを実行できる脆弱性",
      summary:
        "多くの Linux ディストリビューションが標準で入れている圧縮ライブラリに、細工したファイルを展開させるだけで任意のコードを実行できる不具合が見つかった。原因は、圧縮の辞書の大きさを確かめずにメモリへ書き込む処理で、10年以上前のバージョンから含まれていた。修正版はすでに公開されており、主なディストリビューションも更新を配り始めている。コメント欄では、ライブラリを1人で保守している体制の危うさが議論になっている。",
      importance: 5,
    },
    keyword: { relevance: 5, keywords: ["脆弱性", "Linux"], category: "セキュリティ" },
  },
  {
    ...hn(2),
    titleEn: "Fine-tuning a 7B model on a single consumer GPU, end to end",
    url: "https://huggingface.co/blog/finetune-7b-consumer-gpu",
    domain: "huggingface.co",
    reaction: 3,
    ai: {
      titleJa: "小型の言語モデルを、手元の GPU 1枚で学習し直す手順の解説",
      summary:
        "量子化と、学習する重みを一部に絞る手法を組み合わせ、家庭用の GPU 1枚で 70 億パラメータのモデルを学習し直す手順をまとめた記事。データの用意から評価までを順に追っており、学習にかかった時間は数百円ほどだという。精度は大きな GPU で学習した場合とほぼ変わらなかった。社内の文書を使って、問い合わせ対応のモデルを作る例も載せている。",
      importance: 4,
    },
    keyword: { relevance: 5, keywords: ["ファインチューニング", "LLM"], category: "AI" },
  },
  {
    ...hn(3),
    titleEn: "We rewrote our package manager in Rust",
    url: "https://blog.example.dev/rewrote-package-manager-in-rust",
    domain: "blog.example.dev",
    reaction: 5,
    ai: {
      titleJa: "Rust で書き直したパッケージ管理ツール、インストールが10倍速く",
      summary:
        "Python のパッケージ管理ツールを Rust で書き直した開発チームが、依存関係の解決とキャッシュの設計を説明している。依存関係の候補を並列に取り行い、一度取ったものはハードリンクで使い回すことで、大きなプロジェクトでのインストール時間が約10分の1になった。既存のツールと同じ設定ファイルを読めるため、移行の手間は小さいという。",
      importance: 3,
    },
    keyword: { relevance: 5, keywords: ["Rust", "Python"], category: "言語・ツール" },
  },
  {
    ...hn(4),
    titleEn: "Post-incident review: 6-hour outage in us-east",
    url: "https://status.cloud.example/postmortem-us-east",
    domain: "status.cloud.example",
    reaction: 4,
    ai: {
      titleJa: "大手クラウドで6時間の障害、原因は設定の自動配布の誤り",
      summary:
        "大手クラウドの一部の地域で、約6時間にわたって多くのサービスが使えなくなった障害の報告書が公開された。ネットワークの設定を自動で配る仕組みが、誤った設定をすべての機器へ一度に配ったことが原因だった。段階的に配る仕組みはあったが、緊急の変更として扱われたため使われなかった。今後は緊急の変更でも、配る範囲を少しずつ広げるようにするという。",
      importance: 4,
    },
    keyword: { relevance: 4, keywords: ["AWS"], category: "クラウド" },
  },
  {
    ...hn(5),
    titleEn: "EU finalizes training-data disclosure rules for AI developers",
    url: "https://reuters.example.com/eu-ai-training-data-rules",
    domain: "reuters.com",
    reaction: 4,
    ai: {
      titleJa: "EU、AI の開発元に学習データの開示を求める規則を最終決定",
      summary:
        "EU が、大規模な AI モデルの開発元に、学習に使ったデータの概要を公開するよう求める規則を最終的に決めた。著作物を使った場合は、権利者が確かめられる程度の詳しさで書く必要がある。適用は来年の夏からで、違反すると売上の一定の割合の罰金が科される。コメント欄では、オープンソースのモデルにも同じ義務がかかるのかが議論になっている。",
      importance: 4,
    },
    keyword: { relevance: 4, keywords: ["AI", "LLM", "規制"], category: "AI" },
  },
  {
    ...hn(6),
    postType: "show",
    titleEn: "Show HN: A tiny TUI for browsing SQLite and Postgres",
    url: "https://github.com/example/dbtui",
    domain: "github.com",
    reaction: 4,
    ai: {
      titleJa: "ターミナルで動く、軽量なデータベースの閲覧ツール",
      summary:
        "作者が自分で作った、SQLite と Postgres の中身をターミナルの中で見て回れるツールを公開した。キー操作だけでテーブルの移動、列の並べ替え、絞り込みができ、SQL を書かなくても目的の行にたどり着ける。1つの実行ファイルで動き、設定は要らない。作者はコメント欄で、今後の予定として MySQL への対応と、結果を CSV に書き出す機能を挙げている。",
      importance: 3,
    },
    keyword: { relevance: 4, keywords: ["PostgreSQL", "SQLite"], category: "データ・DB" },
  },
  {
    ...hn(7),
    titleEn: "Automaker to put in-house designed chips in next-gen EVs",
    url: "https://electrek.example.co/in-house-chips-next-gen-ev",
    domain: "electrek.co",
    reaction: 3,
    ai: {
      titleJa: "大手自動車メーカー、次の EV に自社で設計した半導体を載せる",
      summary:
        "大手自動車メーカーが、次の世代の EV に、自社で設計した半導体を載せると発表した。自動運転の処理と電池の管理を1つのチップにまとめ、部品の数と消費電力を減らす。半導体の不足で生産が止まった経験から、設計を自社に取り込む動きが自動車業界に広がっている。",
      importance: 3,
    },
    keyword: { relevance: 3, keywords: ["EV", "半導体"], category: "機械・電機" },
  },
  {
    ...hn(8),
    postType: "ask",
    titleEn: "Ask HN: How do small teams do code review?",
    url: "https://news.ycombinator.com/item?id=8",
    domain: "news.ycombinator.com",
    reaction: 3,
    ai: {
      titleJa: "小さなチームで、コードレビューをどう回していますか",
      summary:
        "5人前後のチームで、コードレビューをどう分担しているかを尋ねる投稿。全員が交代で見る、変更の大きさで見る人数を変える、といった回答が集まっている。待ち時間を減らす工夫として、小さな変更に分けて出す、午前と午後に見る時間を決める、という声も多い。AI に一次レビューを任せ、人は設計の確認に集中しているというチームもある。",
      importance: 3,
    },
    keyword: { relevance: 3, keywords: ["コードレビュー"], category: "開発手法" },
  },
  {
    ...hn(9),
    titleEn: "Battery life deep dive: the new ARM laptops",
    url: "https://anandtech.example.com/arm-laptop-battery",
    domain: "anandtech.com",
    reaction: 5,
    ai: {
      titleJa: "新しい ARM 系ノート PC の電池の持ちを実測、前の世代より4割長く",
      summary:
        "新しい ARM 系のプロセッサを積んだノート PC を、動画の再生、ブラウザの操作、ソフトの組み立て（ビルド）の3つの使い方で比べた。前の世代より電池が約4割長く持ち、性能を上げたときの発熱も少なかった。一方で、一部の古いソフトは変換して動かすため、速さが半分ほどに落ちる場面があった。",
      importance: 3,
    },
  },
  {
    ...hn(10),
    titleEn: "Reverse-engineering a 1970s calculator chip from die photos",
    url: "https://righto.example.com/calculator-chip",
    domain: "righto.com",
    reaction: 5,
    ai: {
      titleJa: "古い電卓の回路を、顕微鏡写真から読み解く",
      summary:
        "1970年代の電卓のチップを顕微鏡で撮影し、写真から回路を読み解いた記事。数字の表示を少ないトランジスタで実現する工夫や、計算を1桁ずつ順に処理する仕組みを、図を使って説明している。当時の設計者が手で描いた回路図との比べ方も紹介している。",
      importance: 2,
    },
  },
  {
    ...hn(11),
    titleEn: "Deep-sea microbes produce oxygen without light",
    url: "https://nature.example.com/dark-oxygen",
    domain: "nature.com",
    reaction: 3,
    ai: {
      titleJa: "深海の微生物が、光のない環境で酸素を作る仕組みを解明",
      summary:
        "深海の堆積物にいる微生物が、光合成をせずに酸素を作る反応の流れを、研究チームが突き止めたとみられる。窒素を含む化合物を分解する途中で酸素ができるという。地球の外で生命を探すときの手がかりになる可能性がある。（本文を読めなかったため、タイトルからの推測を含む）",
      importance: 2,
    },
  },
];

export const defaultList: DailyList = { date: LATEST_DATE, status: "ok", articles };

/** 記事が多い日。同じカードが縦に続く */
export const manyList: DailyList = {
  date: LATEST_DATE,
  status: "ok",
  articles: Array.from({ length: 30 }, (_, i) => {
    const base = articles[i % articles.length];
    return { ...base, id: `hn-${1000 + i}` };
  }),
};

/** 取得に失敗した日。記事がない */
export const failedList: DailyList = { date: LATEST_DATE, status: "failed", articles: [] };

/** AI を使えなかった日。英語タイトルだけで、反響の順 */
export const noAiList: DailyList = {
  date: "2026-10-15",
  status: "no-ai",
  articles: articles
    .map(({ ai: _ai, keyword: _keyword, ...rest }) => rest)
    .sort((a, b) => b.reaction - a.reaction),
};
