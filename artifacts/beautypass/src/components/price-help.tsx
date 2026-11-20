import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShieldCheck, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EXPLAIN } from '@/lib/pricing';
import { QR } from './art';
import { cn } from '@/lib/utils';

const BARS = [{ l: 'Pico Integral', v: 100, c: '#94A3B8', t: 'preço cheio' }, { l: 'Econômico', v: 75, c: '#0E8A73', t: '-25%' }, { l: 'Última Hora', v: 65, c: '#F43F5E', t: '-35%' }];

export function PriceHelp({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [i, setI] = useState(0);
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setI(0); }}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-sm max-h-[calc(100dvh-2rem)] rounded-[28px] border-line bg-white p-5" data-testid="dialog-explain">
        <DialogHeader>
          <DialogTitle className="tight text-xl font-bold text-forest">{i === 0 ? 'Como funcionam as tarifas inteligentes' : 'Voucher e cancelamento'}</DialogTitle>
          <DialogDescription className="sr-only">Explicação de preços em duas etapas</DialogDescription>
        </DialogHeader>
        <AnimatePresence mode="wait">
          {i === 0 ? (
            <motion.div key="a" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-sm leading-relaxed text-ink" data-testid="text-explain">{EXPLAIN}</p>
              <div className="mt-4 flex h-36 items-end justify-around gap-3 rounded-2xl bg-porcelain p-3">
                {BARS.map((b, k) => (
                  <div key={b.l} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[11px] font-bold tnum" style={{ color: b.c }}>{b.t}</span>
                    <motion.div className="w-full rounded-t-xl" style={{ background: b.c, height: `${b.v * 0.8}px`, transformOrigin: 'bottom' }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: k * 0.1, type: 'spring', stiffness: 160, damping: 18 }} />
                    <span className="text-center text-[10px] font-semibold text-muted-ink">{b.l}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="b" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-tint p-3"><QR value="BP-000000" size={64} /><p className="text-xs text-ink">Após o pagamento você recebe um voucher com QR. Apresente na recepção para o check-in.</p></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-economy-bg p-3"><ShieldCheck className="h-4 w-4 text-economy" /><p className="mt-1 text-sm font-bold text-forest">Até 24h antes</p><p className="text-[11px] text-ink">Cancelamento grátis, reembolso integral.</p></div>
                <div className="rounded-2xl bg-coral-bg p-3"><Clock className="h-4 w-4 text-coral" /><p className="mt-1 text-sm font-bold text-forest">Menos de 24h</p><p className="text-[11px] text-ink">Multa de 30% do valor pago.</p></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mt-2 flex items-center justify-between">
          <button aria-label="Anterior" disabled={i === 0} onClick={() => setI(0)} className="rounded-full bg-tint p-2 text-forest disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <div className="flex gap-1.5" role="tablist">{[0, 1].map((k) => <button key={k} role="tab" aria-selected={i === k} aria-label={`Página ${k + 1}`} onClick={() => setI(k)} className={cn('h-2 rounded-full transition-all', i === k ? 'w-6 bg-forest' : 'w-2 bg-line')} />)}</div>
          {i === 0 ? <button aria-label="Próxima" data-testid="button-explain-next" onClick={() => setI(1)} className="rounded-full bg-tint p-2 text-forest"><ChevronRight className="h-4 w-4" /></button>
            : <button data-testid="button-explain-close" onClick={() => onOpenChange(false)} className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white">Entendi</button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
