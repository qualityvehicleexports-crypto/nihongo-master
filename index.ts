// Supported learner UI / meaning languages. Chosen to match the main source
// countries for Japan's Specified Skilled Worker (特定技能) and Employment
// for Skill Development (育成就労, formerly the Technical Intern Training
// Program) visa categories, plus English as a common fallback.
//
// "ja" is the administrative default (used for account-owner-facing pages:
// signup, login, billing, the learner-profile picker) — those are assumed to
// be managed by whoever set up the account. Everything a learner interacts
// with directly (level picker, quizzes, results, AI analysis) is rendered in
// the learner's own `ui_language`.

export type LanguageCode =
  | "ja"
  | "en"
  | "vi"
  | "id"
  | "tl"
  | "my"
  | "zh"
  | "ne"
  | "km"
  | "mn"
  | "th"
  | "si";

export interface LanguageMeta {
  code: LanguageCode;
  /** Name written in the language itself, for the picker UI. */
  nativeName: string;
  /** Japanese name, for the account-owner-facing learner creation form. */
  nameJa: string;
  /** English name, used only to instruct the AI narrative generator which language to answer in. */
  englishName: string;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: "ja", nativeName: "日本語", nameJa: "日本語", englishName: "Japanese" },
  { code: "en", nativeName: "English", nameJa: "英語", englishName: "English" },
  { code: "vi", nativeName: "Tiếng Việt", nameJa: "ベトナム語", englishName: "Vietnamese" },
  { code: "id", nativeName: "Bahasa Indonesia", nameJa: "インドネシア語", englishName: "Indonesian" },
  { code: "tl", nativeName: "Tagalog", nameJa: "フィリピン語（タガログ語）", englishName: "Tagalog" },
  { code: "my", nativeName: "မြန်မာဘာသာ", nameJa: "ミャンマー語", englishName: "Burmese" },
  { code: "zh", nativeName: "中文", nameJa: "中国語", englishName: "Chinese" },
  { code: "ne", nativeName: "नेपाली", nameJa: "ネパール語", englishName: "Nepali" },
  { code: "km", nativeName: "ភាសាខ្មែរ", nameJa: "カンボジア語（クメール語）", englishName: "Khmer" },
  { code: "mn", nativeName: "Монгол хэл", nameJa: "モンゴル語", englishName: "Mongolian" },
  { code: "th", nativeName: "ภาษาไทย", nameJa: "タイ語", englishName: "Thai" },
  { code: "si", nativeName: "සිංහල", nameJa: "スリランカ語（シンハラ語）", englishName: "Sinhala" },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as LanguageCode[];

export function isLanguageCode(value: string): value is LanguageCode {
  return (LANGUAGE_CODES as string[]).includes(value);
}

export function languageMeta(code: string): LanguageMeta {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

const LOCALE_TAGS: Record<LanguageCode, string> = {
  ja: "ja-JP",
  en: "en-US",
  vi: "vi-VN",
  id: "id-ID",
  tl: "fil-PH",
  my: "my-MM",
  zh: "zh-CN",
  ne: "ne-NP",
  km: "km-KH",
  mn: "mn-MN",
  th: "th-TH",
  si: "si-LK",
};

/** BCP-47 tag for Date/Number formatting (Intl, toLocaleString), e.g. "vi-VN". */
export function localeTag(code: string): string {
  return isLanguageCode(code) ? LOCALE_TAGS[code] : "ja-JP";
}
