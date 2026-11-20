import { SALONS, type Salon } from '@/lib/data';
import { addDays, dateKey, HOURS, slotDiscount, slotState } from '@/lib/pricing';
import { getState, isTaken } from '@/lib/store';
import { salonRating } from '@/lib/experience';

export const WINDOWS = ['Próximas 3h', 'Tarde', 'Noite'] as const;
export type Win = (typeof WINDOWS)[number];
export type Match = { salon: Salon; date: string; hour: number; base: number; final: number; disc: number; kind: ReturnType<typeof slotDiscount>['kind']; label: string };
export const LABELS = ['MAIS PRÓXIMO', 'MAIS ECONÔMICO', 'MELHOR AVALIADO'] as const;

/** Fair floor: never below R$30 nor 45% of base. */
export const fairFloor = (base: number, disc: number) => Math.max(Math.round(base * (1 - disc / 100)), 30, Math.ceil(base * 0.45));

export function findMatches(cat: string, win: Win): Match[] {
  const st = getState(); const now = new Date(); const reviews = st.reviews ?? [];
  const opts: Omit<Match, 'label'>[] = [];
  for (const s of SALONS.filter((x) => cat === 'Todos' || x.category === cat || (cat === 'Cabelo' && x.category === 'Misto'))) {
    let best: Omit<Match, 'label'> | null = null;
    for (const off of [0, 1]) {
      const key = dateKey(addDays(now, off));
      const hrs = win === 'Tarde' ? [12, 13, 14, 15, 16, 17] : win === 'Noite' ? [18, 19, 20] : HOURS.filter((h) => { const d = (new Date(now).setHours(h, 0, 0, 0) - now.getTime()) / 36e5; return off === 0 && d > 0 && d <= 3; });
      for (const h of hrs) {
        const r = slotDiscount(s, key, h, st.rules, now);
        if (r.past || slotState(s, key, h, r.disc, isTaken(st, s.id, key, h, s.services[0].duration)) === 'Ocupado') continue;
        const base = s.services[0].base; const final = fairFloor(base, r.disc);
        if (!best || final < best.final) best = { salon: s, date: key, hour: h, base, final, disc: r.disc, kind: r.kind };
      }
      if (best || win === 'Próximas 3h') break;
    }
    if (best) opts.push(best);
  }
  const out: Match[] = []; const used = new Set<string>();
  const pick = (sorted: typeof opts, label: string) => { const m = sorted.find((o) => !used.has(o.salon.id)) ?? sorted[0]; if (m) { used.add(m.salon.id); out.push({ ...m, label }); } };
  pick([...opts].sort((a, b) => a.salon.distanceKm - b.salon.distanceKm), LABELS[0]);
  pick([...opts].sort((a, b) => a.final - b.final), LABELS[1]);
  pick([...opts].sort((a, b) => salonRating(b.salon, reviews) - salonRating(a.salon, reviews)), LABELS[2]);
  return opts.length ? out : [];
}
