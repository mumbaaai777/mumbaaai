import { en, type Dict } from './en';
import { hi } from './hi';
import { mr } from './mr';
import type { Lang } from '../types';

/**
 * Language registry. To add a language (e.g. Gujarati):
 *   1. create gu.ts exporting `gu: Dict` (TypeScript will flag any missing key)
 *   2. add it to LANGUAGES below and to the `Lang` union in types.ts
 *   3. the Ask Aai worker accepts any BCP-47 code, so no backend change is needed.
 */
export const LANGUAGES: { code: Lang; label: string; htmlLang: string; bcp47: string }[] = [
  { code: 'en', label: 'English', htmlLang: 'en', bcp47: 'en-IN' },
  { code: 'hi', label: 'हिन्दी', htmlLang: 'hi', bcp47: 'hi-IN' },
  { code: 'mr', label: 'मराठी', htmlLang: 'mr', bcp47: 'mr-IN' },
];

export const dictionaries: Record<Lang, Dict> = { en, hi, mr };

export function getDict(lang: Lang): Dict {
  return dictionaries[lang] ?? en;
}

/** Replace {name} placeholders. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

export function detectLang(): Lang {
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'en').toLowerCase();
  if (nav.startsWith('mr')) return 'mr';
  if (nav.startsWith('hi')) return 'hi';
  return 'en';
}

export type { Dict };
