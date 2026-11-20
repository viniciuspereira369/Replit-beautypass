import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowLeft, Star, MapPin, HelpCircle, Check, Home as HomeIcon, Store, Award, Clock } from 'lucide-react';
import { getSalon } from '@/lib/data';
import { addDays, brl, dateKey, domicileFee, EXPLAIN, kindLabel, pad, PERIODS, type Period, priceFor, slotDiscount, slotState } from '@/lib/pricing';
import { isTaken, startHold, useStore } from '@/lib/store';
import { CategoryArt, Initials } from '@/components/art';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FavButton, LiveProof } from '@/components/salon-card';
import { Empty } from '@/components/shell';
import NotFound from './not-found';
import { cn } from '@/lib/utils';

const STATE_STYLE: Record<string, string> = {
  Disponível: 'border-line bg-white text-ink', 'Alta Procura': 'border-gold/40 bg-[#FFFBEB] text-ink',
  Desconto: 'border-teal bg-tint text-forest', Ocupado: 'border-line bg-tint-2 text-muted-ink/60 line-through cursor-not-allowed',
};

export default function SalonPage() {
  const { id } = useParams<{ id: string }>(); const salon = getSalon(id ?? '');
  const st = useStore(); const [, navigate] = useLocation();
  const [svc, setSvc] = useState<string[]>(salon ? [salon.services[0].id] : []);
  const [staff, setStaff] = useState<string | null>(null);
  const [mode, setMode] = useState<'salao' | 'domicilio'>('salao');
  const [day, setDay] = useState(0); const [period, setPeriod] = useState<Period>('Tarde');
  const [hour, setHour] = useState<number | null>(null); const [help, setHelp] = useState(false);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)), []);
  if (!salon) return <NotFound />;
  const key = dateKey(days[day]);
  const chosen = salon.services.filter((s) => svc.includes(s.id));
  const base = chosen.reduce((a, s) => a + s.base, 0);
  const duration = chosen.reduce((a, s) => a + s.duration, 0) + Math.max(0, chosen.length - 1) * 10;
  const fee = mode === 'domicilio' ? domicileFee(salon.distanceKm) : 0;
  const slots = (hs: readonly number[]) => hs.map((h) => { const r = slotDiscount(salon, key, h, st.rules); const state = r.past ? 'Ocupado' : slotState(salon, key, h, r.disc, isTaken(st, salon.id, key, h, duration || 60)); return { h, ...r, state }; });
  const cur = slots(PERIODS[period]);
  const sel = hour != null ? slots([hour])[0] : null;
  const final = sel ? priceFor(base, sel.disc) : base;
  const lbl = sel ? kindLabel(sel.kind) : null;

  const reserve = () => {
    if (!sel || sel.state === 'Ocupado' || !chosen.length) return;
    startHold({ salonId: salon.id, serviceIds: svc, staffId: staff, date: key, hour: sel.h, mode, base, final, fee, disc: sel.disc, kind: sel.kind });
    navigate('/checkout');
  };

  return (
    <div className="mx-auto max-w-5xl pb-24">
      <div className="relative">
        <CategoryArt category={salon.category} seed={salon.id + 'hero'} className="h-56 @3xl:h-72 @3xl:rounded-b-[40px]" />
        <Link href="/" aria-label="Voltar" data-testid="link-back" className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90"><ArrowLeft className="h-4 w-4 text-ink" /></Link>
        <FavButton id={salon.id} className="absolute right-4 top-4" />
        <div className="absolute bottom-5 left-5 right-5 text-tint">
          <p className="text-[11px] uppercase tracking-[.2em] text-mint">{salon.hood} · {salon.category}</p>
          <h1 className="font-display text-3xl font-semibold leading-tight" data-testid="text-salon-name">{salon.name}</h1>
          <p className="font-display text-sm italic text-mint-3">{salon.tagline}</p>
        </div>
      </div>
      <div className="space-y-6 px-5 pt-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink tnum">
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-gold text-gold" />{salon.rating} · {salon.reviews.length} avaliações</span>
          <span className="flex items-center gap-1 text-muted-ink"><MapPin className="h-3.5 w-3.5" />{salon.address}</span>
        </div>
        <LiveProof salon={salon} />
        <p className="flex items-center gap-2 text-xs text-muted-ink"><span className="flex -space-x-1.5">{salon.mutuals.map((m) => <Initials key={m} name={m} className="h-6 w-6" />)}</span>{salon.mutuals.join(', ')} já foram aqui</p>

        <div className="relative rounded-2xl bg-tint p-3 text-sm text-forest">
          <button data-testid="button-explain" aria-haspopup="dialog" onClick={() => setHelp(true)} className="flex w-full items-center justify-between font-medium">Por que este preço é menor? <HelpCircle className="h-4 w-4 text-teal" aria-hidden /></button>
          <Dialog open={help} onOpenChange={setHelp}>
            <DialogContent className="max-w-sm rounded-3xl border-line bg-porcelain" data-testid="dialog-explain">
              <DialogHeader><DialogTitle className="font-display text-xl text-forest">Como funcionam as tarifas inteligentes</DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-ink" data-testid="text-explain">{EXPLAIN}</DialogDescription></DialogHeader>
              <button data-testid="button-explain-close" onClick={() => setHelp(false)} className="rounded-full bg-forest py-2.5 text-sm font-semibold text-tint">Entendi</button>
            </DialogContent>
          </Dialog>
        </div>

        <section>
          <h2 className="mb-2 font-display text-xl text-forest">Onde</h2>
          <div className="grid grid-cols-2 gap-2 rounded-full bg-tint-2 p-1">
            {([['salao', 'No Salão', Store], ['domicilio', 'A Domicílio', HomeIcon]] as const).map(([v, l, I]) => <button key={v} data-testid={`button-mode-${v}`} onClick={() => setMode(v)} className={cn('flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition', mode === v ? 'bg-white text-forest shadow-sm' : 'text-muted-ink')}><I className="h-3.5 w-3.5" />{l}</button>)}
          </div>
          {mode === 'domicilio' && <p className="mt-2 text-xs text-muted-ink tnum">Taxa de deslocamento {brl(fee)} (R$ 10 até 2 km + R$ 5 por km extra · {salon.distanceKm.toString().replace('.', ',')} km)</p>}
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl text-forest">Serviços</h2>
          <div className="space-y-2">
            {salon.services.map((s) => { const on = svc.includes(s.id); return (
              <button key={s.id} data-testid={`button-service-${s.id}`} aria-pressed={on} onClick={() => setSvc(on ? svc.filter((x) => x !== s.id) : [...svc, s.id])} className={cn('flex w-full items-center justify-between rounded-2xl border p-3 text-left transition', on ? 'border-teal bg-tint' : 'border-line bg-white')}>
                <span className="flex items-center gap-3"><span className={cn('flex h-5 w-5 items-center justify-center rounded-md border', on ? 'border-teal bg-teal text-white' : 'border-line')}>{on && <Check className="h-3 w-3" />}</span><span><span className="block text-sm font-medium text-ink">{s.name}</span><span className="text-[11px] text-muted-ink">{s.duration} min</span></span></span>
                <span className="text-sm font-semibold text-forest tnum">{brl(s.base)}</span>
              </button>); })}
          </div>
          {chosen.length > 1 && <p className="mt-2 text-xs text-muted-ink">Duração total {duration} min, incluindo 10 min de intervalo entre serviços.</p>}
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl text-forest">Profissional</h2>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            <button data-testid="button-staff-any" onClick={() => setStaff(null)} className={cn('shrink-0 rounded-2xl border px-4 py-3 text-left text-xs', staff === null ? 'border-teal bg-tint' : 'border-line bg-white')}><b className="block text-ink">Qualquer Profissional</b><span className="text-muted-ink">mais horários</span></button>
            {salon.staff.map((p) => <button key={p.id} data-testid={`button-staff-${p.id}`} onClick={() => setStaff(p.id)} className={cn('flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs', staff === p.id ? 'border-teal bg-tint' : 'border-line bg-white')}>
              <Initials name={p.name} className="h-8 w-8" /><span><b className="block text-ink">{p.name}</b><span className="text-muted-ink">{p.role} · {p.rating.toFixed(1)}</span>{p.featured && <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-gold"><Award className="h-3 w-3" />Destaque da Casa</span>}</span></button>)}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl text-forest">Quando</h2>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {days.map((d, i) => <button key={i} data-testid={`button-day-${i}`} onClick={() => { setDay(i); setHour(null); }} className={cn('flex w-14 shrink-0 flex-col items-center rounded-2xl border py-2 text-xs transition', day === i ? 'border-forest bg-forest text-tint' : 'border-line bg-white text-ink')}><span className="capitalize opacity-80">{i === 0 ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span><b className="text-base tnum">{d.getDate()}</b></button>)}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(Object.keys(PERIODS) as Period[]).map((p) => { const m = Math.max(0, ...slots(PERIODS[p]).filter((x) => x.state !== 'Ocupado').map((x) => x.disc)); return (
              <button key={p} data-testid={`button-period-${p}`} onClick={() => setPeriod(p)} className={cn('rounded-2xl border px-2 py-2 text-xs', period === p ? 'border-teal bg-tint' : 'border-line bg-white')}><b className="block text-ink">{p}</b><span className={m ? 'font-semibold text-teal-deep' : 'text-muted-ink'}>{m ? `até -${m}%` : 'preço cheio'}</span></button>); })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 @xl:grid-cols-3">
            {cur.map((s) => { const kl = kindLabel(s.kind); const sf = priceFor(base, s.disc); return (
              <button key={s.h} disabled={s.state === 'Ocupado'} data-testid={`button-slot-${s.h}`} onClick={() => setHour(s.h)} className={cn('rounded-2xl border px-2 py-2 text-center text-xs transition active:scale-95', STATE_STYLE[s.state], hour === s.h && 'ring-2 ring-forest')}>
                <b className="block text-sm tnum">{pad(s.h)}:00</b>
                {s.state === 'Desconto' && kl ? (<span className="block tnum" data-testid={`text-slot-price-${s.h}`}>
                  <span className="block"><s className="text-[10px] text-muted-ink">{brl(base)}</s> <b className="text-sm text-forest">{brl(sf)}</b> <span className="rounded bg-coral px-1 text-[10px] font-bold text-white">-{s.disc}%</span></span>
                  <span className="block text-[10px] font-semibold text-teal-deep">{kl.title}</span>
                  <span className="block text-[9px] leading-tight text-muted-ink">+ {kl.sub}</span>
                </span>) : (<span className="block text-[10px]">{s.state}{s.state !== 'Ocupado' && <span className="block text-xs font-semibold text-ink tnum">{brl(base)}</span>}</span>)}
              </button>
            ); })}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-ink">{Object.keys(STATE_STYLE).map((k) => <span key={k} className="flex items-center gap-1"><span className={cn('h-2.5 w-2.5 rounded border', STATE_STYLE[k])} />{k}</span>)}</div>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl text-forest">Avaliações</h2>
          <div className="grid gap-2 @2xl:grid-cols-3">{salon.reviews.map((r) => <div key={r.author} className="rounded-2xl border border-line bg-white p-3"><p className="flex items-center justify-between text-xs font-semibold text-ink">{r.author}<span className="flex items-center gap-1 tnum"><Star className="h-3 w-3 fill-gold text-gold" />{r.rating}</span></p><p className="mt-1 text-xs text-muted-ink">{r.text}</p><p className="mt-1 text-[10px] text-muted-ink">{r.when}</p></div>)}</div>
        </section>
      </div>

      <div className="sticky bottom-24 z-20 mx-4 mt-6 rounded-3xl bg-forest p-4 text-tint shadow-xl">
        {!chosen.length ? <Empty icon={Clock} title="Escolha um serviço" text="Selecione ao menos um serviço para ver o preço." /> : (
          <div className="flex items-center justify-between gap-3">
            <div className="tnum">
              {sel && sel.disc > 0 && lbl ? <p className="text-[11px] text-mint"><b>{lbl.title}</b> · {lbl.sub} · -{sel.disc}%</p> : <p className="text-[11px] text-mint-3">{sel ? `${pad(sel.h)}:00 · preço padrão` : 'Escolha um horário'}</p>}
              <p>{sel && sel.disc > 0 && <s className="mr-2 text-xs text-mint-3">{brl(base)}</s>}<span className="text-xl font-bold" data-testid="text-total">{brl(final + fee)}</span></p>
            </div>
            <button data-testid="button-reserve" disabled={!sel || sel.state === 'Ocupado'} onClick={reserve} className="rounded-full bg-mint px-5 py-3 text-sm font-bold text-forest transition hover:bg-mint-2 active:scale-95 disabled:opacity-40">Reservar</button>
          </div>
        )}
      </div>
    </div>
  );
}
