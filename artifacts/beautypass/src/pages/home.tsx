import { useMemo, useState } from 'react';
import { Search, MapPin, X, Gift, SearchX, LayoutGrid, Scissors, Sparkles, Hand, Flower2, Droplets, Users } from 'lucide-react';
import { CATEGORIES, SALONS } from '@/lib/data';
import { norm } from '@/lib/pricing';
import { dismissClub, useStore } from '@/lib/store';
import { liveDiscount, SalonCard } from '@/components/salon-card';
import { Empty } from '@/components/shell';
import { cn } from '@/lib/utils';

const CAT_ICONS = { Todos: LayoutGrid, Cabelo: Scissors, Barba: Sparkles, Unhas: Hand, Massagem: Flower2, Estética: Droplets } as const;
const SORTS = ['Todos', 'Mais Economia', 'Mais Próximos', 'Favoritos'] as const;
const pill = (on: boolean) => cn('shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition active:scale-95', on ? 'border-forest bg-forest text-tint' : 'border-line bg-white text-ink hover:border-mint-2');

export default function HomePage() {
  const st = useStore();
  const [q, setQ] = useState(''); const [cat, setCat] = useState<string>('Todos');
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Todos'); const [minD, setMinD] = useState(0);
  const done = Math.min(3, st.bookings.filter((b) => b.status === 'COMPLETED').length);

  const list = useMemo(() => {
    let l = SALONS.filter((s) => (cat === 'Todos' || s.category === cat || (s.category === 'Misto' && cat === 'Cabelo')) && liveDiscount(s, st.rules) >= minD);
    if (q.trim()) { const n = norm(q); l = l.filter((s) => norm(`${s.name} ${s.hood} ${s.category} ${s.services.map((x) => x.name).join(' ')}`).includes(n)); }
    if (sort === 'Mais Economia') l = [...l].sort((a, b) => b.services[0].base * liveDiscount(b, st.rules) - a.services[0].base * liveDiscount(a, st.rules));
    if (sort === 'Mais Próximos') l = [...l].sort((a, b) => a.distanceKm - b.distanceKm);
    if (sort === 'Favoritos') l = l.filter((s) => st.favorites.includes(s.id));
    return l;
  }, [q, cat, sort, minD, st.favorites, st.rules]);

  return (
    <div className="mx-auto max-w-6xl">
      <section className="rise px-5 pt-6">
        <p className="flex items-center gap-1 text-xs text-muted-ink"><MapPin className="h-3.5 w-3.5 text-teal" />Pinheiros, São Paulo</p>
        <h1 className="mt-1 font-display text-[32px] font-semibold leading-tight text-forest" data-testid="text-greeting">Olá, {st.user.name.split(' ')[0]}.</h1>
        <p className="font-display text-lg italic text-teal-deep">Sua beleza, no seu tempo.</p>
        <label className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 focus-within:border-teal focus-within:ring-2 focus-within:ring-mint/40">
          <Search className="h-4 w-4 text-muted-ink" /><span className="sr-only">Buscar</span>
          <input data-testid="input-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar salão, bairro ou serviço" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-ink" />
          {q && <button aria-label="Limpar" onClick={() => setQ('')}><X className="h-4 w-4 text-muted-ink" /></button>}
        </label>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {[15, 25, 30, 35].map((d) => <button key={d} data-testid={`pill-discount-${d}`} onClick={() => setMinD(minD === d ? 0 : d)} className={cn(pill(minD === d), 'tnum')}>-{d}% ou mais</button>)}
        </div>
      </section>

      {!st.user.clubDismissed && (
        <section className="rise mx-5 mt-5 overflow-hidden rounded-3xl bg-forest p-5 text-tint" data-testid="card-club">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint/15 text-mint"><Gift className="h-5 w-5" /></span>
              <div><p className="font-display text-lg">Clube BeautyPass</p><p className="text-sm text-mint-3">15% de cashback em BeautyCredits nas suas 3 primeiras reservas.</p></div>
            </div>
            <button data-testid="button-dismiss-club" aria-label="Dispensar" onClick={dismissClub} className="rounded-full p-1 text-mint-2 hover:bg-white/10"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-mint transition-all" style={{ width: `${(done / 3) * 100}%` }} /></div>
            <span className="text-xs font-semibold tnum">{done}/3</span>
          </div>
        </section>
      )}

      <section className="mt-6 px-5">
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1" role="group" aria-label="Categorias">{CATEGORIES.map((c) => { const I = CAT_ICONS[c]; const on = cat === c; return (
          <button key={c} data-testid={`button-category-${c}`} aria-pressed={on} onClick={() => setCat(c)} className="group flex w-16 shrink-0 flex-col items-center gap-1.5">
            <span className={cn('flex h-14 w-14 items-center justify-center rounded-full border transition group-active:scale-90', on ? 'border-forest bg-forest text-mint shadow-md' : 'border-line bg-white text-teal-deep group-hover:border-mint-2 group-hover:bg-tint')}><I className="h-5 w-5" /></span>
            <span className={cn('text-[11px] font-medium', on ? 'text-forest' : 'text-muted-ink')}>{c}</span>
          </button>); })}</div>
        <div className="mt-3 flex gap-4 border-b border-line">
          {SORTS.map((s) => <button key={s} data-testid={`button-sort-${s}`} onClick={() => setSort(s)} className={cn('-mb-px border-b-2 pb-2 text-xs font-semibold transition', sort === s ? 'border-teal text-forest' : 'border-transparent text-muted-ink')}>{s}</button>)}
        </div>
      </section>

      <h2 className="mt-6 flex items-center gap-2 px-5 font-display text-2xl font-semibold text-forest" data-testid="text-friends-heading"><Users className="h-5 w-5 text-teal" />Amigas estão agendando</h2>
      <section className="mt-3 grid gap-4 px-5 @2xl:grid-cols-2 @5xl:grid-cols-3">
        {list.map((s, i) => <SalonCard key={s.id} salon={s} i={i} />)}
      </section>
      {list.length === 0 && <div className="px-5"><Empty icon={SearchX} title={sort === 'Favoritos' ? 'Nenhum favorito ainda' : 'Nada por aqui'} text={sort === 'Favoritos' ? 'Toque no coração de um salão para guardá-lo aqui.' : 'Tente outro termo, categoria ou faixa de desconto.'} action={<button onClick={() => { setQ(''); setCat('Todos'); setMinD(0); setSort('Todos'); }} className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-tint">Limpar filtros</button>} /></div>}
      <p className="px-5 pt-8 text-center text-xs text-muted-ink">O passaporte para os melhores salões com tarifas inteligentes.</p>
    </div>
  );
}
