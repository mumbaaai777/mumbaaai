import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

export const spring = { type: 'spring', stiffness: 420, damping: 30, mass: 0.8 } as const;

export function Page({ children }: { children: ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-5xl px-4 pb-32 pt-2 sm:px-6 md:pb-16"
    >
      {children}
    </motion.main>
  );
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}
export function Item({ children, className, ...rest }: { children: ReactNode; className?: string } & HTMLMotionProps<'div'>) {
  return (
    <motion.div variants={item} className={`min-w-0 ${className ?? ""}`} {...rest}>
      {children}
    </motion.div>
  );
}

export function Press({ children, className, ...rest }: HTMLMotionProps<'button'>) {
  return (
    <motion.button whileTap={{ scale: 0.95 }} whileHover={{ y: -1 }} transition={spring} className={className} {...rest}>
      {children}
    </motion.button>
  );
}

/** Reveals text grapheme by grapheme (Intl.Segmenter keeps Devanagari conjuncts and matras intact). */
export function LetterReveal({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion();
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  const parts = Seg ? [...new Seg(undefined, { granularity: 'grapheme' }).segment(text)].map((s) => s.segment) : text.split(/(\s+)/);
  if (reduce) return <span className={className}>{text}</span>;
  return (
    <span className={className} aria-label={text}>
      {parts.map((p, i) => (
        <motion.span
          key={`${text}-${i}`}
          aria-hidden
          className="inline-block whitespace-pre"
          initial={{ opacity: 0, y: '0.35em', filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.15 + i * 0.028, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {p}
        </motion.span>
      ))}
    </span>
  );
}
