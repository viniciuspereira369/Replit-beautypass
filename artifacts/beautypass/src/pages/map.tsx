import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Star, X, LocateFixed, SlidersHorizontal, ChevronRight, Footprints } from 'lucide-react';
import { SALONS } from '@/lib/data';
import { brl, dateKey, norm, priceFor, slotDiscount, slotState, HOURS } from '@/lib/pricing';
import { isTaken, useStore } from '@/lib/store';
import { salonRating } from '@/lib/experience';
import { categoryPhoto } from '@/lib/media';
import { fmtKm, fmtRating, liveDiscount, walkMin } from '@/components/salon-card';
import { RouteMap } from '@/components/route-map';
import { TurnByTurn } from '@/components/turn-by-turn';
import { Photo } from '@/components/art';
import { cn } from '@/lib/utils';

const FILTERS = ['Todos', 'Encaixe Hoje', '4.8+', '-30% OFF'] as const;

export default function MapPage() {
  const st = useStore(); const reviews = st.reviews ?? [];
  const [q, setQ] = useState(''); const [f, setF] = useState<(typeof FILTERS)[number]>('Todos');
  const [sel, setSel] = useState<string | null>(null); const [recenter, setRecenter] = useState(0); const [showF, setShowF] = useState(false);
  const today = dateKey(new Date());
  const lastMinute = useMemo(() => new Set(SALONS.filter((s) => HOURS.some((h) => { const r = slotDiscount(s, today, h, st.rules); return !r.past && slotState(s, today, h, r.disc, isTaken(st, s.id, today, h, s.services[0].duration)) !== 'Ocupado'; })).map((s) => s.id)), [st, today]);
  const list = SALONS.filter((s) => (!q || norm(`${s.name} ${s.hood}`).includes(norm(q))) &&
    (f === 'Todos' || (f === '4.8+' && salonRating(s, reviews) >= 4.8) || (f === '-30% OFF' && liveDiscount(s, st.rules) >= 30) || (f === 'Encaixe Hoje' && lastMinute.has(s.id))));
  const salon = list.find((s) => s.id === sel);
  const label = (s: { hood: string } & typeof SALONS[number]) => { const d = liveDiscount(s, st.rules); return d ? `${s.hood} -${d}%` : s.hood; };

  return (
    <div className="relative mx-auto flex min-h-full max-w-3xl flex-col">
      <div className="relative h-[430px] overflow-hidden @3xl:mx-4 @3xl:mt-4 @3xl:rounded-[28px]">
        <RouteMap salons={list} selected={salon?.id ?? null} onSelect={setSel} label={label} recenterKey={recenter} />
        <div className="absolute inset-x-3 top-3 space-y-2">
          <div className="glass flex items-center gap-2 rounded-full border border-white/70 py-1.5 pl-4 pr-1.5 shadow-[0_10px_30px_-18px_rgba(18,62,53,.5)]">
            <Search className="h-4 w-4 text-muted-ink" />
            <input aria-label="Buscar no mapa" data-testid="input-map-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar salão ou bairro" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-ink" />
            <button data-testid="button-map-filters" aria-expanded={showF} onClick={() => setShowF(!showF)} className="relative flex items-center gap-1 rounded-full bg-forest px-3 py-2 text-xs font-semibold text-white"><SlidersHorizontal className="h-3.5 w-3.5" />Filtros<span className="rounded-full bg-mint px-1.5 text-[10px] text-forest tnum">{list.length}</span></button>
          </div>
          <AnimatePresence>{showF && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="no-scrollbar flex gap-2 overflow-x-auto">
              {FILTERS.map((x) => <button key={x} data-testid={`filter-map-${x}`} aria-pressed={f === x} onClick={() => setF(x)} className={cn('shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm', f === x ? 'border-forest bg-forest text-white' : 'glass border-white/70 text-ink')}>{x}</button>)}
            </motion.div>)}</AnimatePresence>
        </div>
        <motion.button whileTap={{ scale: 0.88 }} data-testid="button-recenter" aria-label="Centralizar na minha localização" onClick={() => setRecenter((n) => n + 1)} className="absolute bottom-10 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-teal-deep shadow-lg"><LocateFixed className="h-5 w-5" /></motion.button>
        {list.length === 0 && <p className="glass absolute inset-x-10 top-1/2 rounded-2xl p-3 text-center text-sm text-muted-ink">Nenhum salão com esses filtros.</p>}
      </div>

      <motion.section className="relative z-10 -mt-6 flex-1 rounded-t-[24px] bg-white px-4 pb-6 pt-2 shadow-[0_-12px_30px_-20px_rgba(18,62,53,.45)]"
        drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.15} dragListener={false} data-testid="sheet-map">
        <motion.button aria-label={salon ? 'Recolher detalhes' : 'Expandir salão mais próximo'} data-testid="button-sheet-handle"
          onClick={() => setSel(salon ? null : [...list].sort((a, b) => a.distanceKm - b.distanceKm)[0]?.id ?? null)}
          onPanEnd={(_, i) => { if (i.offset.y > 30 && salon) setSel(null); if (i.offset.y < -30 && !salon && list[0]) setSel([...list].sort((a, b) => a.distanceKm - b.distanceKm)[0].id); }}
          className="mx-auto mb-2 flex h-6 w-24 touch-none items-center justify-center"><span className="h-1.5 w-10 rounded-full bg-line" /></motion.button>
        <AnimatePresence mode="wait">
          {salon ? (
            <motion.div key={salon.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} data-testid="card-map-detail">
              <div className="flex items-start gap-3">
                <Photo src={categoryPhoto(salon.category)} alt={salon.name} className="h-14 w-14 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1"><p className="tight truncate text-lg font-bold text-forest">{salon.name}</p><p className="truncate text-xs text-muted-ink">{salon.address} · {salon.hood}</p></div>
                <button aria-label="Fechar" data-testid="button-map-close" onClick={() => setSel(null)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tint text-ink"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line py-2.5 text-center tnum">
                <div><p className="flex items-center justify-center gap-1 text-base font-bold text-forest"><Star className="h-3.5 w-3.5 fill-gold text-gold" />{fmtRating(salonRating(salon, reviews))}</p><p className="text-[10px] text-muted-ink">avaliação</p></div>
                <div><p className="text-base font-bold text-[#065F4E]">-{liveDiscount(salon, st.rules)}%</p><p className="text-[10px] text-muted-ink">economia máx.</p></div>
                <div><p className="text-base font-bold text-forest">{walkMin(salon.distanceKm)} min</p><p className="text-[10px] text-muted-ink">a pé · {fmtKm(salon.distanceKm)} km</p></div>
              </div>
              <p className="mt-2 text-center text-xs text-muted-ink tnum">{salon.services[0].name} · {liveDiscount(salon, st.rules) > 0 && <s className="text-strike">{brl(salon.services[0].base)}</s>} <b className="text-forest">{brl(priceFor(salon.services[0].base, liveDiscount(salon, st.rules)))}</b></p>
              <Link href={`/salao/${salon.id}`} data-testid="link-map-salon" className="mt-3 flex items-center justify-center gap-1 rounded-full bg-forest py-3 text-sm font-bold text-white transition hover:bg-forest-hover active:scale-[.98]">Ver horários e agendar<ChevronRight className="h-4 w-4" /></Link>
              <div className="mt-3"><TurnByTurn salon={salon} /></div>
            </motion.div>
          ) : (
            <motion.div key="rest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="tight text-sm font-bold text-forest">{list.length} salões perto de você</p>
              <div className="no-scrollbar -mx-4 mt-2 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
                {[...list].sort((a, b) => a.distanceKm - b.distanceKm).map((s) => (
                  <button key={s.id} data-testid={`card-map-rest-${s.id}`} onClick={() => setSel(s.id)} className="w-[168px] shrink-0 snap-start overflow-hidden rounded-[20px] border border-line bg-white text-left transition active:scale-[.97]">
                    <div className="relative"><Photo src={categoryPhoto(s.category)} alt={s.name} className="h-[92px] w-full" />{liveDiscount(s, st.rules) > 0 && <span className="absolute left-2 top-2 rounded-full border border-economy/40 bg-economy-bg px-2 py-0.5 text-[10px] font-bold text-[#065F4E] tnum">-{liveDiscount(s, st.rules)}%</span>}</div>
                    <div className="p-2.5"><p className="tight truncate text-[13px] font-bold text-forest">{s.name}</p><p className="flex items-center gap-1.5 text-[11px] text-muted-ink tnum"><Star className="h-3 w-3 fill-gold text-gold" />{fmtRating(salonRating(s, reviews))}<Footprints className="h-3 w-3" />{walkMin(s.distanceKm)} min</p></div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}
