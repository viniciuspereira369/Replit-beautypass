import { useState } from 'react';
import { useLocation } from 'wouter';
import { Zap, Star, Footprints, Trophy, MapPin, PiggyBank, CalendarX } from 'lucide-react';
import { SALONS, type Salon } from '@/lib/data';
import { addDays, brl, dateKey, HOURS, slotDiscount, slotState, pad } from '@/lib/pricing';
import { getState, isTaken, startHold, useStore } from '@/lib/store';
import { Empty, PageHeader } from '@/components/shell';
import { cn } from '@/lib/utils';

const CATS = ['Todos', 'Cabelo', 'Barba', 'Unhas', 'Massagem', 'Estética'];
const WINDOWS = ['Próximas 3h', 'Tarde', 'Noite'] as const;
type Match = { salon: Salon; date: string; hour: number; base: number; final: number; disc: number; kind: ReturnType<typeof slotDiscount>['kind']; label: string };

function findMatches(cat: string, win: (typeof WINDOWS)[number]): Match[] {
  const st = getState(); const now = new Date();
  const opts: Omit<Match, 'label'>[] = [];
  for (const s of SALONS.filter((x) => cat === 'Todos' || x.category === cat)) {
    let best: Omit<Match, 'label'> | null = null;
    for (const off of [0, 1]) {
      const key = dateKey(addDays(now, off));
      const hrs = win === 'Tarde' ? [12, 13, 14, 15, 16, 17] : win === 'Noite' ? [18, 19, 20] : HOURS.filter((h) => { const d = (new Date(now).setHours(h, 0, 0, 0) - now.getTime()) / 36e5; return off === 0 && d > 0 && d <= 3; });
      for (const h of hrs) {
        const r = slotDiscount(s, key, h, st.rules, now);
        if (r.past || slotState(s, key, h, r.disc, isTaken(st, s.id, key, h, s.services[0].duration)) === 'Ocupado') continue;
        const base = s.services[0].base;
        const final = Math.max(Math.round(base * (1 - r.disc / 100)), 30, Math.ceil(base * 0.45));
        if (!best || final < best.final) best = { salon: s, date: key, hour: h, base, final, disc: r.disc, kind: r.kind };
      }
      if (best || win === 'Próximas 3h') break;
    }
    if (best) opts.push(best);
  }
  const out: Match[] = []; const used = new Set<string>();
  const pick = (sorted: typeof opts, label: string) => { const m = sorted.find((o) => !used.has(o.salon.id)) ?? sorted[0]; if (m && !out.some((o) => o.salon.id === m.salon.id && o.label === label)) { used.add(m.salon.id); out.push({ ...m, label }); } };
  pick([...opts].sort((a, b) => b.salon.rating / b.final - a.salon.rating / a.final), 'Melhor Custo-Benefício');
  pick([...opts].sort((a, b) => a.salon.distanceKm - b.salon.distanceKm), 'Mais Próximo');
  pick([...opts].sort((a, b) => (b.base - b.final) - (a.base - a.final)), 'Maior Economia');
  return opts.length ? out : [];
}

const ICONS = { 'Melhor Custo-Benefício': Trophy, 'Mais Próximo': MapPin, 'Maior Economia': PiggyBank } as Record<string, typeof Trophy>;

export default function PedirPage() {
  useStore();
  const [, navigate] = useLocation();
  const [cat, setCat] = useState('Todos'); const [win, setWin] = useState<(typeof WINDOWS)[number]>('Próximas 3h');
  const [phase, setPhase] = useState<'idle' | 'scan' | 'done'>('idle'); const [res, setRes] = useState<Match[]>([]);
  const run = () => { setPhase('scan'); setTimeout(() => { setRes(findMatches(cat, win)); setPhase('done'); }, 1500); };
  const book = (m: Match) => {
    startHold({ salonId: m.salon.id, serviceIds: [m.salon.services[0].id], staffId: null, date: m.date, hour: m.hour, mode: 'salao', base: m.base, final: m.final, fee: 0, disc: m.disc, kind: m.kind });
    navigate('/checkout');
  };
  const chip = (on: boolean) => cn('rounded-full border px-3.5 py-2 text-xs font-medium transition active:scale-95', on ? 'border-forest bg-forest text-tint' : 'border-line bg-white text-ink');

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Encaixe inteligente" title="Pedir Agora"><p className="mt-1 text-sm text-muted-ink">Diga o que quer e quando. Encontramos o melhor horário ocioso perto de você.</p></PageHeader>
      <div className="space-y-4 px-5 pt-5">
        <fieldset><legend className="mb-2 text-xs font-semibold text-ink">Categoria</legend><div className="flex flex-wrap gap-2">{CATS.map((c) => <button key={c} data-testid={`button-pedir-cat-${c}`} onClick={() => { setCat(c); setPhase('idle'); }} className={chip(cat === c)}>{c}</button>)}</div></fieldset>
        <fieldset><legend className="mb-2 text-xs font-semibold text-ink">Quando</legend><div className="flex flex-wrap gap-2">{WINDOWS.map((w) => <button key={w} data-testid={`button-pedir-win-${w}`} onClick={() => { setWin(w); setPhase('idle'); }} className={chip(win === w)}>{w}</button>)}</div></fieldset>
        <button data-testid="button-pedir-search" disabled={phase === 'scan'} onClick={run} className="flex w-full items-center justify-center gap-2 rounded-full bg-forest py-3.5 text-sm font-semibold text-tint transition hover:bg-forest-hover active:scale-[.98] disabled:opacity-70"><Zap className="h-4 w-4 text-mint" />Encontrar horário</button>
      </div>

      {phase === 'scan' && (
        <div className="flex flex-col items-center py-8" aria-live="polite">
          <svg viewBox="0 0 200 200" className="h-48 w-48">
            {[30, 55, 80].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#8DD1BF" strokeWidth="1" />)}
            <g className="radar-sweep"><path d="M100 100 L100 20 A80 80 0 0 1 169 60Z" fill="#5EEAD4" opacity=".35" /></g>
            <circle cx="100" cy="100" r="6" fill="#0D9488" />
            {[[60, 70], [140, 80], [125, 145]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#F43F5E" className="live-dot" />)}
          </svg>
          <p className="text-sm text-muted-ink">Varrendo agendas em Pinheiros e arredores…</p>
        </div>
      )}
      {phase === 'done' && (
        <div className="space-y-3 px-5 pt-6">
          {res.length === 0 ? <Empty icon={CalendarX} title="Sem encaixes nessa janela" text="Tente outra categoria ou a janela da Tarde." /> : res.map((m, i) => {
            const Icon = ICONS[m.label];
            return (
              <div key={m.label} className="rise flex items-center gap-3 rounded-3xl border border-line bg-white p-4" style={{ animationDelay: `${i * 90}ms` }} data-testid={`card-match-${i}`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tint-2 text-teal-deep"><Icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-teal">{m.label}</p>
                  <p className="truncate font-display font-semibold text-forest">{m.salon.name}</p>
                  <p className="flex items-center gap-2 text-[11px] text-muted-ink tnum"><Star className="h-3 w-3 fill-gold text-gold" />{m.salon.rating}<Footprints className="h-3 w-3" />{m.salon.distanceKm.toString().replace('.', ',')} km · {m.date === dateKey(new Date()) ? 'Hoje' : 'Amanhã'} {pad(m.hour)}:00</p>
                </div>
                <div className="text-right tnum">
                  {m.disc > 0 && <p className="text-[11px] text-muted-ink line-through">{brl(m.base)}</p>}
                  <p className="font-bold text-forest">{brl(m.final)}</p>
                  <button data-testid={`button-match-book-${i}`} onClick={() => book(m)} className="mt-1 rounded-full bg-coral px-3 py-1 text-[11px] font-semibold text-white active:scale-95">Reservar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
