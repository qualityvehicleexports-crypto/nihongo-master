import type { Dictionary } from "./types";
import { isLanguageCode, type LanguageCode } from "./languages";
import ja from "./dictionaries/ja";
import en from "./dictionaries/en";
import vi from "./dictionaries/vi";
import id from "./dictionaries/id";
import tl from "./dictionaries/tl";
import my from "./dictionaries/my";
import zh from "./dictionaries/zh";
import ne from "./dictionaries/ne";
import km from "./dictionaries/km";
import mn from "./dictionaries/mn";
import th from "./dictionaries/th";
import si from "./dictionaries/si";

const DICTIONARIES: Record<LanguageCode, Dictionary> = { ja, en, vi, id, tl, my, zh, ne, km, mn, th, si };

/** Looks up a learner's dictionary. Falls back to Japanese for an unknown/empty code. */
export function getDictionary(code: string | null | undefined): Dictionary {
  if (code && isLanguageCode(code)) return DICTIONARIES[code];
  return ja;
}

// Simple {placeholder} interpolation, e.g. t(dict.level.backToHome, { name: "Taro" }).
// Not a method on Dictionary itself so it stays a plain data object (easy to
// json-serialize, easy for translator agents to produce).
export function t(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

export type { Dictionary } from "./types";
export { LANGUAGES, LANGUAGE_CODES, isLanguageCode, languageMeta, localeTag } from "./languages";
export type { LanguageCode, LanguageMeta } from "./languages";
