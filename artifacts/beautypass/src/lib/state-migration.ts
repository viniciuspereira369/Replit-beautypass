import { getSalon } from './data';
import type { Booking, Hold, State, Payment } from './store';
import type { ExperienceReview } from './experience';
import type { Rule } from './pricing';

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
export const directPayment = (value: unknown): Payment => value === 'card' ? 'card' : 'pix';

/** Whitelist appointment fields so obsolete service modes, addresses and surcharges are discarded. */
export function migrateAppointment(value: unknown): Omit<Hold, 'expiresAt'> | null {
  const item = record(value);
  const salon = typeof item.salonId === 'string' ? getSalon(item.salonId) : undefined;
  if (!salon || typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)
    || !finite(item.hour) || !Number.isInteger(item.hour) || item.hour < 9 || item.hour > 20
    || !finite(item.base) || !finite(item.final)) return null;
  const serviceIds = Array.isArray(item.serviceIds)
    ? item.serviceIds.filter((id): id is string => typeof id === 'string' && salon.services.some((s) => s.id === id)) : [];
  if (!serviceIds.length) return null;
  const disc = finite(item.disc) && item.disc > 0 ? Math.min(35, Math.max(15, item.disc)) : 0;
  return {
    salonId: salon.id, serviceIds: [...new Set(serviceIds)],
    staffId: typeof item.staffId === 'string' && salon.staff.some((s) => s.id === item.staffId) ? item.staffId : null,
    date: item.date, hour: item.hour, base: item.base, final: Math.max(25, item.final),
    disc, kind: disc && (item.kind === 'economico' || item.kind === 'ultima') ? item.kind : null,
    ...(typeof item.notes === 'string' ? { notes: item.notes } : {}),
  };
}

export const savedOnBookings = (bookings: Booking[]) => +bookings.reduce((sum, booking) =>
  sum + (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED' ? Math.max(0, booking.base - booking.final) : 0), 0).toFixed(2);

/** In-place schema upgrade: preserve vouchers, notes, favorites, reviews and rules, not removed products. */
export function migrateState(value: unknown): State {
  const saved = record(value);
  const user = record(saved.user);
  if (!saved.user || !Array.isArray(saved.bookings) || !Array.isArray(saved.rules)) throw new Error('Dados locais inválidos.');
  const bookings: Booking[] = saved.bookings.flatMap((value) => {
    const item = record(value);
    const appointment = migrateAppointment(item);
    if (!appointment || typeof item.code !== 'string' || !['CONFIRMED', 'COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_BY_MERCHANT'].includes(String(item.status))) return [];
    const cancelled = item.status === 'CANCELLED_BY_USER' || item.status === 'CANCELLED_BY_MERCHANT';
    const cancelFee = item.status === 'CANCELLED_BY_USER' && finite(item.cancelFee) && item.cancelFee > 0
      ? +(appointment.final * 0.3).toFixed(2) : 0;
    return [{
      ...appointment, code: item.code, status: item.status as Booking['status'], payment: directPayment(item.payment),
      createdAt: finite(item.createdAt) ? item.createdAt : 0,
      ...(typeof item.cancelReason === 'string' ? { cancelReason: item.cancelReason } : {}),
      ...(cancelled ? { cancelFee, refund: +(appointment.final - cancelFee).toFixed(2) } : {}),
      ...(item.reviewed === true ? { reviewed: true } : {}),
    }];
  });
  const oldHold = record(saved.hold);
  const appointment = migrateAppointment(oldHold);
  const hold = appointment && finite(oldHold.expiresAt) ? { ...appointment, expiresAt: oldHold.expiresAt } : null;
  const rules: Rule[] = saved.rules.flatMap((value, index) => {
    const rule = record(value);
    if (typeof rule.salonId !== 'string' || !getSalon(rule.salonId)
      || (rule.kind !== 'economico' && rule.kind !== 'ultima') || !finite(rule.pct)) return [];
    return [{
      id: typeof rule.id === 'string' ? rule.id : `migrated-rule-${index}`,
      salonId: rule.salonId, kind: rule.kind, pct: Math.min(35, Math.max(15, rule.pct)),
      ...(finite(rule.hour) ? { hour: rule.hour } : {}),
    }];
  });
  const ledger = (Array.isArray(saved.ledger) ? saved.ledger : []).flatMap((value) => {
    const entry = record(value);
    const booking = bookings.find((b) => b.code === entry.code && b.status === 'COMPLETED');
    if (!booking || !finite(entry.at)) return [];
    const gross = booking.final;
    const platform = +(gross * 0.12).toFixed(2);
    return [{ code: booking.code, salonId: booking.salonId, gross, platform, net: +(gross - platform).toFixed(2), at: entry.at }];
  });
  const reviews = (Array.isArray(saved.reviews) ? saved.reviews : []).filter((value): value is ExperienceReview => {
    const review = record(value);
    return typeof review.code === 'string' && bookings.some((b) => b.code === review.code && b.status === 'COMPLETED')
      && typeof review.text === 'string' && finite(review.rating) && Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5;
  });
  return {
    user: {
      name: typeof user.name === 'string' ? user.name : 'Camila Alves',
      saved: savedOnBookings(bookings), dealsDismissed: user.dealsDismissed === true,
      preferredPayment: directPayment(user.preferredPayment),
    },
    favorites: Array.isArray(saved.favorites) ? [...new Set(saved.favorites.filter((id): id is string => typeof id === 'string' && !!getSalon(id)))] : [],
    bookings, hold, rules, ledger, reviews,
  };
}
