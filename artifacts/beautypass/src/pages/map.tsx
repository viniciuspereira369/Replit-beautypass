import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Search, Star, Footprints, X, Navigation } from 'lucide-react';
import { SALONS, USER_POS } from '@/lib/data';
import { brl, dateKey, norm, priceFor, slotDiscount, slotState, HOURS } from '@/lib/pricing';
import { isTaken, useStore } from '@/lib/store';
import { liveDiscount } from '@/components/salon-card';
import { cn } from '@/lib/utils';

const HOODS = [
  { n: 'Perdizes', d: 'M40 30 L250 20 L240 150 L60 160Z', lx: 120, ly: 70 },
  { n: 'Vila Madalena', d: 'M20 165 L160 155 L150 260 L30 270Z', lx: 50, ly: 210 },
  { n: 'Pinheiros', d: 'M160 155 L260 150 L270 330 L150 340 L150 260Z', lx: 175, ly: 300 },
  { n: 'Consolação', d: 'M250 20 L390 30 L380 250 L265 260 L260 150Z', lx: 300, ly: 120 },
  { n: 'Jardins', d: 'M265 260 L380 250 L390 380 L270 385Z', lx: 330, ly: 370 },
  { n: 'Itaim Bibi', d: 'M150 340 L270 330 L270 385 L390 380 L380 490 L140 490Z', lx: 210, ly: 465 },
];
const FILTERS = ['Todos', 'Encaixe Hoje', '4.8+', '-30% OFF'] as const;

export default function MapPage() {
  const st = useStore(); const [q, setQ] = useState(''); const [f, setF] = useState<(typeof FILTERS)[number]>('Todos');
  const [sel, setSel] = useState<string | null>('atelie-belle-epoque');
  const today = dateKey(new Date());
  const lastMinute = useMemo(() => new Set(SALONS.filter((s) => HOURS.some((h) => { const r = slotDiscount(s, today, h, st.rules); return !r.past && slotState(s, today, h, r.disc, isTaken(st, s.id, today, h, s.services[0].duration)) !== 'Ocupado'; })).map((s) => s.id)), [st, today]);
  const list = SALONS.filter((s) => (!q || norm(`${s.name} ${s.hood}`).includes(norm(q))) &&
    (f === 'Todos' || (f === '4.8+' && s.rating >= 4.8) || (f === '-30% OFF' && liveDiscount(s, st.rules) >= 30) || (f === 'Encaixe Hoje' && lastMinute.has(s.id))));
  const salon = list.find((s) => s.id === sel);

  return (
    <div className="relative mx-auto flex h-full max-w-6xl flex-col px-4 pt-5">
      <div className="rise flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5">
        <Search className="h-4 w-4 text-muted-ink" />
        <input aria-label="Buscar no mapa" data-testid="input-map-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar no mapa" className="w-full bg-transparent text-sm outline-none" />
      </div>
      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
        {FILTERS.map((x) => <button key={x} data-testid={`filter-map-${x}`} onClick={() => setF(x)} className={cn('shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium', f === x ? 'border-forest bg-forest text-tint' : 'border-line bg-white text-ink')}>{x}</button>)}
      </div>
      <div className="relative mt-3 overflow-hidden rounded-3xl border border-line bg-tint">
        <svg viewBox="0 0 410 500" className="block h-auto w-full" role="img" aria-label="Mapa de salões próximos">
          <rect width="410" height="500" fill="#F0FDFA" />
          {HOODS.map((h) => <g key={h.n}><path d={h.d} fill="#EBF3F0" stroke="#DCE4E0" strokeWidth="2" /><text x={h.lx} y={h.ly} fontSize="10" fill="#5A7A78" letterSpacing="1.5" fontWeight="600">{h.n.toUpperCase()}</text></g>)}
          <g stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none">
            <path d="M0 250 C120 240 260 260 410 230" /><path d="M200 0 C190 160 230 330 210 500" /><path d="M0 120 L410 160" /><path d="M60 500 L380 0" opacity=".9" /><path d="M0 400 C150 380 260 420 410 400" />
          </g>
          <path d="M0 380 C100 370 120 470 140 500" stroke="#8DD1BF" strokeWidth="9" fill="none" opacity=".5" />
          {salon && <path className="walk-route" d={`M${USER_POS.x} ${USER_POS.y} L${salon.x} ${USER_POS.y} L${salon.x} ${salon.y}`} stroke="#0D9488" strokeWidth="3" fill="none" strokeLinecap="round" />}
          <circle className="gps-pulse" cx={USER_POS.x} cy={USER_POS.y} r="10" fill="#5EEAD4" />
          <circle cx={USER_POS.x} cy={USER_POS.y} r="7" fill="#0D9488" stroke="#fff" strokeWidth="3" />
          {list.map((s) => {
            const on = s.id === sel;
            return (
              <g key={s.id} transform={`translate(${s.x} ${s.y})`} className="cursor-pointer" onClick={() => setSel(s.id)} role="button" tabIndex={0} aria-label={s.name} data-testid={`pin-${s.id}`} onKeyDown={(e) => e.key === 'Enter' && setSel(s.id)}>
                <g style={{ transform: on ? 'scale(1.18)' : 'scale(1)', transition: 'transform .25s' }}>
                  <path d="M0 0 C-14 -16 -16 -22 -16 -28 A16 16 0 1 1 16 -28 C16 -22 14 -16 0 0Z" fill={on ? '#F43F5E' : '#123E35'} stroke="#fff" strokeWidth="2" />
                  <text y="-24" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{liveDiscount(s, st.rules) ? `-${liveDiscount(s, st.rules)}` : 'BP'}</text>
                </g>
              </g>
            );
          })}
        </svg>
        {list.length === 0 && <p className="absolute inset-x-0 top-1/2 text-center text-sm text-muted-ink">Nenhum salão com esses filtros.</p>}
      </div>
      {salon ? (
        <div className="rise relative mt-3 rounded-3xl border border-line bg-white p-4 shadow-sm" key={salon.id} data-testid="card-map-detail">
          <button aria-label="Fechar" onClick={() => setSel(null)} className="absolute right-3 top-3 text-muted-ink"><X className="h-4 w-4" /></button>
          <p className="font-display text-lg font-semibold text-forest">{salon.name}</p>
          <p className="text-xs text-muted-ink">{salon.address} · {salon.hood}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-ink tnum">
            <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-gold text-gold" />{salon.rating}</span>
            <span className="flex items-center gap-1"><Footprints className="h-3 w-3" />{Math.round(salon.distanceKm * 12)} min a pé</span>
            <span>{salon.services[0].name} <s className="text-muted-ink">{brl(salon.services[0].base)}</s> <b className="text-forest">{brl(priceFor(salon.services[0].base, liveDiscount(salon, st.rules)))}</b></span>
          </div>
          <Link href={`/salao/${salon.id}`} data-testid="link-map-salon" className="mt-3 flex items-center justify-center gap-2 rounded-full bg-forest py-2.5 text-sm font-semibold text-tint hover:bg-forest-hover"><Navigation className="h-4 w-4" />Ver horários</Link>
        </div>
      ) : <p className="mt-3 text-center text-xs text-muted-ink">Toque em um pin para ver a rota a pé.</p>}
    </div>
  );
}
