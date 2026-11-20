import { Link } from 'wouter';
import { Heart, Star, Footprints, MapPin } from 'lucide-react';
import type { Salon } from '@/lib/data';
import { addDays, brl, dateKey, HOURS, priceFor, slotDiscount, type Rule } from '@/lib/pricing';
import { toggleFavorite, useStore } from '@/lib/store';
import { CategoryArt, Initials } from './art';
import { cn } from '@/lib/utils';

export function LiveProof({ salon }: { salon: Salon }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-teal-deep" data-testid={`text-proof-${salon.id}`}>
      <span className="live-dot h-1.5 w-1.5 rounded-full bg-teal" />
      {salon.proof.name} agendou {salon.proof.service} há {salon.proof.minutes} min
    </p>
  );
}

export function FavButton({ id, className }: { id: string; className?: string }) {
  const { favorites } = useStore(); const on = favorites.includes(id);
  return (
    <button data-testid={`button-favorite-${id}`} aria-label={on ? 'Remover dos favoritos' : 'Favoritar'} aria-pressed={on}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(id); }}
      className={cn('flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur transition active:scale-90', className)}>
      <Heart className={cn('h-4 w-4 transition', on ? 'fill-coral text-coral scale-110' : 'text-ink')} />
    </button>
  );
}

export function liveDiscount(salon: Salon, rules: Rule[]) {
  const now = new Date(); let best = 0;
  for (const off of [0, 1]) { const k = dateKey(addDays(now, off)); for (const h of HOURS) { const r = slotDiscount(salon, k, h, rules, now); if (!r.past && r.disc > best) best = r.disc; } }
  return best;
}

export function SalonCard({ salon, i = 0 }: { salon: Salon; i?: number }) {
  const { rules } = useStore(); const disc = liveDiscount(salon, rules);
  const s = salon.services[0]; const final = priceFor(s.base, disc);
  return (
    <Link href={`/salao/${salon.id}`} data-testid={`card-salon-${salon.id}`} style={{ animationDelay: `${i * 60}ms` }}
      className="rise group block overflow-hidden rounded-3xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(18,62,53,.35)]">
      <div className="relative">
        <CategoryArt category={salon.category} seed={salon.id} className="aspect-video w-full transition duration-500 group-hover:scale-[1.02]" />
        {disc > 0 && <span className="absolute left-3 top-3 rounded-full bg-coral px-2.5 py-1 text-[11px] font-bold text-white tnum" data-testid={`badge-discount-${salon.id}`}>até -{disc}%</span>}
        <FavButton id={salon.id} className="absolute right-3 top-3" />
      </div>
      <div className="space-y-2.5 p-4">
        <LiveProof salon={salon} />
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-semibold leading-tight text-forest">{salon.name}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-ink"><MapPin className="h-3 w-3" />{salon.hood} · {salon.category}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-tint-2 px-2 py-1 text-xs font-semibold text-ink tnum"><Star className="h-3 w-3 fill-gold text-gold" />{salon.rating.toFixed(2).replace(/0$/, '')}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-ink">
          <span className="flex items-center gap-1 tnum"><Footprints className="h-3.5 w-3.5" />{salon.distanceKm.toFixed(1).replace('.', ',')} km · {Math.round(salon.distanceKm * 12)} min a pé</span>
          <span className="flex items-center">
            <span className="flex -space-x-1.5">{salon.mutuals.slice(0, 3).map((m) => <Initials key={m} name={m} className="h-5 w-5" />)}</span>
            <span className="ml-1.5">{salon.mutuals.length} amiga{salon.mutuals.length > 1 ? 's' : ''}</span>
          </span>
        </div>
        <div className="flex items-end justify-between border-t border-line pt-3">
          <div>
            <p className="text-[11px] text-muted-ink">{s.name}</p>
            <p className="tnum">{disc > 0 && <span className="mr-1.5 text-xs text-muted-ink line-through">{brl(s.base)}</span>}<span className="text-lg font-bold text-forest">{brl(final)}</span></p>
          </div>
          <span className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-tint transition group-hover:bg-forest-hover">Reservar</span>
        </div>
      </div>
    </Link>
  );
}
