import { motion } from 'framer-motion';
import { Store, Home as HomeIcon } from 'lucide-react';
import { setFulfillment, useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

/** Shared No Salão | Domicílio preference (persisted in store). */
export function FulfillmentToggle({ compact = false, id = 'f' }: { compact?: boolean; id?: string }) {
  const st = useStore(); const mode = st.fulfillment ?? 'salao';
  const opts = [['salao', compact ? 'Salão' : 'No Salão', Store], ['domicilio', compact ? 'Domicílio' : 'A Domicílio', HomeIcon]] as const;
  return (
    <div className={cn('relative grid grid-cols-2 rounded-full border border-line bg-white p-1', compact ? 'text-[11px]' : 'text-xs')} role="radiogroup" aria-label="Onde ser atendida">
      {opts.map(([v, l, I]) => { const on = mode === v; return (
        <button key={v} role="radio" aria-checked={on} data-testid={`button-mode-${v}`} onClick={() => setFulfillment(v)}
          className={cn('relative z-10 flex items-center justify-center gap-1 rounded-full font-semibold transition', compact ? 'px-2.5 py-1.5' : 'py-2', on ? 'text-white' : 'text-muted-ink')}>
          {on && <motion.span layoutId={`ful-${id}`} className="absolute inset-0 -z-10 rounded-full bg-forest" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />}
          <I className="h-3.5 w-3.5" />{l}
        </button>); })}
    </div>
  );
}
