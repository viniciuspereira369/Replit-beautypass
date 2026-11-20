import { useSyncExternalStore } from 'react';
import { getSalon } from './data';
import { addDays, dateKey, hash, type DiscKind, type Rule, slotStart } from './pricing';
import type { ExperienceReview } from './experience';
import { migrateAppointment, migrateState, savedOnBookings } from './state-migration';
export type { ExperienceReview } from './experience';

export type Status = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED_BY_USER' | 'CANCELLED_BY_MERCHANT';
export type Payment = 'card' | 'pix';
export type Booking = {
  code: string; salonId: string; serviceIds: string[]; staffId: string | null; date: string; hour: number;
  notes?: string; base: number; final: number;
  disc: number; kind: DiscKind; payment: Payment; status: Status; createdAt: number;
  cancelReason?: string; cancelFee?: number; refund?: number;
  reviewed?: boolean;
};
export type Hold = Omit<Booking, 'code' | 'status' | 'createdAt' | 'payment'> & { expiresAt: number };
export type Ledger = { code: string; salonId: string; gross: number; platform: number; net: number; at: number };
export type State = {
  user: { name: string; saved: number; dealsDismissed: boolean; preferredPayment: Payment };
  favorites: string[]; bookings: Booking[]; rules: Rule[]; hold: Hold | null; ledger: Ledger[];
  reviews: ExperienceReview[];
};

const KEY = 'bp:state:v1';

function seed(): State {
  const today = dateKey(new Date());
  const past = dateKey(addDays(new Date(), -6));
  const past2 = dateKey(addDays(new Date(), -2));
  const b = (o: Partial<Booking> & Pick<Booking, 'code' | 'salonId' | 'date' | 'hour' | 'base' | 'final' | 'disc' | 'status'>): Booking => ({
    serviceIds: [`${o.salonId}-s0`], staffId: null, kind: 'economico', payment: 'pix', createdAt: Date.now() - 864e5, ...o,
  });
  return {
    user: { name: 'Camila Alves', saved: 53.5, dealsDismissed: false, preferredPayment: 'pix' },
    favorites: ['serena-spa'],
    bookings: [
      b({ code: 'BP-108420', salonId: 'atelie-belle-epoque', date: today, hour: 14, base: 120, final: 84, disc: 30, status: 'CONFIRMED', staffId: 'atelie-belle-epoque-p0', notes: 'Cabelo com química, prefiro escova modelada.' }),
      b({ code: 'BP-952130', salonId: 'barbearia-maestro', date: past, hour: 13, base: 70, final: 52.5, disc: 25, status: 'COMPLETED' }),
      b({ code: 'BP-884192', salonId: 'lumina-studio', date: past2, hour: 15, base: 85, final: 68, disc: 20, status: 'CANCELLED_BY_MERCHANT', refund: 68 }),
    ],
    rules: [{ id: 'r-seed', salonId: 'atelie-belle-epoque', kind: 'ultima', pct: 25 }],
    hold: null,
    ledger: [{ code: 'BP-952130', salonId: 'barbearia-maestro', gross: 52.5, platform: 6.3, net: 46.2, at: Date.now() - 5 * 864e5 }],
    reviews: [],
  };
}

function load(): State {
  try {
    const r = localStorage.getItem(KEY);
    if (r) {
      const migrated = migrateState(JSON.parse(r));
      const serialized = JSON.stringify(migrated);
      if (serialized !== r) localStorage.setItem(KEY, serialized);
      return migrated;
    }
  } catch { console.warn('BeautyPass: os dados locais estavam inválidos; a demonstração foi restaurada.'); }
  const s = seed(); localStorage.setItem(KEY, JSON.stringify(s)); return s;
}

let state: State = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === null) { state = load(); emit(); }
  });
}

export function setState(fn: (s: State) => State) {
  const next = fn(state);
  state = { ...next, user: { ...next.user, saved: savedOnBookings(next.bookings) } };
  localStorage.setItem(KEY, JSON.stringify(state)); emit();
}
export const getState = () => state;
export const useStore = () => useSyncExternalStore(subscribe, () => state);

export function resetDemo() {
  Object.keys(localStorage).filter((k) => k.startsWith('bp:')).forEach((k) => localStorage.removeItem(k));
  state = load(); emit();
  window.dispatchEvent(new Event('bp:reset'));
}

export const setPreferredPayment = (payment: Payment) => {
  if (payment === 'pix' || payment === 'card') setState((s) => ({ ...s, user: { ...s.user, preferredPayment: payment } }));
};
export const totalSaved = (s: Pick<State, 'bookings'>) => savedOnBookings(s.bookings);

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

export function startHold(h: Omit<Hold, 'expiresAt'>) {
  const appointment = migrateAppointment(h);
  if (!appointment) throw new Error('Selecione um serviço e horário válidos.');
  setState((s) => ({ ...s, hold: { ...appointment, expiresAt: Date.now() + 10 * 60e3 } }));
}
export const clearHold = () => setState((s) => ({ ...s, hold: null }));

export function confirmHold(payment: Payment): { ok: true; code: string } | { ok: false; error: string } {
  const s = state; const h = s.hold;
  if (!h) return { ok: false, error: 'Nenhuma reserva em andamento.' };
  if (payment !== 'pix' && payment !== 'card') return { ok: false, error: 'Escolha Pix ou Cartão de Crédito.' };
  if (Date.now() >= h.expiresAt) return { ok: false, error: 'O tempo de reserva expirou. Escolha o horário novamente.' };
  if (isTaken(s, h.salonId, h.date, h.hour, durationFor(h.salonId, h.serviceIds))) return { ok: false, error: 'Este horário acabou de ser ocupado.' };
  let n = 100000 + (hash(`${h.salonId}|${h.date}|${h.hour}|${s.bookings.length}`) % 900000);
  while (s.bookings.some((b) => b.code === `BP-${n}`)) n = n >= 999999 ? 100000 : n + 1;
  const code = `BP-${n}`;
  const { expiresAt: _e, ...rest } = h;
  setState((st) => ({
    ...st, hold: null,
    bookings: [{ ...rest, code, payment, status: 'CONFIRMED', createdAt: Date.now() }, ...st.bookings],
  }));
  return { ok: true, code };
}

export function cancelPolicy(b: Booking, now = Date.now()) {
  const hrs = (slotStart(b.date, b.hour).getTime() - now) / 36e5;
  const total = b.final;
  const free = hrs >= 24;
  const fee = free ? 0 : +(total * 0.3).toFixed(2);
  return { free, hrs, fee, refund: +(total - fee).toFixed(2), total };
}

export function cancelBooking(code: string, reason: string) {
  setState((s) => {
    const b = s.bookings.find((x) => x.code === code);
    if (!b || b.status !== 'CONFIRMED') return s;
    const p = cancelPolicy(b);
    return {
      ...s,
      bookings: s.bookings.map((x) => (x.code === code ? { ...x, status: 'CANCELLED_BY_USER', cancelReason: reason, cancelFee: p.fee, refund: p.refund } : x)),
    };
  });
}

export const dismissDeals = () => setState((s) => ({ ...s, user: { ...s.user, dealsDismissed: true } }));
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
  const gross = b.final; const platform = +(gross * 0.12).toFixed(2);
  setState((s) => ({
    ...s, bookings: s.bookings.map((x) => (x.code === c ? { ...x, status: 'COMPLETED' } : x)),
    ledger: [{ code: c, salonId, gross, platform, net: +(gross - platform).toFixed(2), at: Date.now() }, ...s.ledger],
  }));
  return { ok: true, msg: `Check-in confirmado. ${c} concluída e enviada para Receita D+1.` };
}

export function submitReview(code: string, rating: number, comment: string): { ok: boolean; error?: string } {
  const booking = state.bookings.find((item) => item.code === code);
  if (!booking || booking.status !== 'COMPLETED') {
    return { ok: false, error: 'A avaliação fica disponível após o check-in e a conclusão do atendimento.' };
  }
  if (booking.reviewed || state.reviews.some((review) => review.code === code)) {
    return { ok: false, error: 'Você já avaliou esta experiência.' };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: 'Escolha uma nota de 1 a 5 estrelas.' };
  }
  const text = comment.trim();
  if (!text || text.length > 1000) {
    return { ok: false, error: 'Conte como foi sua experiência em até 1.000 caracteres.' };
  }
  const review: ExperienceReview = {
    code, salonId: booking.salonId, author: state.user.name, rating, text,
    when: 'agora · reserva verificada', createdAt: Date.now(),
  };
  setState((s) => ({
    ...s,
    reviews: [review, ...s.reviews],
    bookings: s.bookings.map((item) => item.code === code ? { ...item, reviewed: true } : item),
  }));
  return { ok: true };
}
