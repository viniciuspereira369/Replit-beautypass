import { useSyncExternalStore } from 'react';
import { PLANS, type PlanName, getSalon } from './data';
import { addDays, dateKey, hash, type DiscKind, type Rule, slotStart } from './pricing';

export type Status = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED_BY_USER' | 'CANCELLED_BY_MERCHANT';
export type Payment = 'card' | 'pix' | 'credits';
export type Booking = {
  code: string; salonId: string; serviceIds: string[]; staffId: string | null; date: string; hour: number;
  mode: 'salao' | 'domicilio'; address?: string; notes?: string; base: number; final: number; fee: number;
  disc: number; kind: DiscKind; payment: Payment; status: Status; createdAt: number;
  cancelReason?: string; cancelFee?: number; refund?: number;
};
export type Hold = Omit<Booking, 'code' | 'status' | 'createdAt' | 'payment'> & { expiresAt: number };
export type Ledger = { code: string; salonId: string; gross: number; platform: number; net: number; at: number };
export type State = {
  user: { name: string; plan: PlanName; credits: number; saved: number; clubDismissed: boolean };
  favorites: string[]; bookings: Booking[]; rules: Rule[]; hold: Hold | null; ledger: Ledger[];
};

const KEY = 'bp:state:v1';

function seed(): State {
  const today = dateKey(new Date());
  const past = dateKey(addDays(new Date(), -6));
  const past2 = dateKey(addDays(new Date(), -2));
  const b = (o: Partial<Booking> & Pick<Booking, 'code' | 'salonId' | 'date' | 'hour' | 'base' | 'final' | 'disc' | 'status'>): Booking => ({
    serviceIds: [`${o.salonId}-s0`], staffId: null, mode: 'salao', fee: 0, kind: 'economico', payment: 'credits', createdAt: Date.now() - 864e5, ...o,
  });
  return {
    user: { name: 'Camila Alves', plan: 'Essencial', credits: 185, saved: 32.5, clubDismissed: false },
    favorites: ['serena-spa'],
    bookings: [
      b({ code: 'BP-108420', salonId: 'atelie-belle-epoque', date: today, hour: 14, base: 120, final: 84, disc: 30, status: 'CONFIRMED', staffId: 'atelie-belle-epoque-p0', notes: 'Cabelo com química, prefiro escova modelada.' }),
      b({ code: 'BP-952130', salonId: 'barbearia-maestro', date: past, hour: 13, base: 70, final: 52.5, disc: 25, status: 'COMPLETED' }),
      b({ code: 'BP-884192', salonId: 'lumina-studio', date: past2, hour: 15, base: 85, final: 68, disc: 20, status: 'CANCELLED_BY_MERCHANT', refund: 68 }),
    ],
    rules: [{ id: 'r-seed', salonId: 'atelie-belle-epoque', kind: 'ultima', pct: 25 }],
    hold: null,
    ledger: [{ code: 'BP-952130', salonId: 'barbearia-maestro', gross: 52.5, platform: 6.3, net: 46.2, at: Date.now() - 5 * 864e5 }],
  };
}

function load(): State {
  try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch { /* ignore */ }
  const s = seed(); localStorage.setItem(KEY, JSON.stringify(s)); return s;
}

let state: State = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === null) { state = e.newValue ? JSON.parse(e.newValue) : load(); emit(); }
  });
}

export function setState(fn: (s: State) => State) { state = fn(state); localStorage.setItem(KEY, JSON.stringify(state)); emit(); }
export const getState = () => state;
export const useStore = () => useSyncExternalStore(subscribe, () => state);

export function resetDemo() {
  Object.keys(localStorage).filter((k) => k.startsWith('bp:')).forEach((k) => localStorage.removeItem(k));
  state = load(); emit();
}

export const toggleFavorite = (id: string) =>
  setState((s) => ({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id] }));

const durationFor = (salonId: string, services: string[]) => {
  const selected = getSalon(salonId)?.services.filter((service) => services.includes(service.id)) ?? [];
  return selected.reduce((total, service) => total + service.duration, 0) + Math.max(0, selected.length - 1) * 10;
};

export const isTaken = (s: State, salonId: string, date: string, hour: number, duration = 1) =>
  s.bookings.some((b) => b.salonId === salonId && b.date === date &&
    (b.status === 'CONFIRMED' || b.status === 'COMPLETED') &&
    hour * 60 < b.hour * 60 + durationFor(b.salonId, b.serviceIds) &&
    hour * 60 + duration > b.hour * 60);

export function startHold(h: Omit<Hold, 'expiresAt'>) { setState((s) => ({ ...s, hold: { ...h, expiresAt: Date.now() + 10 * 60e3 } })); }
export const clearHold = () => setState((s) => ({ ...s, hold: null }));

export function confirmHold(payment: Payment): { ok: true; code: string } | { ok: false; error: string } {
  const s = state; const h = s.hold;
  if (!h) return { ok: false, error: 'Nenhuma reserva em andamento.' };
  if (Date.now() > h.expiresAt) return { ok: false, error: 'O tempo de reserva expirou. Escolha o horário novamente.' };
  if (isTaken(s, h.salonId, h.date, h.hour, durationFor(h.salonId, h.serviceIds))) return { ok: false, error: 'Este horário acabou de ser ocupado.' };
  if (h.mode === 'domicilio' && !h.address?.trim()) return { ok: false, error: 'Informe o endereço para atendimento a domicílio.' };
  const total = h.final + h.fee;
  const cost = Math.round(total);
  if (payment === 'credits' && s.user.credits < cost) return { ok: false, error: 'BeautyCredits insuficientes.' };
  let n = 100000 + (hash(`${h.salonId}|${h.date}|${h.hour}|${s.bookings.length}`) % 900000);
  while (s.bookings.some((b) => b.code === `BP-${n}`)) n = n >= 999999 ? 100000 : n + 1;
  const code = `BP-${n}`;
  const { expiresAt: _e, ...rest } = h;
  setState((st) => ({
    ...st, hold: null,
    user: { ...st.user, credits: payment === 'credits' ? st.user.credits - cost : st.user.credits, saved: +(st.user.saved + (h.base - h.final)).toFixed(2) },
    bookings: [{ ...rest, code, payment, status: 'CONFIRMED', createdAt: Date.now() }, ...st.bookings],
  }));
  return { ok: true, code };
}

export function cancelPolicy(b: Booking, now = Date.now()) {
  const hrs = (slotStart(b.date, b.hour).getTime() - now) / 36e5;
  const total = b.final + b.fee;
  const free = hrs >= 24;
  const fee = free ? 0 : +(total * 0.3).toFixed(2);
  return { free, hrs, fee, refund: +(total - fee).toFixed(2), total };
}

export function cancelBooking(code: string, reason: string) {
  setState((s) => {
    const b = s.bookings.find((x) => x.code === code);
    if (!b || b.status !== 'CONFIRMED') return s;
    const p = cancelPolicy(b);
    const credits = b.payment === 'credits' ? s.user.credits + Math.round(p.total) - Math.round(p.fee) : s.user.credits;
    return {
      ...s, user: { ...s.user, credits, saved: Math.max(0, +(s.user.saved - (b.base - b.final)).toFixed(2)) },
      bookings: s.bookings.map((x) => (x.code === code ? { ...x, status: 'CANCELLED_BY_USER', cancelReason: reason, cancelFee: p.fee, refund: p.refund } : x)),
    };
  });
}

export const addCredits = (n: number) => setState((s) => ({ ...s, user: { ...s.user, credits: s.user.credits + n } }));
export const switchPlan = (plan: PlanName) => setState((s) => ({ ...s, user: { ...s.user, plan, credits: s.user.credits + (plan !== s.user.plan ? PLANS[plan].credits : 0) } }));
export const dismissClub = () => setState((s) => ({ ...s, user: { ...s.user, clubDismissed: true } }));
export const addRule = (r: Omit<Rule, 'id'>) => setState((s) => ({ ...s, rules: [...s.rules, { ...r, pct: Math.min(35, Math.max(15, r.pct)), id: `r-${Date.now()}-${s.rules.length}` }] }));
export const removeRule = (id: string) => setState((s) => ({ ...s, rules: s.rules.filter((r) => r.id !== id) }));

export function checkIn(code: string, salonId: string): { ok: boolean; msg: string } {
  const c = code.trim().toUpperCase();
  const b = state.bookings.find((x) => x.code === c);
  if (!/^BP-\d{6}$/.test(c)) return { ok: false, msg: 'Formato inválido. Use BP-000000.' };
  if (!b) return { ok: false, msg: 'Código não encontrado.' };
  if (b.salonId !== salonId) return { ok: false, msg: `Este voucher pertence a ${getSalon(b.salonId)?.name}.` };
  if (b.status === 'COMPLETED') return { ok: false, msg: 'Check-in já realizado para este voucher.' };
  if (b.status !== 'CONFIRMED') return { ok: false, msg: 'Reserva cancelada — check-in bloqueado.' };
  const gross = b.final + b.fee; const platform = +(gross * 0.12).toFixed(2);
  const cashback = state.bookings.filter((booking) => booking.status === 'COMPLETED').length < 3
    ? Math.round(b.final * 0.15) : 0;
  setState((s) => ({
    ...s, bookings: s.bookings.map((x) => (x.code === c ? { ...x, status: 'COMPLETED' } : x)),
    user: { ...s.user, credits: s.user.credits + cashback },
    ledger: [{ code: c, salonId, gross, platform, net: +(gross - platform).toFixed(2), at: Date.now() }, ...s.ledger],
  }));
  return { ok: true, msg: `Check-in confirmado. ${c} concluída e enviada para Receita D+1.` };
}
