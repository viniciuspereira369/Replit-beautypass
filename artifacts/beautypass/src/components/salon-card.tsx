import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Heart, Star, Footprints, BadgeCheck, ChevronRight } from 'lucide-react';
import type { Salon } from '@/lib/data';
import { addDays, brl, dateKey, HOURS, kindLabel, priceFor, slotDiscount, type DiscKind, type Rule } from '@/lib/pricing';
import { toggleFavorite, useStore } from '@/lib/store';
import { salonRating } from '@/lib/experience';
import { categoryPhoto, friendPhoto, specialistPhoto } from '@/lib/media';
import { Photo, Portrait } from './art';
import { cn } from '@/lib/utils';

export const fmtRating = (r: number) => r.toFixed(2).replace(/0$/, '').replace('.', ',');
export const fmtKm = (km: number) => km.toFixed(1).replace('.', ',');
export const walkMin = (km: number) => Math.round(km * 12);

export function useRating(salon: Salon) { const st = useStore(); return salonRating(salon, st.reviews ?? []); }

export function LiveProof({ salon, onDark = false }: { salon: Salon; onDark?: boolean }) {
  return (
    <span className={cn('inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold', onDark ? 'glass text-forest' : 'bg-tint text-teal-deep')} data-testid={`text-proof-${salon.id}`}>
      <span className="live-dot h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
      <span className="truncate">{salon.proof.name} agendou {salon.proof.service} há {salon.proof.minutes} min</span>
    </span>
  );
}

export function FavButton({ id, className, onDark = false }: { id: string; className?: string; onDark?: boolean }) {
  const { favorites } = useStore(); const on = favorites.includes(id);
  return (
    <motion.button whileTap={{ scale: 0.8 }} data-testid={`button-favorite-${id}`} aria-label={on ? 'Remover dos favoritos' : 'Favoritar'} aria-pressed={on}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(id); }}
      className={cn('flex h-9 w-9 items-center justify-center rounded-full transition', onDark ? 'bg-[#0C2D26]/45 text-white backdrop-blur-md' : 'bg-tint text-ink', className)}>
      <Heart className={cn('h-4 w-4 transition', on ? 'scale-110 fill-coral text-coral' : '')} />
    </motion.button>
  );
}

export function liveBest(salon: Salon, rules: Rule[]) {
  const now = new Date(); let best = 0; let kind: DiscKind = null;
  for (const off of [0, 1]) { const k = dateKey(addDays(now, off)); for (const h of HOURS) { const r = slotDiscount(salon, k, h, rules, now); if (!r.past && r.disc > best) { best = r.disc; kind = r.kind; } } }
  return { disc: best, kind };
}
export const liveDiscount = (salon: Salon, rules: Rule[]) => liveBest(salon, rules).disc;

export function FriendStack({ salon, size = 'h-6 w-6' }: { salon: Salon; size?: string }) {
  return <span className="flex -space-x-2">{salon.mutuals.slice(0, 3).map((m, i) => <Portrait key={m} name={m} src={friendPhoto(m, i)} className={size} />)}</span>;
}

export function SalonCard({ salon, i = 0 }: { salon: Salon; i?: number }) {
  const { rules } = useStore(); const rating = useRating(salon);
  const { disc, kind } = liveBest(salon, rules); const lbl = kindLabel(kind);
  const s = salon.services[0]; const final = priceFor(s.base, disc); const lead = salon.staff[0];
  return (
    <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 260, damping: 26 }}
      whileTap={{ scale: 0.985 }} className="group relative overflow-hidden rounded-[26px] border border-line bg-white shadow-[0_14px_36px_-26px_rgba(18,62,53,.5)]" data-testid={`card-salon-${salon.id}`}>
      <Link href={`/salao/${salon.id}`} aria-label={`Ver ${salon.name}`} className="absolute inset-0 z-[1]" data-testid={`link-salon-${salon.id}`} />
      <div className="relative aspect-video">
        <Photo src={categoryPhoto(salon.category)} alt={`Interior de ${salon.name}`} className="h-full w-full" imgClassName="transition duration-700 group-hover:scale-[1.04]" />
        <div className="scrim-b absolute inset-0" />
        <div className="absolute left-3 top-3 right-3"><LiveProof salon={salon} onDark /></div>
        {disc > 0 && <span className="absolute bottom-3 left-3 rounded-full bg-coral px-2.5 py-1 text-[11px] font-bold text-white tnum" data-testid={`badge-discount-${salon.id}`}>até -{disc}%</span>}
        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-forest tnum"><Footprints className="h-3 w-3" />{walkMin(salon.distanceKm)} min · {fmtKm(salon.distanceKm)} km</span>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="tight truncate text-[17px] font-bold text-forest">{salon.name}</h3>
            <p className="text-xs text-muted-ink">{salon.hood} · {salon.category}</p>
          </div>
          <div className="relative z-[2] flex shrink-0 items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-amber-bg px-2 py-1 text-xs font-bold text-[#92400E] tnum" data-testid={`text-rating-${salon.id}`}><Star className="h-3 w-3 fill-gold text-gold" />{fmtRating(rating)}</span>
            <FavButton id={salon.id} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-tint px-2.5 py-2">
          <span className="flex min-w-0 items-center gap-2">
            <Portrait src={specialistPhoto(lead.name)} name={lead.name} className="h-7 w-7" />
            <span className="min-w-0 text-[11px] leading-tight"><b className="flex items-center gap-1 text-forest"><span className="truncate">{lead.name}</span><BadgeCheck className="h-3.5 w-3.5 shrink-0 text-teal" /></b><span className="text-muted-ink">{lead.role} verificada</span></span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-ink"><FriendStack salon={salon} />{salon.mutuals.length} amiga{salon.mutuals.length > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-end justify-between border-t border-line pt-3">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-ink">A partir de · {s.name}</p>
            <p className="tnum">{disc > 0 && <s className="mr-1.5 text-xs text-strike">{brl(s.base)}</s>}<b className="text-lg text-forest">{brl(final)}</b></p>
            {lbl && disc > 0 && <p className="truncate text-[10.5px] font-semibold text-economy">{lbl.title} · {lbl.sub}</p>}
          </div>
          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-forest px-3.5 py-2 text-xs font-semibold text-white transition group-hover:bg-forest-hover">Ver horários<ChevronRight className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </motion.article>
  );
}
