// Sample JLPT-style content for all five levels (N5 -> N1).
//
// IMPORTANT: this is a representative sample for demoing the product, not the
// full JLPT syllabus. Real N5-N1 coverage runs to several thousand vocabulary
// items, ~200-600 grammar patterns, and licensed listening audio per level.
// Swap this file (or feed the same shape into the DB) once real curriculum
// content / a licensed content partner is in place.

export type LevelCode = "N5" | "N4" | "N3" | "N2" | "N1";

export const LEVELS: { id: LevelCode; nameJa: string; nameEn: string; sortOrder: number }[] = [
  { id: "N5", nameJa: "N5(入門)", nameEn: "N5 — Beginner", sortOrder: 1 },
  { id: "N4", nameJa: "N4(初級)", nameEn: "N4 — Elementary", sortOrder: 2 },
  { id: "N3", nameJa: "N3(中級)", nameEn: "N3 — Intermediate", sortOrder: 3 },
  { id: "N2", nameJa: "N2(中上級)", nameEn: "N2 — Upper Intermediate", sortOrder: 4 },
  { id: "N1", nameJa: "N1(上級)", nameEn: "N1 — Advanced", sortOrder: 5 },
];

export interface VocabSeed {
  term: string;
  reading: string;
  meaningJa: string;
  meaningEn: string;
  example: string;
}

export interface GrammarSeed {
  pattern: string;
  meaningEn: string;
  example: string;
}

export type QuestionCategory = "vocabulary" | "grammar" | "listening" | "reading";

export interface QuestionSeed {
  category: QuestionCategory;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

interface LevelContent {
  vocab: VocabSeed[];
  grammar: GrammarSeed[];
  questions: QuestionSeed[];
}

export const CONTENT: Record<LevelCode, LevelContent> = {
  N5: {
    vocab: [
      { term: "食べる", reading: "たべる", meaningJa: "食事をする", meaningEn: "to eat", example: "朝ごはんを食べます。" },
      { term: "学校", reading: "がっこう", meaningJa: "勉強するところ", meaningEn: "school", example: "毎日学校へ行きます。" },
      { term: "水", reading: "みず", meaningJa: "飲み物", meaningEn: "water", example: "水を飲みます。" },
      { term: "大きい", reading: "おおきい", meaningJa: "サイズが大きい", meaningEn: "big", example: "これは大きい犬です。" },
      { term: "友達", reading: "ともだち", meaningJa: "仲がいい人", meaningEn: "friend", example: "友達と遊びます。" },
      { term: "毎日", reading: "まいにち", meaningJa: "日々", meaningEn: "every day", example: "毎日日本語を勉強します。" },
      { term: "電車", reading: "でんしゃ", meaningJa: "乗り物", meaningEn: "train", example: "電車で会社に行きます。" },
      { term: "忙しい", reading: "いそがしい", meaningJa: "時間がない", meaningEn: "busy", example: "今週はとても忙しいです。" },
    ],
    grammar: [
      { pattern: "〜ています", meaningEn: "ongoing action / current state", example: "今、勉強しています。" },
      { pattern: "〜たいです", meaningEn: "want to do", example: "日本へ行きたいです。" },
      { pattern: "〜ないでください", meaningEn: "please don't do", example: "ここで写真を撮らないでください。" },
      { pattern: "〜前に", meaningEn: "before doing", example: "寝る前に歯を磨きます。" },
      { pattern: "〜ことができます", meaningEn: "can do", example: "私は漢字を読むことができます。" },
    ],
    questions: [
      { category: "vocabulary", prompt: "「食べる」の意味はどれですか。", choices: ["to eat", "to drink", "to sleep", "to run"], correctIndex: 0, explanation: "「食べる」= to eat。" },
      { category: "vocabulary", prompt: "「忙しい」の意味はどれですか。", choices: ["quiet", "busy", "beautiful", "boring"], correctIndex: 1, explanation: "「忙しい」= busy。" },
      { category: "vocabulary", prompt: "「でんしゃ」を漢字で書くとどれですか。", choices: ["電車", "電話", "自転車", "飛行機"], correctIndex: 0, explanation: "でんしゃ = 電車 (train)。" },
      { category: "grammar", prompt: "「毎日日本語を＿＿。」空欄に入るのはどれですか。", choices: ["勉強します", "勉強たいです", "勉強ています", "勉強前に"], correctIndex: 0, explanation: "習慣を表す現在形「勉強します」が自然です。" },
      { category: "grammar", prompt: "「ここで写真を＿＿ください。」空欄に入るのはどれですか。", choices: ["撮って", "撮らないで", "撮る", "撮りたい"], correctIndex: 1, explanation: "禁止のお願いは「〜ないでください」。" },
      { category: "grammar", prompt: "「寝る＿＿歯を磨きます。」空欄に入るのはどれですか。", choices: ["前に", "後で", "ながら", "とき、"], correctIndex: 0, explanation: "「〜前に」= before doing。" },
      { category: "listening", prompt: "（会話）A「明日、何をしますか。」B「友達と映画を見ます。」\n質問：Bさんは明日何をしますか。", choices: ["勉強します", "映画を見ます", "電車に乗ります", "水を飲みます"], correctIndex: 1, explanation: "Bは「映画を見ます」と答えています。" },
      { category: "listening", prompt: "（会話）A「学校まで何で行きますか。」B「電車で行きます。」\n質問：学校までの交通手段はどれですか。", choices: ["バス", "電車", "自転車", "徒歩"], correctIndex: 1, explanation: "「電車で行きます」と言っています。" },
      { category: "listening", prompt: "（会話）A「今日は忙しいですか。」B「いいえ、あまり忙しくないです。」\n質問：Bさんは今日忙しいですか。", choices: ["とても忙しい", "あまり忙しくない", "わからない", "少し忙しい"], correctIndex: 1, explanation: "「あまり忙しくない」= not very busy。" },
      { category: "reading", prompt: "（文章）わたしは毎日六時に起きます。朝ごはんを食べてから、電車で学校へ行きます。\n質問：「わたし」はいつ起きますか。", choices: ["五時", "六時", "七時", "八時"], correctIndex: 1, explanation: "「毎日六時に起きます」とあります。" },
      { category: "reading", prompt: "（文章）土曜日、友達と大きい公園へ行きました。天気がよかったです。\n質問：どこへ行きましたか。", choices: ["学校", "公園", "駅", "図書館"], correctIndex: 1, explanation: "「大きい公園へ行きました」とあります。" },
      { category: "reading", prompt: "（文章）田中さんは水を三本買いました。\n質問：田中さんは何を買いましたか。", choices: ["パン", "水", "電車の切符", "本"], correctIndex: 1, explanation: "「水を三本買いました」とあります。" },
    ],
  },
  N4: {
    vocab: [
      { term: "経験", reading: "けいけん", meaningJa: "実際にやったこと", meaningEn: "experience", example: "海外で働いた経験があります。" },
      { term: "準備", reading: "じゅんび", meaningJa: "前もって用意すること", meaningEn: "preparation", example: "旅行の準備をします。" },
      { term: "説明", reading: "せつめい", meaningJa: "わかるように話すこと", meaningEn: "explanation", example: "先生が文法を説明します。" },
      { term: "世界", reading: "せかい", meaningJa: "全ての国", meaningEn: "world", example: "世界には多くの国があります。" },
      { term: "台風", reading: "たいふう", meaningJa: "強い風の嵐", meaningEn: "typhoon", example: "台風が近づいています。" },
      { term: "用意", reading: "ようい", meaningJa: "準備すること", meaningEn: "readiness", example: "夕食の用意をしています。" },
      { term: "天気予報", reading: "てんきよほう", meaningJa: "天気の予測", meaningEn: "weather forecast", example: "天気予報を見ます。" },
      { term: "招待", reading: "しょうたい", meaningJa: "呼ぶこと", meaningEn: "invitation", example: "パーティーに招待されました。" },
    ],
    grammar: [
      { pattern: "〜そうです", meaningEn: "looks like / seems", example: "雨が降りそうです。" },
      { pattern: "〜ようになる", meaningEn: "come to be able to", example: "漢字が読めるようになりました。" },
      { pattern: "〜たら", meaningEn: "if / when", example: "時間があったら、電話してください。" },
      { pattern: "〜のに", meaningEn: "although / even though", example: "頑張ったのに、失敗しました。" },
      { pattern: "〜ばかり", meaningEn: "only / just", example: "彼はゲームばかりしています。" },
    ],
    questions: [
      { category: "vocabulary", prompt: "「準備」の意味はどれですか。", choices: ["preparation", "invitation", "experience", "explanation"], correctIndex: 0, explanation: "「準備」= preparation。" },
      { category: "vocabulary", prompt: "「台風」の意味はどれですか。", choices: ["typhoon", "rainbow", "snow", "earthquake"], correctIndex: 0, explanation: "「台風」= typhoon。" },
      { category: "vocabulary", prompt: "「しょうたい」を漢字で書くとどれですか。", choices: ["招待", "紹介", "招介", "承知"], correctIndex: 0, explanation: "しょうたい = 招待 (invitation)。" },
      { category: "grammar", prompt: "「空が暗いです。雨が＿＿。」空欄に入るのはどれですか。", choices: ["降りそうです", "降ったら", "降るのに", "降りばかり"], correctIndex: 0, explanation: "見た目から予想する時は「〜そうです」。" },
      { category: "grammar", prompt: "「毎日練習して、漢字が読める＿＿なりました。」空欄に入るのはどれですか。", choices: ["ように", "そうに", "のに", "ばかりに"], correctIndex: 0, explanation: "「〜ようになる」= come to be able to。" },
      { category: "grammar", prompt: "「時間があっ＿＿、電話してください。」空欄に入るのはどれですか。", choices: ["たら", "ても", "のに", "ばかり"], correctIndex: 0, explanation: "「〜たら」= if / when。" },
      { category: "listening", prompt: "（会話）A「明日のパーティー、行きますか。」B「招待されたので、行くつもりです。」\n質問：Bさんはどうしますか。", choices: ["行かない", "行くつもりです", "考え中です", "招待していません"], correctIndex: 1, explanation: "「行くつもりです」と答えています。" },
      { category: "listening", prompt: "（会話）A「明日の天気はどうですか。」B「天気予報によると、台風が来るそうです。」\n質問：明日の天気はどうなりそうですか。", choices: ["晴れ", "台風が来る", "雪が降る", "変わらない"], correctIndex: 1, explanation: "「台風が来るそうです」と言っています。" },
      { category: "listening", prompt: "（会話）A「旅行の準備はできましたか。」B「いいえ、まだ用意していません。」\n質問：Bさんの旅行の準備はどうですか。", choices: ["終わった", "まだしていない", "半分終わった", "必要ない"], correctIndex: 1, explanation: "「まだ用意していません」と言っています。" },
      { category: "reading", prompt: "（文章）田中さんは海外で働いた経験があるので、英語で説明するのが上手です。\n質問：田中さんはなぜ英語の説明が上手ですか。", choices: ["学校で習ったから", "海外で働いた経験があるから", "本を読んだから", "先生だから"], correctIndex: 1, explanation: "「海外で働いた経験があるので」が理由です。" },
      { category: "reading", prompt: "（文章）今週末、台風が来るそうです。天気予報を見て、旅行の予定を変えるかもしれません。\n質問：なぜ予定を変えるかもしれませんか。", choices: ["友達がいないから", "台風が来るかもしれないから", "お金がないから", "仕事があるから"], correctIndex: 1, explanation: "台風が来るという予報のためです。" },
      { category: "reading", prompt: "（文章）山田さんは頑張って勉強したのに、試験に落ちてしまいました。\n質問：山田さんはどうでしたか。", choices: ["合格した", "頑張ったが不合格だった", "勉強しなかった", "試験を受けなかった"], correctIndex: 1, explanation: "「〜のに」は逆接：努力したのに結果が伴わなかった。" },
    ],
  },
  N3: {
    vocab: [
      { term: "影響", reading: "えいきょう", meaningJa: "他に及ぼす作用", meaningEn: "influence", example: "天気は気分に影響します。" },
      { term: "状況", reading: "じょうきょう", meaningJa: "その時の様子", meaningEn: "situation", example: "今の状況を説明してください。" },
      { term: "判断", reading: "はんだん", meaningJa: "考えて決めること", meaningEn: "judgment", example: "冷静に判断します。" },
      { term: "割合", reading: "わりあい", meaningJa: "全体に対する比率", meaningEn: "ratio / proportion", example: "女性の割合が増えています。" },
      { term: "環境", reading: "かんきょう", meaningJa: "周りの状態", meaningEn: "environment", example: "働く環境を整えます。" },
      { term: "対策", reading: "たいさく", meaningJa: "問題への対応", meaningEn: "countermeasure", example: "台風の対策をします。" },
      { term: "傾向", reading: "けいこう", meaningJa: "そうなりやすい性質", meaningEn: "tendency", example: "若者の傾向を調べます。" },
      { term: "維持", reading: "いじ", meaningJa: "そのまま保つこと", meaningEn: "maintenance", example: "健康を維持します。" },
    ],
    grammar: [
      { pattern: "〜わけではない", meaningEn: "doesn't necessarily mean", example: "嫌いなわけではありません。" },
      { pattern: "〜さえ〜ば", meaningEn: "as long as / if only", example: "時間さえあれば行けます。" },
      { pattern: "〜にとって", meaningEn: "for / from the perspective of", example: "学生にとって試験は大切です。" },
      { pattern: "〜おかげで", meaningEn: "thanks to", example: "先生のおかげで合格しました。" },
      { pattern: "〜つつある", meaningEn: "in the process of", example: "状況は改善しつつあります。" },
    ],
    questions: [
      { category: "vocabulary", prompt: "「判断」の意味はどれですか。", choices: ["judgment", "environment", "tendency", "maintenance"], correctIndex: 0, explanation: "「判断」= judgment。" },
      { category: "vocabulary", prompt: "「割合」の意味はどれですか。", choices: ["ratio / proportion", "influence", "countermeasure", "situation"], correctIndex: 0, explanation: "「割合」= ratio / proportion。" },
      { category: "vocabulary", prompt: "「たいさく」を漢字で書くとどれですか。", choices: ["対策", "対象", "体策", "対作"], correctIndex: 0, explanation: "たいさく = 対策 (countermeasure)。" },
      { category: "grammar", prompt: "「肉が嫌いな＿＿、あまり食べません。」空欄に入るのはどれですか。", choices: ["わけではありませんが", "さえあれば", "にとって", "おかげで"], correctIndex: 0, explanation: "「〜わけではない」= 部分否定。" },
      { category: "grammar", prompt: "「時間＿＿あれば、旅行に行けます。」空欄に入るのはどれですか。", choices: ["さえ", "こそ", "つつ", "ばかり"], correctIndex: 0, explanation: "「〜さえ〜ば」= as long as。" },
      { category: "grammar", prompt: "「先生の＿＿、無事に合格できました。」空欄に入るのはどれですか。", choices: ["おかげで", "せいで", "わけで", "うえで"], correctIndex: 0, explanation: "良い結果には「〜おかげで」を使います。" },
      { category: "listening", prompt: "（会話）A「最近、忙しいですか。」B「忙しいですが、嫌いなわけではありません。」\n質問：Bさんは仕事についてどう思っていますか。", choices: ["嫌いだ", "忙しいが嫌いではない", "楽だ", "辞めたい"], correctIndex: 1, explanation: "「嫌いなわけではありません」と言っています。" },
      { category: "listening", prompt: "（会話）A「環境問題について何か対策がありますか。」B「ゴミを減らす対策を進めています。」\n質問：どんな対策をしていますか。", choices: ["ゴミを減らす", "水を増やす", "電車を止める", "何もしない"], correctIndex: 0, explanation: "「ゴミを減らす対策」と言っています。" },
      { category: "listening", prompt: "（会話）A「景気はどうですか。」B「少しずつ回復しつつあります。」\n質問：景気の状況はどれですか。", choices: ["悪化している", "回復している最中", "完全に回復した", "変化がない"], correctIndex: 1, explanation: "「〜つつある」は進行中を表します。" },
      { category: "reading", prompt: "（文章）近年、リモートワークをする人の割合が増えている。働く環境が変わりつつあるといえる。\n質問：文章の内容と合っているのはどれですか。", choices: ["リモートワークは減っている", "働く環境は変化している", "環境は変わっていない", "誰も在宅勤務をしていない"], correctIndex: 1, explanation: "「働く環境が変わりつつある」とあります。" },
      { category: "reading", prompt: "（文章）今の状況を冷静に判断し、必要な対策を取ることが重要だ。\n質問：筆者が重要だと言っていることは何ですか。", choices: ["感情的に決めること", "冷静な判断と対策", "何もしないこと", "他人に任せること"], correctIndex: 1, explanation: "「冷静に判断し、対策を取ること」が重要だと述べています。" },
      { category: "reading", prompt: "（文章）健康を維持するためには、運動だけでなく食事や睡眠の管理も欠かせない。\n質問：健康維持に必要だと言われているのはどれですか。", choices: ["運動だけ", "運動・食事・睡眠", "睡眠だけ", "何も必要ない"], correctIndex: 1, explanation: "運動・食事・睡眠の管理が挙げられています。" },
    ],
  },
  N2: {
    vocab: [
      { term: "概念", reading: "がいねん", meaningJa: "物事の大まかな意味", meaningEn: "concept", example: "新しい概念を学びます。" },
      { term: "促進", reading: "そくしん", meaningJa: "物事を早く進めること", meaningEn: "promotion / acceleration", example: "経済の促進を図ります。" },
      { term: "抽象的", reading: "ちゅうしょうてき", meaningJa: "具体的でないこと", meaningEn: "abstract", example: "抽象的な説明では分かりません。" },
      { term: "一致", reading: "いっち", meaningJa: "同じになること", meaningEn: "agreement / match", example: "意見が一致しました。" },
      { term: "矛盾", reading: "むじゅん", meaningJa: "つじつまが合わないこと", meaningEn: "contradiction", example: "話に矛盾があります。" },
      { term: "補う", reading: "おぎなう", meaningJa: "足りない部分を満たす", meaningEn: "to compensate / supplement", example: "不足を補います。" },
      { term: "見なす", reading: "みなす", meaningJa: "そうだと判断する", meaningEn: "to regard as", example: "無回答は反対と見なします。" },
      { term: "妥協", reading: "だきょう", meaningJa: "譲り合って合意すること", meaningEn: "compromise", example: "お互いに妥協します。" },
    ],
    grammar: [
      { pattern: "〜にもかかわらず", meaningEn: "despite / in spite of", example: "努力したにもかかわらず失敗した。" },
      { pattern: "〜あげく", meaningEn: "after all (negative result)", example: "悩んだあげく、諦めた。" },
      { pattern: "〜を問わず", meaningEn: "regardless of", example: "経験を問わず応募できます。" },
      { pattern: "〜に応じて", meaningEn: "according to / in response to", example: "実力に応じてクラスを分けます。" },
      { pattern: "〜次第だ", meaningEn: "depends on", example: "成功するかは努力次第だ。" },
    ],
    questions: [
      { category: "vocabulary", prompt: "「矛盾」の意味はどれですか。", choices: ["contradiction", "compromise", "promotion", "concept"], correctIndex: 0, explanation: "「矛盾」= contradiction。" },
      { category: "vocabulary", prompt: "「抽象的」の反対の意味に近い言葉はどれですか。", choices: ["具体的", "促進的", "一致的", "妥協的"], correctIndex: 0, explanation: "抽象的 ⇔ 具体的。" },
      { category: "vocabulary", prompt: "「だきょう」を漢字で書くとどれですか。", choices: ["妥協", "妥協", "打境", "他協"], correctIndex: 0, explanation: "だきょう = 妥協 (compromise)。" },
      { category: "grammar", prompt: "「努力した＿＿、結果は出なかった。」空欄に入るのはどれですか。", choices: ["にもかかわらず", "を問わず", "に応じて", "次第だ"], correctIndex: 0, explanation: "「〜にもかかわらず」= despite。" },
      { category: "grammar", prompt: "「長時間悩んだ＿＿、計画を中止した。」空欄に入るのはどれですか。", choices: ["あげく", "にもかかわらず", "を問わず", "次第だ"], correctIndex: 0, explanation: "「〜あげく」= 悪い結果に至る経緯。" },
      { category: "grammar", prompt: "「参加資格は経験＿＿、誰でも応募できます。」空欄に入るのはどれですか。", choices: ["を問わず", "に応じて", "あげく", "次第だ"], correctIndex: 0, explanation: "「〜を問わず」= regardless of。" },
      { category: "listening", prompt: "（会話）A「新しいシステムの導入はどうですか。」B「業務の促進にとても役立っています。」\n質問：新システムはどう評価されていますか。", choices: ["役に立っている", "役に立っていない", "まだ導入していない", "反対されている"], correctIndex: 0, explanation: "「業務の促進に役立っている」と評価しています。" },
      { category: "listening", prompt: "（会話）A「彼の説明、分かりましたか。」B「いいえ、抽象的すぎて分かりませんでした。」\n質問：Bさんはなぜ分からなかったのですか。", choices: ["説明が具体的すぎたから", "説明が抽象的だったから", "説明を聞かなかったから", "興味がなかったから"], correctIndex: 1, explanation: "「抽象的すぎて」と理由を述べています。" },
      { category: "listening", prompt: "（会話）A「二人の意見は一致しましたか。」B「いいえ、最後はお互いに妥協しました。」\n質問：結果はどうなりましたか。", choices: ["完全に一致した", "妥協点を見つけた", "対立したままだ", "話し合いをやめた"], correctIndex: 1, explanation: "「お互いに妥協しました」と言っています。" },
      { category: "reading", prompt: "（文章）このデータには明らかな矛盾があり、報告書の内容をそのまま信用することはできない。\n質問：筆者は報告書についてどう考えていますか。", choices: ["完全に信頼できる", "矛盾があり信頼しにくい", "内容が正確だ", "何も問題がない"], correctIndex: 1, explanation: "「矛盾があり、信用できない」と述べています。" },
      { category: "reading", prompt: "（文章）給与は各人の実力に応じて決定される。年齢や経験年数を問わず、成果を重視する制度である。\n質問：この給与制度の特徴はどれですか。", choices: ["年齢を最も重視する", "実力・成果を重視する", "経験年数だけで決まる", "全員同じ給与になる"], correctIndex: 1, explanation: "「実力に応じて」「成果を重視」とあります。" },
      { category: "reading", prompt: "（文章）長時間の議論のあげく、両者は妥協案を受け入れることにした。\n質問：議論の結果はどうなりましたか。", choices: ["決裂した", "妥協案を受け入れた", "議論を続けている", "誰も納得しなかった"], correctIndex: 1, explanation: "「妥協案を受け入れることにした」とあります。" },
    ],
  },
  N1: {
    vocab: [
      { term: "曖昧", reading: "あいまい", meaningJa: "はっきりしないこと", meaningEn: "ambiguous / vague", example: "曖昧な返事をされました。" },
      { term: "遂行", reading: "すいこう", meaningJa: "物事をやり遂げること", meaningEn: "execution / carrying out", example: "任務を遂行します。" },
      { term: "円滑", reading: "えんかつ", meaningJa: "物事がスムーズに進むこと", meaningEn: "smooth", example: "円滑に進めます。" },
      { term: "是正", reading: "ぜせい", meaningJa: "誤りを正すこと", meaningEn: "correction / rectification", example: "格差を是正します。" },
      { term: "潜在的", reading: "せんざいてき", meaningJa: "表に出ていないこと", meaningEn: "potential / latent", example: "潜在的な needs があります。" },
      { term: "顕著", reading: "けんちょ", meaningJa: "はっきり目立つこと", meaningEn: "marked / prominent", example: "効果が顕著に表れました。" },
      { term: "逸脱", reading: "いつだつ", meaningJa: "本筋から外れること", meaningEn: "deviation", example: "規則から逸脱しています。" },
      { term: "秩序", reading: "ちつじょ", meaningJa: "正しい順序や決まり", meaningEn: "order", example: "社会の秩序を守ります。" },
    ],
    grammar: [
      { pattern: "〜きらいがある", meaningEn: "tend to (negative nuance)", example: "彼は結論を急ぐきらいがある。" },
      { pattern: "〜べからず", meaningEn: "must not", example: "立ち入るべからず。" },
      { pattern: "〜にたえない", meaningEn: "cannot bear to / cannot help but", example: "見るにたえない光景だ。" },
      { pattern: "〜ならでは", meaningEn: "unique to / only possible because of", example: "これは職人ならではの技術だ。" },
      { pattern: "〜を余儀なくされる", meaningEn: "be forced to", example: "計画の中止を余儀なくされた。" },
    ],
    questions: [
      { category: "vocabulary", prompt: "「曖昧」の意味はどれですか。", choices: ["ambiguous / vague", "smooth", "prominent", "orderly"], correctIndex: 0, explanation: "「曖昧」= ambiguous / vague。" },
      { category: "vocabulary", prompt: "「顕著」の意味はどれですか。", choices: ["marked / prominent", "latent", "smooth", "deviant"], correctIndex: 0, explanation: "「顕著」= marked / prominent。" },
      { category: "vocabulary", prompt: "「ぜせい」を漢字で書くとどれですか。", choices: ["是正", "是製", "制正", "是政"], correctIndex: 0, explanation: "ぜせい = 是正 (correction)。" },
      { category: "grammar", prompt: "「彼の説明は要点が＿＿きらいがある。」空欄に入るのはどれですか。", choices: ["ずれる", "ずれた", "ずれて", "ずれ"], correctIndex: 0, explanation: "「〜きらいがある」の前は動詞辞書形。" },
      { category: "grammar", prompt: "「その惨状は目を覆う＿＿ものだった。」空欄に入るのはどれですか。", choices: ["にたえない", "べからず", "ならでは", "を余儀なくされる"], correctIndex: 0, explanation: "「〜にたえない」= 直視できないほど酷い。" },
      { category: "grammar", prompt: "「台風のため、イベントの中止＿＿。」空欄に入るのはどれですか。", choices: ["を余儀なくされた", "にたえない", "べからず", "きらいがある"], correctIndex: 0, explanation: "「〜を余儀なくされる」= 強制的にそうせざるを得ない。" },
      { category: "listening", prompt: "（会話）A「今回のプロジェクトは順調ですか。」B「はい、想定より円滑に進んでいます。」\n質問：プロジェクトの状況はどれですか。", choices: ["問題が多い", "順調に進んでいる", "中止になった", "遅れている"], correctIndex: 1, explanation: "「円滑に進んでいます」と答えています。" },
      { category: "listening", prompt: "（会話）A「彼の返答についてどう思いますか。」B「正直、曖昧で判断しかねます。」\n質問：Bさんは彼の返答をどう感じていますか。", choices: ["明確だ", "曖昧で分かりにくい", "とても具体的だ", "満足している"], correctIndex: 1, explanation: "「曖昧で判断しかねます」と述べています。" },
      { category: "listening", prompt: "（会話）A「規則から逸脱した行為があったそうですね。」B「はい、社内で秩序を是正する動きが出ています。」\n質問：社内ではどんな動きがありますか。", choices: ["規則を廃止する", "秩序を是正しようとしている", "何もしない", "逸脱を推奨する"], correctIndex: 1, explanation: "「秩序を是正する動き」と言っています。" },
      { category: "reading", prompt: "（文章）本制度は潜在的な需要を掘り起こすことを目的としており、効果はすでに顕著に表れている。\n質問：この文章の内容と合っているのはどれですか。", choices: ["効果はまだ出ていない", "効果ははっきり表れている", "制度は失敗した", "需要は存在しない"], correctIndex: 1, explanation: "「効果はすでに顕著に表れている」とあります。" },
      { category: "reading", prompt: "（文章）予期せぬ事態により、当初の計画は大幅な変更を余儀なくされたが、関係者の努力により業務は円滑に遂行された。\n質問：業務の結果はどうでしたか。", choices: ["計画通りに何も変えず進んだ", "変更を強いられたが円滑に遂行された", "完全に失敗した", "誰も対応しなかった"], correctIndex: 1, explanation: "「変更を余儀なくされたが、円滑に遂行された」とあります。" },
      { category: "reading", prompt: "（文章）彼の主張には根拠が乏しく、事実から逸脱しているきらいがあるため、慎重に検討すべきだ。\n質問：筆者は彼の主張をどう見ていますか。", choices: ["信頼できると評価している", "事実から外れている可能性を懸念している", "全く興味がない", "秩序があると称賛している"], correctIndex: 1, explanation: "「事実から逸脱しているきらいがある」と懸念を示しています。" },
    ],
  },
};
