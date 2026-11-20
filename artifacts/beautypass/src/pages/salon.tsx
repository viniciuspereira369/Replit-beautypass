import { useMemo, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, MapPin, HelpCircle, Clock, Footprints, Sparkles, ChevronRight } from 'lucide-react';
import { getSalon } from '@/lib/data';
import { addDays, brl, dateKey, discountFraming, kindLabel, pad, PERIODS, type Period, priceFor, slotDiscount, slotState } from '@/lib/pricing';
import { isTaken, startHold, useStore } from '@/lib/store';
import { salonRating, salonReviews } from '@/lib/experience';
import { galleryFor, specialistPhoto } from '@/lib/media';
import { Photo, Portrait } from '@/components/art';
import { FavButton, FriendStack, LiveProof, fmtRating, liveDiscount, walkMin } from '@/components/salon-card';
import { DiscountFrame } from '@/components/discount-frame';
import { RadialClock } from '@/components/radial-clock';
import { PriceHelp } from '@/components/price-help';
import { Gallery, GuaranteeTiles, Reviews, ServiceCards, StaffStrip, galleryCrop } from '@/components/salon-parts';
import { useGuide } from '@/hooks/use-guide';
import NotFound from './not-found';
import { cn } from '@/lib/utils';

const STATE_STYLE: Record<string, string> = {
  Disponível: 'border-line bg-white text-ink', 'Alta Procura': 'border-gold/40 bg-amber-bg text-ink',
  Desconto: 'border-economy/50 bg-economy-bg text-forest', Ocupado: 'border-line bg-porcelain text-strike line-through cursor-not-allowed',
};

export default function SalonPage() {
  const { id } = useParams<{ id: string }>();
  const salon = getSalon(id ?? '');
  const st = useStore(); const [, navigate] = useLocation();
  const [svc, setSvc] = useState<string[]>(salon ? [salon.services[0].id] : []);
  const [staff, setStaff] = useState<string | null>(null);
  const [day, setDay] = useState(0); const [period, setPeriod] = useState<Period>('Tarde');
  const [hour, setHour] = useState<number | null>(null); const [help, setHelp] = useState(false); const [hero, setHero] = useState(0);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)), []);
  const clockRef = useGuide<HTMLElement>('salon-clock');
  if (!salon) return <NotFound />;
  const reviews = salonReviews(salon, st.reviews ?? []); const rating = salonRating(salon, st.reviews ?? []);
  const photos = galleryFor(salon);
  const key = dateKey(days[day]);
  const chosen = salon.services.filter((s) => svc.includes(s.id));
  const base = chosen.reduce((a, s) => a + s.base, 0);
  const duration = chosen.reduce((a, s) => a + s.duration, 0) + Math.max(0, chosen.length - 1) * 10;
  const slots = (hs: readonly number[]) => hs.map((h) => { const r = slotDiscount(salon, key, h, st.rules); const state = r.past ? 'Ocupado' : slotState(salon, key, h, r.disc, isTaken(st, salon.id, key, h, duration || 60)); return { h, ...r, state }; });
  const all = slots([9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  const cur = all.filter((s) => (PERIODS[period] as readonly number[]).includes(s.h));
  const sel = hour != null ? all.find((s) => s.h === hour) ?? null : null;
  const blocked = !sel || sel.state === 'Ocupado';
  const final = sel && !blocked ? priceFor(base, sel.disc) : base;
  const lbl = sel && !blocked ? kindLabel(sel.kind) : null;
  const maxToday = liveDiscount(salon, st.rules);
  const todayKey = dateKey(new Date());
  const freeToday = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].filter((h) => { const r = slotDiscount(salon, todayKey, h, st.rules); return !r.past && slotState(salon, todayKey, h, r.disc, isTaken(st, salon.id, todayKey, h, duration || 60)) !== 'Ocupado'; }).length;
  const lead = salon.staff[0];

  const pickHour = (h: number) => { setHour(h); const p = (Object.keys(PERIODS) as Period[]).find((k) => (PERIODS[k] as readonly number[]).includes(h)); if (p) setPeriod(p); };
  const pickPeriod = (p: Period) => { setPeriod(p); const avail = all.filter((s) => (PERIODS[p] as readonly number[]).includes(s.h)).find((s) => s.state !== 'Ocupado'); setHour(avail ? avail.h : PERIODS[p][0]); };

  const reserve = () => {
    if (!sel || blocked || !chosen.length) return;
    startHold({ salonId: salon.id, serviceIds: svc, staffId: staff, date: key, hour: sel.h, base, final, disc: sel.disc, kind: sel.kind });
    navigate('/checkout');
  };
  const darkBtn = 'flex h-11 w-11 items-center justify-center rounded-full bg-[#0C2D26]/45 text-white backdrop-blur-md transition active:scale-90';

  return (
    <div className="mx-auto max-w-3xl pb-6">
      <div className="relative h-[216px] overflow-hidden @3xl:h-[300px]">
        <AnimatePresence initial={false}>
          <motion.div key={hero} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <Photo src={photos[hero]} alt={`${salon.name} interior`} position={galleryCrop(hero)} className="h-full w-full" eager />
          </motion.div>
        </AnimatePresence>
        <div className="scrim-t absolute inset-0" />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          <button aria-label="Voltar" data-testid="link-back" onClick={() => (window.history.length > 1 ? window.history.back() : navigate('/'))} className={darkBtn}><ArrowLeft className="h-4 w-4" /></button>
          <div className="flex gap-2">
            <FavButton id={salon.id} onDark />
            <button aria-label="Por que este preço é menor?" aria-haspopup="dialog" data-testid="button-explain" onClick={() => setHelp(true)} className={darkBtn}><HelpCircle className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="relative -mt-6 rounded-t-[24px] bg-white px-5 pb-2 pt-10">
        <span className="absolute -top-[30px] left-1/2 -translate-x-1/2" data-testid="img-lead-portrait"><Portrait src={specialistPhoto(lead.name)} name={lead.name} className="h-[60px] w-[60px] shadow-lg ring-[3px]" /></span>
        <div className="mb-2 flex justify-center"><LiveProof salon={salon} /></div>
        <p className="text-[11px] font-bold uppercase tracking-[.18em] text-teal">{salon.hood} · {salon.category}</p>
        <h1 className="font-display text-[28px] font-semibold leading-tight text-forest" data-testid="text-salon-name">{salon.name}</h1>
        <p className="font-display text-sm italic text-teal-deep">{salon.tagline}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink tnum">
          <span className="flex items-center gap-1 font-bold"><Star className="h-3.5 w-3.5 fill-gold text-gold" />{fmtRating(rating)} <span className="font-normal text-muted-ink">· {reviews.length} avaliações</span></span>
          <span className="flex items-center gap-1 text-muted-ink"><MapPin className="h-3.5 w-3.5" />{salon.address}</span>
        </div>
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-ink"><FriendStack salon={salon} />{salon.mutuals.join(', ')} já foram aqui</p>

        <div className="mt-4 grid grid-cols-2 divide-x divide-line rounded-[20px] border border-line bg-white py-3 text-center">
          <button onClick={() => setHelp(true)} className="px-2"><p className="text-lg font-bold text-economy tnum">Até {maxToday}% OFF</p><p className="flex items-center justify-center gap-1 text-[11px] text-muted-ink"><Sparkles className="h-3 w-3" />Tarifa Inteligente</p></button>
          <div className="px-2"><p className="text-lg font-bold text-forest tnum">{walkMin(salon.distanceKm)} min a pé</p><p className="flex items-center justify-center gap-1 text-[11px] text-muted-ink"><Footprints className="h-3 w-3" />{freeToday || 'Sem'} horários hoje</p></div>
        </div>

        <div className="mt-6 space-y-6">
          <Gallery photos={photos} hero={hero} onPick={setHero} name={salon.name} />
          <section>
            <h2 className="tight mb-2 text-base font-bold text-forest">Onde</h2>
            <div className="flex items-center gap-3 rounded-[20px] border border-line bg-porcelain p-3.5" data-testid="text-salon-address">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-forest text-mint"><MapPin className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-forest">{salon.address}</p><p className="text-[11px] text-muted-ink">{salon.hood}, São Paulo · atendimento exclusivo no salão</p></div>
            </div>
          </section>
          <ServiceCards salon={salon} svc={svc} setSvc={setSvc} duration={duration} />
          <StaffStrip salon={salon} staff={staff} setStaff={setStaff} />

          <section ref={clockRef} id="agenda">
            <h2 className="tight mb-2 text-base font-bold text-forest">Quando</h2>
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {days.map((d, i) => <motion.button whileTap={{ scale: 0.92 }} key={i} data-testid={`button-day-${i}`} aria-pressed={day === i} onClick={() => { setDay(i); setHour(null); }} className={cn('flex w-14 shrink-0 flex-col items-center rounded-2xl border py-2 text-xs transition', day === i ? 'border-forest bg-forest text-white' : 'border-line bg-white text-ink')}><span className="capitalize opacity-80">{i === 0 ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span><b className="text-base tnum">{d.getDate()}</b></motion.button>)}
            </div>
            <div className="mt-3"><RadialClock slots={all} hour={hour} onHour={pickHour} period={period} onPeriod={pickPeriod} /></div>
            <div className="mt-3 grid grid-cols-3 gap-2 @xl:grid-cols-6">
              {cur.map((s) => (
                <motion.button whileTap={s.state === 'Ocupado' ? undefined : { scale: 0.94 }} key={s.h} disabled={s.state === 'Ocupado'} aria-pressed={hour === s.h} data-testid={`button-slot-${s.h}`} onClick={() => pickHour(s.h)}
                  className={cn('rounded-2xl border px-1 py-2 text-center text-xs transition', STATE_STYLE[s.state], hour === s.h && 'ring-2 ring-forest')}>
                  <b className="block text-sm tnum">{pad(s.h)}:00</b>
                  {s.state === 'Desconto' ? <span className="block text-[10px] tnum leading-tight" data-testid={`text-slot-price-${s.h}`}><s className="text-strike">{brl(base)}</s> <b className="text-economy">{brl(priceFor(base, s.disc))}</b><span className="block font-bold text-economy">-{s.disc}%</span>{kindLabel(s.kind) && <span className="sr-only">{kindLabel(s.kind)!.title} {kindLabel(s.kind)!.sub}</span>}</span>
                    : <span className="block text-[10px]">{s.state}</span>}
                </motion.button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-ink">{Object.keys(STATE_STYLE).map((k) => <span key={k} className="flex items-center gap-1"><span className={cn('h-2.5 w-2.5 rounded border', STATE_STYLE[k])} />{k}</span>)}</div>

            <div className="mt-3 rounded-[20px] border border-line bg-white p-4" data-testid="card-live-price" aria-live="polite">
              {!chosen.length ? <p className="flex items-center gap-2 text-sm text-muted-ink"><Clock className="h-4 w-4" />Selecione ao menos um serviço para ver o preço.</p> : (
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-ink">{sel ? `${pad(sel.h)}:00 · ${chosen.map((c) => c.name).join(' + ')}` : 'Escolha um horário'}</p>
                    {lbl && sel && sel.disc > 0 && <p className="text-[11px] text-muted-ink">{lbl.sub}</p>}
                    {sel && blocked && <p className="text-xs font-semibold text-muted-ink">Horário indisponível</p>}
                  </div>
                  <div className="text-right tnum">
                    {sel && !blocked && discountFraming(base, final, sel.disc) && <DiscountFrame base={base} final={final} disc={sel.disc} kind={sel.kind} align="right" tid="frame-live-price" className="mb-1" />}
                    <p>{sel && !blocked && sel.disc > 0 && <s className="mr-1.5 text-xs text-strike">{brl(base)}</s>}<b className="text-xl text-forest" data-testid="text-total">{brl(final)}</b></p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <GuaranteeTiles />
          <Reviews reviews={reviews} rating={rating} />
        </div>
      </div>

      <div className="sticky bottom-0 z-20 mt-6 rounded-t-[24px] border-t border-line bg-white/95 px-4 pb-7 pt-3 backdrop-blur" data-testid="bar-checkout" data-sticky-bar>
        <motion.button whileTap={{ scale: 0.97 }} data-testid="button-reserve" disabled={blocked || !chosen.length} onClick={reserve}
          className="flex w-full items-center justify-between rounded-full bg-forest px-5 py-3.5 text-sm font-bold text-white transition hover:bg-forest-hover disabled:bg-strike disabled:opacity-70">
          <span className="flex items-center gap-1">Avançar para Pagamento<ChevronRight className="h-4 w-4" /></span><span className="tnum">{chosen.length && !blocked ? brl(final) : sel ? 'indisponível' : 'escolha o horário'}</span>
        </motion.button>
      </div>
      <PriceHelp open={help} onOpenChange={setHelp} />
    </div>
  );
}
