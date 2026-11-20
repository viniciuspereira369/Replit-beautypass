import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Armchair, Check } from 'lucide-react';

const STATUSES = ['Varrendo agendas em Pinheiros', 'Comparando tarifas inteligentes', 'Reservando as melhores cadeiras'];

export function RadarScan({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [setTimeout(() => setStep(1), 600), setTimeout(() => setStep(2), 1200), setTimeout(() => setStep(3), 1800)];
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <div className="flex flex-col items-center py-6" aria-live="polite" data-testid="stage-scan">
      <div className="relative h-[170px] w-[170px] overflow-hidden rounded-full bg-economy-bg">
        {[1, 0.68, 0.36].map((k) => <span key={k} className="absolute rounded-full border border-mint-2" style={{ inset: `${(1 - k) * 50}%` }} />)}
        <div className="conic-sweep absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(13,148,136,0) 0deg, rgba(13,148,136,0) 270deg, rgba(13,148,136,.55) 360deg)' }} />
        {[[28, 32], [68, 26], [58, 70]].map(([x, y], i) => (
          <motion.span key={i} initial={{ scale: 0, opacity: 0 }} animate={step > i ? { scale: 1, opacity: 1 } : {}} transition={{ type: 'spring', stiffness: 400, damping: 14 }}
            className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-forest text-mint shadow-md" style={{ left: `${x}%`, top: `${y}%` }}>
            <Armchair className="h-3.5 w-3.5" />
          </motion.span>
        ))}
        <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal ring-4 ring-white" />
      </div>
      <ul className="mt-5 space-y-1.5">
        {STATUSES.map((s, i) => (
          <li key={s} className={`flex items-center gap-2 text-sm transition ${step > i ? 'text-forest' : step === i ? 'text-ink' : 'text-muted-ink/50'}`}>
            <span className={`flex h-4 w-4 items-center justify-center rounded-full ${step > i ? 'bg-success text-white' : 'border border-line'}`}>{step > i && <Check className="h-3 w-3" />}</span>{s}
          </li>
        ))}
      </ul>
      <button data-testid="button-skip-scan" onClick={onDone} className="mt-5 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-forest">Ver resultados agora</button>
    </div>
  );
}
