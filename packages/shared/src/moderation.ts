// Quick pre-checks that help admins and RJs spot problems before anything goes on air or online.
// Flags only; an admin always decides.

const ABUSE = [
  // English
  'fuck', 'fck', 'shit', 'bitch', 'bastard', 'asshole', 'dick', 'cunt', 'slut', 'whore', 'motherfucker', 'retard',
  // Hindi / Marathi (roman)
  'chutiya', 'chutiye', 'madarchod', 'mc ', 'bc ', 'bhenchod', 'behenchod', 'bhosdi', 'bhosdike', 'gandu', 'gaandu', 'randi', 'harami',
  'kutta', 'kutte', 'kamina', 'kamine', 'saala kutta', 'lavda', 'lauda', 'lund', 'zavadya', 'zhavadya', 'aighala', 'aaichya', 'bhadwa', 'bhadwe',
  // Devanagari
  'चुतिया', 'चूतिया', 'मादरचोद', 'बहनचोद', 'भेनचोद', 'भोसडी', 'गांडू', 'रंडी', 'हरामी', 'कमीना', 'लवडा', 'लौडा', 'झवाड्या', 'भडवा', 'भडव्या', 'आईघाल्या',
];

export type ModFlag = 'abuse' | 'link' | 'contact' | 'shouting' | 'repeat';

export const MOD_FLAG_LABEL: Record<ModFlag, string> = {
  abuse: 'Abusive word',
  link: 'Has a link',
  contact: 'Phone number or email in text',
  shouting: 'ALL CAPS',
  repeat: 'Repeated text (spam?)',
};

export function checkText(text: string | null | undefined, opts: { allowContact?: boolean; allowLinks?: boolean } = {}): ModFlag[] {
  const t = (text ?? '').trim();
  if (!t) return [];
  const flags: ModFlag[] = [];
  const lower = ' ' + t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ') + ' ';
  if (ABUSE.some((w) => (/^[a-z ]+$/.test(w) ? lower.includes(' ' + w.trim() + ' ') || (w.length > 4 && lower.includes(w.trim())) : lower.includes(w)))) flags.push('abuse');
  if (!opts.allowLinks && /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|in|net|org|xyz|link|ly)\b)/i.test(t)) flags.push('link');
  if (!opts.allowContact && (/(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/.test(t) || /\S+@\S+\.\S+/.test(t))) flags.push('contact');
  const letters = t.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 12 && letters === letters.toUpperCase()) flags.push('shouting');
  if (/(.{3,})\1{3,}/.test(t.replace(/\s+/g, ''))) flags.push('repeat');
  return flags;
}
