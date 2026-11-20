import { motion } from 'framer-motion';
import { Zap, Navigation, Crown, Heart, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Shortcut = 'encaixe' | 'perto' | 'super' | 'favoritos' | 'mapa';
const COUPONS = [{ d: 15, t: 'Leve' }, { d: 25, t: 'Econômico' }, { d: 30, t: 'Premium' }, { d: 35, t: 'Hoje' }];
const SHORTS: { id: Shortcut; label: string; icon: typeof Zap; dark?: boolean }[] = [
  { id: 'encaixe', label: 'Encaixe Hoje', icon: Zap }, { id: 'perto', label: 'Perto de mim', icon: Navigation },
  { id: 'super', label: 'Super Salões 4.8+', icon: Crown, dark: true }, { id: 'favoritos', label: 'Favoritos', icon: Heart },
  { id: 'mapa', label: 'Ver no mapa', icon: Map },
];

export function SavingsHub({ minD, setMinD, active, onShortcut }: { minD: number; setMinD: (n: number) => void; active: Shortcut[]; onShortcut: (s: Shortcut) => void }) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden" id="savings-hub" data-testid="panel-savings-hub">
      <div className="mt-3 rounded-[24px] border border-line bg-white p-3.5">
        <p className="tight text-sm font-bold text-forest">Buscando economia?</p>
        <p className="text-[11px] text-muted-ink">Filtre por desconto mínimo em horários de menor procura.</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {COUPONS.map((c) => { const on = minD === c.d; return (
            <motion.button key={c.d} whileTap={{ scale: 0.92 }} data-testid={`pill-discount-${c.d}`} aria-pressed={on} onClick={() => setMinD(on ? 0 : c.d)}
              className={cn('notch flex flex-col items-center rounded-xl border-y-2 border-dashed py-2.5 transition',
                on ? 'border-mint bg-forest text-white' : 'border-mint-3 bg-economy-bg text-economy')}>
              <b className="tnum text-lg leading-none tight">-{c.d}%</b><span className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-wide opacity-80">{c.t}</span>
            </motion.button>); })}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {SHORTS.map((s) => { const on = active.includes(s.id); return (
            <motion.button key={s.id} whileTap={{ scale: 0.94 }} data-testid={`button-shortcut-${s.id}`} aria-pressed={on} onClick={() => onShortcut(s.id)}
              className={cn('flex items-center gap-1.5 rounded-2xl border px-2.5 py-2.5 text-left text-[11px] font-semibold leading-tight transition',
                s.dark ? (on ? 'border-mint bg-forest-dark text-mint ring-2 ring-mint/50' : 'border-forest bg-forest text-white') : on ? 'border-teal bg-tint text-forest' : 'border-line bg-porcelain text-ink')}>
              <s.icon className={cn('h-4 w-4 shrink-0', s.dark ? 'text-gold' : 'text-teal-deep')} />{s.label}
            </motion.button>); })}
        </div>
      </div>
    </motion.div>
  );
}
