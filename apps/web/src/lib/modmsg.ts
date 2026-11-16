// Friendly block message when a submission contains abusive words (admin still reviews everything else).
import { checkText } from '@mumbaaai/shared';
const MSG = {
  en: 'Please remove the offensive words and try again. Mumbaa Radio is for the whole family.',
  hi: 'कृपया आपत्तिजनक शब्द हटाकर फिर से भेजें। मुम्बा रेडियो पूरे परिवार के लिए है।',
  mr: 'कृपया आक्षेपार्ह शब्द काढून पुन्हा पाठवा. मुंबा रेडिओ संपूर्ण कुटुंबासाठी आहे.',
} as const;
export function abuseBlock(lang: string, ...texts: string[]): string | null {
  const bad = texts.some((t) => checkText(t, { allowContact: true, allowLinks: true }).includes('abuse'));
  return bad ? MSG[(lang as keyof typeof MSG)] ?? MSG.en : null;
}
