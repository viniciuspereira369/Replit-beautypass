import { motion } from 'framer-motion';
import { Plus, Check, Award, Star, ShieldCheck, CalendarX2, BadgeCheck, Users } from 'lucide-react';
import type { Review, Salon } from '@/lib/data';
import { brl } from '@/lib/pricing';
import { specialistPhoto, treatmentPhoto } from '@/lib/media';
import { Photo, Portrait } from './art';
import { cn } from '@/lib/utils';

const CROPS = ['50% 50%', '30% 40%', '70% 60%', '50% 20%'];

export function Gallery({ photos, hero, onPick, name }: { photos: string[]; hero: number; onPick: (i: number) => void; name: string }) {
  return (
    <section>
      <h2 className="tight mb-2 text-base font-bold text-forest">Ambiente & Espaço</h2>
      <div className="grid grid-cols-4 gap-2">
        {photos.map((p, i) => (
          <motion.button key={i} whileTap={{ scale: 0.93 }} aria-label={`Foto ${i + 1} de ${name}`} aria-pressed={hero === i} data-testid={`button-gallery-${i}`} onClick={() => onPick(i)}
            className={cn('overflow-hidden rounded-2xl transition', hero === i ? 'ring-2 ring-forest ring-offset-2' : 'opacity-90 hover:opacity-100')}>
            <Photo src={p} alt={`${name} ambiente ${i + 1}`} position={CROPS[i]} className="aspect-square w-full" />
          </motion.button>
        ))}
      </div>
    </section>
  );
}
export const galleryCrop = (i: number) => CROPS[i] ?? '50% 50%';

export function ServiceCards({ salon, svc, setSvc, duration }: { salon: Salon; svc: string[]; setSvc: (s: string[]) => void; duration: number }) {
  const chosen = salon.services.filter((s) => svc.includes(s.id));
  return (
    <section>
      <h2 className="tight mb-2 text-base font-bold text-forest">Serviços</h2>
      <div className="space-y-2">
        {salon.services.map((s) => { const on = svc.includes(s.id); return (
          <motion.button key={s.id} whileTap={{ scale: 0.98 }} data-testid={`button-service-${s.id}`} aria-pressed={on} onClick={() => setSvc(on ? svc.filter((x) => x !== s.id) : [...svc, s.id])}
            className={cn('flex w-full items-center gap-3 rounded-[20px] border bg-white p-2.5 text-left transition', on ? 'border-teal bg-tint/60' : 'border-line')}>
            <span className="relative shrink-0">
              <Photo src={treatmentPhoto(s.name, salon.category)} alt={s.name} className="h-[60px] w-[60px] rounded-2xl" />
              <motion.span key={String(on)} initial={{ scale: 0.5 }} animate={{ scale: 1 }} className={cn('absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white', on ? 'bg-teal text-white' : 'bg-white text-forest shadow')}>{on ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}</motion.span>
            </span>
            <span className="min-w-0 flex-1"><b className="block text-sm text-ink">{s.name}</b><span className="text-[11px] text-muted-ink tnum">{s.duration} min</span></span>
            <span className="pr-1 text-sm font-bold text-forest tnum">{brl(s.base)}</span>
          </motion.button>); })}
      </div>
      {chosen.length > 0 && (
        <div className="mt-2 flex items-center justify-between rounded-2xl bg-tint px-3 py-2 text-xs text-forest tnum" data-testid="text-package-summary">
          <span>{chosen.length} serviço{chosen.length > 1 ? 's' : ''} · {duration} min</span><b>{brl(chosen.reduce((a, s) => a + s.base, 0))}</b>
        </div>
      )}
      {chosen.length > 1 && <p className="mt-1.5 text-[11px] text-muted-ink">Duração total {duration} min, incluindo 10 min de intervalo entre serviços.</p>}
    </section>
  );
}

export function StaffStrip({ salon, staff, setStaff }: { salon: Salon; staff: string | null; setStaff: (s: string | null) => void }) {
  return (
    <section>
      <h2 className="tight mb-2 text-base font-bold text-forest">Profissional</h2>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        <button data-testid="button-staff-any" aria-pressed={staff === null} onClick={() => setStaff(null)} className={cn('flex w-[104px] shrink-0 flex-col items-center rounded-[20px] border px-2 py-3 text-center text-xs transition', staff === null ? 'border-teal bg-tint' : 'border-line bg-white')}>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-economy-bg text-economy"><Users className="h-6 w-6" /></span>
          <b className="mt-1.5 block leading-tight text-ink">Qualquer Profissional</b><span className="text-[10px] text-muted-ink">mais horários</span>
        </button>
        {salon.staff.map((p, i) => (
          <button key={p.id} data-testid={`button-staff-${p.id}`} aria-pressed={staff === p.id} onClick={() => setStaff(p.id)} className={cn('relative flex w-[104px] shrink-0 flex-col items-center rounded-[20px] border px-2 py-3 text-center text-xs transition', staff === p.id ? 'border-teal bg-tint' : 'border-line bg-white')}>
            <Portrait src={specialistPhoto(p.name, i)} name={p.name} className={cn('h-14 w-14', p.featured && 'ring-gold')} />
            <b className="mt-1.5 block w-full truncate text-ink">{p.name}</b><span className="w-full truncate text-[10px] text-muted-ink">{p.role}</span>
            <span className="mt-0.5 flex items-center gap-0.5 text-[10px] font-bold text-ink tnum"><Star className="h-2.5 w-2.5 fill-gold text-gold" />{p.rating.toFixed(1).replace('.', ',')}</span>
            {p.featured && <span className="absolute -top-2 flex items-center gap-0.5 rounded-full bg-gold px-1.5 py-0.5 text-[9px] font-bold text-white"><Award className="h-2.5 w-2.5" />Destaque da Casa</span>}
          </button>
        ))}
      </div>
    </section>
  );
}

export function GuaranteeTiles() {
  return (
    <section className="grid grid-cols-2 gap-2">
      <div className="rounded-[20px] bg-economy-bg p-3"><ShieldCheck className="h-5 w-5 text-economy" /><p className="tight mt-1 text-sm font-bold text-forest">Teto de Preço</p><p className="text-[11px] text-ink">O valor fica congelado após a confirmação.</p></div>
      <div className="rounded-[20px] bg-tint p-3"><CalendarX2 className="h-5 w-5 text-teal-deep" /><p className="tight mt-1 text-sm font-bold text-forest">Cancelamento Grátis</p><p className="text-[11px] text-ink">Até 24h antes. Depois, multa de 30%.</p></div>
    </section>
  );
}

export function Reviews({ reviews, rating }: { reviews: Review[]; rating: number }) {
  return (
    <section data-testid="section-reviews">
      <h2 className="tight mb-2 flex items-center justify-between text-base font-bold text-forest">Avaliações verificadas<span className="flex items-center gap-1 text-sm tnum"><Star className="h-4 w-4 fill-gold text-gold" />{rating.toFixed(2).replace(/0$/, '').replace('.', ',')} <span className="font-normal text-muted-ink">({reviews.length})</span></span></h2>
      <div className="grid gap-2 @2xl:grid-cols-3">{reviews.map((r, i) => (
        <div key={`${r.author}-${i}`} className="rounded-[20px] border border-line bg-white p-3" data-testid={`card-review-${i}`}>
          <p className="flex items-center justify-between text-xs font-bold text-ink"><span className="flex items-center gap-1">{r.author}<BadgeCheck className="h-3.5 w-3.5 text-teal" /></span><span className="flex items-center gap-0.5 tnum">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={cn('h-3 w-3', k < Math.round(r.rating) ? 'fill-gold text-gold' : 'text-line')} />)}</span></p>
          <p className="mt-1 text-xs text-ink">{r.text}</p><p className="mt-1 text-[10px] text-muted-ink">{r.when}</p>
        </div>))}</div>
    </section>
  );
}
