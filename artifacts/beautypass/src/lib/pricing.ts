import type { Salon } from './data';

export type Rule = { id: string; salonId: string; kind: 'economico' | 'ultima'; pct: number; hour?: number };
export type DiscKind = 'economico' | 'ultima' | null;
export type SlotState = 'Disponível' | 'Alta Procura' | 'Desconto' | 'Ocupado';

export const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
export const PERIODS = { Manhã: [9, 10, 11], Tarde: [12, 13, 14, 15, 16, 17], Noite: [18, 19, 20] } as const;
export type Period = keyof typeof PERIODS;

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
/** Rule of 100 changes the framing, never the frozen service price or discount policy. */
export function discountFraming(base: number, final: number, disc: number) {
  if (disc <= 0 || !Number.isFinite(base) || !Number.isFinite(final) || !Number.isFinite(disc)) return null;
  const savings = +Math.max(0, base - final).toFixed(2);
  if (!savings) return null;
  const percent = disc;
  const percentage = `-${percent}%`;
  const amount = `Economize ${brl(savings)}`;
  return { primary: base < 100 ? percentage : amount, secondary: base < 100 ? amount : percentage, savings, percent };
}
export const pad = (n: number) => String(n).padStart(2, '0');
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const slotStart = (k: string, hour: number) => { const d = parseKey(k); d.setHours(hour, 0, 0, 0); return d; };
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const fmtDate = (k: string) => parseKey(k).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export const priceFor = (base: number, disc: number) => {
  const pct = disc > 0 ? Math.min(35, Math.max(15, disc)) : 0;
  return Math.max(25, pct ? Math.round(base * (1 - pct / 100)) : base);
};

export function slotDiscount(salon: Salon, key: string, hour: number, rules: Rule[], now = new Date()) {
  const start = slotStart(key, hour);
  const diffH = (start.getTime() - now.getTime()) / 36e5;
  const past = diffH <= 0;
  const sat = start.getDay() === 6;
  if ((sat && hour < 12) || hour === 18 || hour === 19) return { disc: 0, kind: null as DiscKind, past };
  const mine = rules.filter((r) => r.salonId === salon.id);
  let disc = 0; let kind: DiscKind = null;
  const off: Record<number, number> = { 10: salon.discount, 13: salon.discount - 10, 14: salon.discount - 5, 15: salon.discount };
  if (off[hour]) { disc = off[hour]; kind = 'economico'; }
  for (const r of mine) if (r.kind === 'economico' && r.hour === hour) { disc = r.pct; kind = 'economico'; }
  if (!past && diffH <= 3 && dateKey(now) === key) {
    let lm = 20;
    for (const r of mine) if (r.kind === 'ultima') lm = r.pct;
    if (lm >= disc) { disc = lm; kind = 'ultima'; }
  }
  disc = disc > 0 ? Math.min(35, Math.max(15, disc)) : 0;
  return { disc, kind: disc ? kind : null, past };
}

export function slotState(salon: Salon, key: string, hour: number, disc: number, booked: boolean): SlotState {
  const h = hash(`${salon.id}|${key}|${hour}`) % 100;
  if (booked || h < 20) return 'Ocupado';
  if (disc > 0) return 'Desconto';
  return h < 55 ? 'Alta Procura' : 'Disponível';
}

export const kindLabel = (k: DiscKind) =>
  k === 'ultima' ? { title: 'Última Hora', sub: 'desconto para hoje' } : k === 'economico' ? { title: 'Horário Econômico', sub: 'preço menor em horário de menor procura' } : null;

export const EXPLAIN = 'Salões aplicam preços menores em horários de menor movimento para ocupar a agenda. O desconto é definido pelo salão e não muda após a confirmação do seu agendamento.';
