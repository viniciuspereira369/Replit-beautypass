import { useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, MapPin, X, Gift, SearchX, LayoutGrid, Scissors, Sparkles, Hand, Flower2, Droplets, Ticket, ChevronDown, Star } from 'lucide-react';
import { CATEGORIES, SALONS } from '@/lib/data';
import { HOURS, dateKey, norm, slotDiscount, slotState } from '@/lib/pricing';
import { dismissClub, isTaken, setFulfillment, useStore } from '@/lib/store';
import { salonRating } from '@/lib/experience';
import { categoryPhoto } from '@/lib/media';
import { fmtRating, liveDiscount, SalonCard } from '@/components/salon-card';
import { Empty } from '@/components/shell';
import { Photo } from '@/components/art';
import { FulfillmentToggle } from '@/components/fulfillment-toggle';
import { SavingsHub, type Shortcut } from '@/components/savings-hub';
import { cn } from '@/lib/utils';

const CAT_ICONS = { Todos: LayoutGrid, Cabelo: Scissors, Barba: Sparkles, Unhas: Hand, Massagem: Flower2, Estética: Droplets } as const;
const SORTS = ['Todos', 'Mais Economia', 'Mais Próximos', 'Favoritos'] as const;
const pill = (on: boolean) => cn('shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95', on ? 'border-forest bg-forest text-white' : 'border-line bg-white text-ink hover:border-mint-2');

export default function HomePage() {
  const st = useStore(); const [, navigate] = useLocation();
  const [q, setQ] = useState(''); const [cat, setCat] = useState<string>('Todos');
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Todos'); const [minD, setMinD] = useState(0);
  const [hub, setHub] = useState(false); const [superOnly, setSuperOnly] = useState(false); const [todayOnly, setTodayOnly] = useState(false);
  const done = Math.min(3, st.bookings.filter((b) => b.status === 'COMPLETED').length);
  const reviews = st.reviews ?? [];
  const today = dateKey(new Date());

  const list = useMemo(() => {
    let l = SALONS.filter((s) => (cat === 'Todos' || s.category === cat || (s.category === 'Misto' && cat === 'Cabelo')) && liveDiscount(s, st.rules) >= minD);
    if (superOnly) l = l.filter((s) => salonRating(s, reviews) >= 4.8);
    if (todayOnly) l = l.filter((s) => HOURS.some((h) => { const r = slotDiscount(s, today, h, st.rules); return !r.past && slotState(s, today, h, r.disc, isTaken(st, s.id, today, h, s.services[0].duration)) !== 'Ocupado'; }));
    if (q.trim()) { const n = norm(q); l = l.filter((s) => norm(`${s.name} ${s.hood} ${s.category} ${s.services.map((x) => x.name).join(' ')}`).includes(n)); }
    if (sort === 'Mais Economia') l = [...l].sort((a, b) => b.services[0].base * liveDiscount(b, st.rules) - a.services[0].base * liveDiscount(a, st.rules));
    if (sort === 'Mais Próximos') l = [...l].sort((a, b) => a.distanceKm - b.distanceKm);
    if (sort === 'Favoritos') l = l.filter((s) => st.favorites.includes(s.id));
    return l;
  }, [q, cat, sort, minD, superOnly, todayOnly, st, reviews, today]);
  const featured = useMemo(() => [...SALONS].sort((a, b) => salonRating(b, reviews) - salonRating(a, reviews)).slice(0, 5), [reviews]);

  const active: Shortcut[] = [...(todayOnly ? ['encaixe' as const] : []), ...(sort === 'Mais Próximos' ? ['perto' as const] : []), ...(superOnly ? ['super' as const] : []), ...(sort === 'Favoritos' ? ['favoritos' as const] : []), ...(st.fulfillment === 'domicilio' ? ['domicilio' as const] : [])];
  const onShortcut = (s: Shortcut) => {
    if (s === 'encaixe') setTodayOnly(!todayOnly);
    if (s === 'perto') setSort(sort === 'Mais Próximos' ? 'Todos' : 'Mais Próximos');
    if (s === 'super') setSuperOnly(!superOnly);
    if (s === 'favoritos') setSort(sort === 'Favoritos' ? 'Todos' : 'Favoritos');
    if (s === 'domicilio') setFulfillment(st.fulfillment === 'domicilio' ? 'salao' : 'domicilio');
    if (s === 'mapa') navigate('/mapa');
  };
  const clear = () => { setQ(''); setCat('Todos'); setMinD(0); setSort('Todos'); setSuperOnly(false); setTodayOnly(false); };

  return (
    <div className="mx-auto max-w-6xl">
      <section className="rise px-5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href="/mapa" data-testid="link-location" className="flex items-center gap-1 text-[11px] font-semibold text-teal-deep"><MapPin className="h-3.5 w-3.5" />Pinheiros, SP<ChevronDown className="h-3 w-3" /></Link>
            <h1 className="tight mt-0.5 text-2xl font-bold text-forest" data-testid="text-greeting">Olá, {st.user.name.split(' ')[0]}</h1>
          </div>
          <FulfillmentToggle compact id="home" />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-4 pr-1.5 shadow-[0_10px_30px_-22px_rgba(18,62,53,.5)] focus-within:border-teal focus-within:ring-2 focus-within:ring-mint/40">
          <Search className="h-4 w-4 shrink-0 text-muted-ink" /><label htmlFor="home-search" className="sr-only">Buscar procedimento</label>
          <input id="home-search" data-testid="input-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Qual procedimento você quer hoje?" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-ink" />
          {q && <button aria-label="Limpar busca" onClick={() => setQ('')} className="p-1"><X className="h-4 w-4 text-muted-ink" /></button>}
          <motion.button whileTap={{ scale: 0.88 }} data-testid="button-toggle-hub" aria-expanded={hub} aria-controls="savings-hub" aria-label="Buscando economia?" onClick={() => setHub(!hub)}
            className={cn('relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition', hub ? 'bg-forest text-mint' : 'bg-economy-bg text-economy')}>
            <Ticket className="h-[18px] w-[18px]" />{(minD > 0 || superOnly || todayOnly) && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-coral ring-2 ring-white" />}
          </motion.button>
        </div>
        <AnimatePresence initial={false}>{hub && <SavingsHub minD={minD} setMinD={setMinD} active={active} onShortcut={onShortcut} />}</AnimatePresence>
      </section>

      {!st.user.clubDismissed && (
        <section className="rise mx-5 mt-4 flex items-center gap-3 rounded-2xl border border-mint-3 bg-economy-bg px-3.5 py-3" data-testid="card-club">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-economy"><Gift className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-forest">Clube BeautyPass · 15% de cashback</p>
            <div className="mt-1.5 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white"><motion.div className="h-full rounded-full bg-economy" initial={{ width: 0 }} animate={{ width: `${(done / 3) * 100}%` }} /></div><span className="text-[11px] font-bold text-economy tnum">{done}/3</span></div>
          </div>
          <button data-testid="button-dismiss-club" aria-label="Dispensar clube" onClick={dismissClub} className="rounded-full p-1 text-muted-ink hover:bg-white"><X className="h-4 w-4" /></button>
        </section>
      )}

      <section className="mt-5 px-5">
        <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1" role="group" aria-label="Categorias">{CATEGORIES.map((c) => { const I = CAT_ICONS[c]; const on = cat === c; return (
          <button key={c} data-testid={`button-category-${c}`} aria-pressed={on} onClick={() => setCat(c)} className="flex w-[60px] shrink-0 flex-col items-center gap-1.5">
            <motion.span whileTap={{ scale: 0.85 }} animate={{ scale: on ? 1.04 : 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              className={cn('flex h-14 w-14 items-center justify-center rounded-[18px] border transition-colors', on ? 'border-forest bg-forest text-mint shadow-[0_10px_20px_-10px_rgba(18,62,53,.6)]' : 'border-line bg-white text-teal-deep')}><I className="h-5 w-5" /></motion.span>
            <span className={cn('text-[11px] font-semibold', on ? 'text-forest' : 'text-muted-ink')}>{c}</span>
          </button>); })}</div>
        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          {SORTS.map((s) => <button key={s} data-testid={`button-sort-${s}`} aria-pressed={sort === s} onClick={() => setSort(s)} className={pill(sort === s)}>{s}</button>)}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="tight px-5 text-lg font-bold text-forest">Salões Parceiros em Destaque</h2>
        <div className="no-scrollbar mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-1">
          {featured.map((s) => (
            <Link key={s.id} href={`/salao/${s.id}`} data-testid={`link-featured-${s.id}`} className="relative block w-[200px] shrink-0 snap-start overflow-hidden rounded-[22px] active:scale-[.98] transition">
              <Photo src={categoryPhoto(s.category)} alt={s.name} className="h-[132px] w-full" />
              <div className="scrim-b absolute inset-0" />
              <div className="absolute inset-x-3 bottom-2.5 text-white"><p className="tight truncate text-sm font-bold">{s.name}</p><p className="flex items-center gap-1 text-[11px] text-white/80 tnum"><Star className="h-3 w-3 fill-gold text-gold" />{fmtRating(salonRating(s, reviews))} · {s.hood}</p></div>
            </Link>
          ))}
        </div>
      </section>

      <h2 className="tight mt-6 px-5 text-lg font-bold text-forest" data-testid="text-friends-heading">Amigas estão agendando</h2>
      <section className="mt-3 grid gap-4 px-5 @2xl:grid-cols-2 @5xl:grid-cols-3">
        {list.map((s, i) => <SalonCard key={s.id} salon={s} i={i} />)}
      </section>
      {list.length === 0 && <div className="px-5"><Empty icon={SearchX} title={sort === 'Favoritos' ? 'Nenhum favorito ainda' : 'Nada por aqui'} text={sort === 'Favoritos' ? 'Toque no coração de um salão para guardá-lo aqui.' : 'Tente outro termo, categoria ou faixa de desconto.'} action={<button data-testid="button-clear-filters" onClick={clear} className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white">Limpar filtros</button>} /></div>}
      <p className="px-5 pt-8 text-center text-xs text-muted-ink">O passaporte para os melhores salões com tarifas inteligentes.</p>
    </div>
  );
}
