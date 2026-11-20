import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

const COLORS = ['#5EEAD4', '#0D9488', '#F59E0B', '#F43F5E', '#0E8A73'];

/** Mint ring with micro-confetti. Only rendered for a fresh confirmation. */
export function Celebration({ burst }: { burst: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
      {burst && !reduce && Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2; const d = 54 + (i % 3) * 10;
        return <motion.span key={i} className="absolute h-2 w-1.5 rounded-sm" style={{ background: COLORS[i % 5] }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }} animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d, opacity: 0, rotate: 180 }} transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }} />;
      })}
      <motion.span className="absolute inset-0 rounded-full border-4 border-mint" initial={burst && !reduce ? { scale: 0.4, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }} />
      <motion.span className="flex h-16 w-16 items-center justify-center rounded-full bg-forest text-mint" initial={burst && !reduce ? { scale: 0 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.1 }}>
        <Check className="h-8 w-8" strokeWidth={3} />
      </motion.span>
    </div>
  );
}
