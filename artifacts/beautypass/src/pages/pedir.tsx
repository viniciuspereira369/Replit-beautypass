import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, Footprints, CalendarX, ArrowLeft, MapPin, Scissors, Sparkles, Hand, Flower2, Droplets, LayoutGrid, Map, Check, Clock } from 'lucide-react';
import { SALONS } from '@/lib/data';
import { brl, dateKey, kindLabel, pad } from '@/lib/pricing';
import { startHold, useStore } from '@/lib/store';
import { salonRating } from '@/lib/experience';
import { categoryPhoto } from '@/lib/media';
import { Empty } from '@/components/shell';
import { Photo } from '@/components/art';
import { RouteMap } from '@/components/route-map';
import { RadarScan } from '@/components/radar-scan';
import { fmtKm, fmtRating, liveDiscount } from '@/components/salon-card';
import { findMatches, WINDOWS, type Match, type Win } from '@/components/pedir-match';
import { useGuide } from '@/hooks/use-guide';
import { cn } from '@/lib/utils';

const CATS = [
  { c: 'Todos', i: LayoutGrid, l: 'Qualquer procedimento' }, { c: 'Cabelo', i: Scissors, l: 'Cabelo' }, { c: 'Barba', i: Sparkles, l: 'Barba' },
  { c: 'Unhas', i: Hand, l: 'Unhas' }, { c: 'Massagem', i: Flower2, l: 'Massagem' }, { c: 'Estética', i: Droplets, l: 'Estética' },
];

export default function PedirPage() {
  const st = useStore(); const [, navigate] = useLocation(); const reviews = st.reviews ?? [];
  const [cat, setCat] = useState('Todos'); const [win, setWin] = useState<Win>('Próximas 3h');
  const [phase, setPhase] = useState<'idle' | 'scan' | 'done'>('idle'); const [res, setRes] = useState<Match[]>([]); const [pick, setPick] = useState(0);
  const guide = useGuide('pedir-start', () => setPhase('idle'));
  const top = useRef<HTMLDivElement>(null);
  useEffect(() => { top.current?.scrollIntoView({ block: 'start' }); }, [phase]);
  const finish = () => { setRes(findMatches(cat, win)); setPick(0); setPhase('done'); };
  const m = res[pick];
  const book = () => {
    if (!m) return;
    startHold({ salonId: m.salon.id, serviceIds: [m.salon.services[0].id], staffId: null, date: m.date, hour: m.hour, base: m.base, final: m.final, disc: m.disc, kind: m.kind });
    navigate('/checkout');
  };
  const catRange = (c: string) => {
    const ss = SALONS.filter((x) => c === 'Todos' || x.category === c || (c === 'Cabelo' && x.category === 'Misto'));
    return { from: Math.min(...ss.map((s) => s.services[0].base)), disc: Math.max(...ss.map((s) => liveDiscount(s, st.rules))) };
  };

  return (
    <div className="mx-auto max-w-3xl" ref={top}>
      <div className="relative px-5 pt-5 text-center">
        {phase !== 'idle' && <button aria-label="Voltar" data-testid="button-pedir-back" onClick={() => setPhase('idle')} className="absolute left-4 top-5 rounded-full bg-white p-2 shadow-sm"><ArrowLeft className="h-4 w-4 text-ink" /></button>}
        <p className="text-[11px] font-bold uppercase tracking-[.18em] text-teal">Etapa {phase === 'idle' ? 1 : phase === 'scan' ? 2 : 3} de 3</p>
        <h1 className="tight text-2xl font-bold text-forest">{phase === 'done' ? 'Encaixes encontrados' : 'Pedir Agora'}</h1>
        {phase === 'idle' && <p className="mt-1 text-sm text-muted-ink">Diga o que quer e quando. Encontramos a cadeira ociosa ideal.</p>}
      </div>

      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div key="s1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4 px-5 pt-5" ref={guide}>
            <div className="grid grid-cols-3 gap-1 rounded-full border border-line bg-white p-1" role="radiogroup" aria-label="Quando">
              {WINDOWS.map((w) => <button key={w} role="radio" aria-checked={win === w} data-testid={`button-pedir-win-${w}`} onClick={() => setWin(w)} className={cn('relative rounded-full py-2 text-xs font-semibold transition', win === w ? 'text-white' : 'text-muted-ink')}>{win === w && <motion.span layoutId="win-pill" className="absolute inset-0 -z-0 rounded-full bg-forest" />}<span className="relative">{w}</span></button>)}
            </div>
            <div className="relative rounded-[22px] border border-line bg-white">
              <span className="absolute left-[27px] top-[34px] h-[30px] w-px bg-line" />
              <div className="flex items-center gap-3 px-4 py-3"><span className="h-2.5 w-2.5 rounded-full bg-teal ring-4 ring-economy-bg" /><div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-ink">Onde</p><p className="text-sm font-semibold text-ink">Pinheiros, São Paulo <span className="font-normal text-muted-ink">· Raio 3 km</span></p></div></div>
              <div className="flex items-center gap-3 border-t border-line px-4 py-3"><span className="h-2.5 w-2.5 rounded-sm bg-forest" /><div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-ink">Procedimento</p><p className="text-sm font-semibold text-ink">{CATS.find((x) => x.c === cat)?.l}</p></div></div>
            </div>
            <ul className="divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-white" role="radiogroup" aria-label="Procedimento">
              {CATS.map(({ c, i: I, l }) => { const r = catRange(c); const on = cat === c; return (
                <li key={c}><button role="radio" aria-checked={on} data-testid={`button-pedir-cat-${c}`} onClick={() => setCat(c)} className={cn('flex w-full items-center gap-3 px-4 py-3 text-left transition', on ? 'bg-tint' : 'hover:bg-porcelain')}>
                  <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', on ? 'bg-forest text-mint' : 'bg-tint text-teal-deep')}><I className="h-4 w-4" /></span>
                  <span className="flex-1"><b className="block text-sm text-ink">{l}</b><span className="text-[11px] text-muted-ink tnum">a partir de {brl(r.from)}</span></span>
                  {r.disc > 0 && <span className="rounded-full bg-economy-bg px-2 py-0.5 text-[11px] font-bold text-economy tnum">até -{r.disc}%</span>}
                  {on && <Check className="h-4 w-4 text-teal" />}
                </button></li>); })}
            </ul>
            <motion.button whileTap={{ scale: 0.97 }} data-testid="button-pedir-search" onClick={() => setPhase('scan')} className="flex w-full items-center justify-center gap-2 rounded-full bg-forest py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_-14px_rgba(18,62,53,.7)]"><Map className="h-4 w-4 text-mint" />Ver Salões Próximos no Mapa</motion.button>
          </motion.div>
        )}
        {phase === 'scan' && <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ScanAuto onDone={finish} /></motion.div>}
        {phase === 'done' && (
          <motion.div key="s3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-4" data-testid="stage-results">
            {res.length === 0 ? <Empty icon={CalendarX} title="Sem encaixes nessa janela" text="Tente outra categoria ou a janela da Tarde." action={<button onClick={() => setPhase('idle')} className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white">Ajustar pedido</button>} /> : (<>
              <div className="h-[210px] overflow-hidden rounded-[24px] border border-line">
                <RouteMap salons={res.map((r) => r.salon)} selected={m?.salon.id ?? null} onSelect={(id) => setPick(Math.max(0, res.findIndex((r) => r.salon.id === id)))} label={(s) => { const r = res.find((x) => x.salon.id === s.id); return r && r.disc ? `${s.hood} -${r.disc}%` : s.hood; }} viewBox="40 60 340 340" />
              </div>
              <div className="mt-3 space-y-2.5" role="radiogroup" aria-label="Encaixes">
                {res.map((r, i) => { const on = i === pick; const lbl = kindLabel(r.kind); return (
                  <motion.button key={r.label} role="radio" aria-checked={on} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08 } }}
                    onClick={() => setPick(i)} data-testid={`card-match-${i}`} className={cn('flex w-full items-center gap-3 rounded-[22px] border bg-white p-3 text-left transition', on ? 'border-forest ring-2 ring-mint/60' : 'border-line')}>
                    <Photo src={categoryPhoto(r.salon.category)} alt={r.salon.name} className="h-16 w-16 shrink-0 rounded-2xl" />
                    <span className="min-w-0 flex-1">
                      <span className="text-[10px] font-extrabold tracking-wider text-teal">{r.label}</span>
                      <span className="tight block truncate font-bold text-forest">{r.salon.name}</span>
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-ink tnum"><Star className="h-3 w-3 fill-gold text-gold" />{fmtRating(salonRating(r.salon, reviews))}<Footprints className="h-3 w-3" />{fmtKm(r.salon.distanceKm)} km<Clock className="h-3 w-3" />{r.date === dateKey(new Date()) ? 'Hoje' : 'Amanhã'} {pad(r.hour)}:00</span>
                      {lbl && r.disc > 0 && <span className="block truncate text-[10px] font-semibold text-economy">{lbl.title} · {lbl.sub}</span>}
                    </span>
                    <span className="text-right tnum">{r.disc > 0 && <s className="block text-[11px] text-strike">{brl(r.base)}</s>}<b className="text-forest">{brl(r.final)}</b>{r.disc > 0 && <span className="block text-[10px] font-bold text-coral">-{r.disc}%</span>}</span>
                  </motion.button>); })}
              </div>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-ink"><MapPin className="h-3 w-3" />Preço justo: nunca abaixo de R$ 30 ou 45% do valor base.</p>
              <div className="sticky bottom-3 z-20 mt-4">
                <motion.button whileTap={{ scale: 0.97 }} data-testid="button-match-book" onClick={book} className="flex w-full items-center justify-between rounded-full bg-forest px-5 py-3.5 text-sm font-bold text-white shadow-[0_16px_30px_-14px_rgba(18,62,53,.8)]">
                  <span>Confirmar Encaixe</span><span className="tnum">{m ? brl(m.final) : ''}</span>
                </motion.button>
              </div>
            </>)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScanAuto({ onDone }: { onDone: () => void }) {
  const cb = useRef(onDone); cb.current = onDone;
  useEffect(() => { const t = setTimeout(() => cb.current(), 1900); return () => clearTimeout(t); }, []);
  return <RadarScan onDone={onDone} />;
}
