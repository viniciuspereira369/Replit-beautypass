import { getSalon } from './data';
import { dateKey, pad, priceFor, slotDiscount, slotState } from './pricing';
import type { State } from './store';

export type PartnerAnalytics = {
  occupancy: { hour: string; baseline: number; beautyPass: number }[];
  revenue: { name: string; vazia: number; recuperada: number }[];
  projectedNet: number;
  completedNet: number;
};

/**
 * Illustrative local projection, not a measured conversion forecast:
 * an economic rule recovers (discount / 35) * 50% of its idle chair-hours.
 * Completed vouchers remain realized ledger revenue, never projected twice.
 */
export function buildPartnerAnalytics(state: State, salonId: string, now = new Date()): PartnerAnalytics {
  const salon = getSalon(salonId);
  if (!salon) return { occupancy: [], revenue: [], projectedNet: 0, completedNet: 0 };
  const today = dateKey(now);
  const hours = Array.from({ length: 11 }, (_, i) => i + 9);
  let expectedNet = 0;
  const occupancy = hours.map((hour) => {
    const pricing = slotDiscount(salon, today, hour, state.rules, now);
    let original = 0;
    let occupied = 0;
    salon.staff.forEach((staff, index) => {
      const seeded = slotState(salon, `${today}${staff.id}`, hour, 0, false) === 'Ocupado'
        || (index === 0 && slotState(salon, today, hour, 0, false) === 'Ocupado');
      const booking = state.bookings.some((b) =>
        b.salonId === salonId && b.date === today && b.hour === hour
        && (b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        && (b.staffId ? b.staffId === staff.id : index === 0));
      if (seeded) original++;
      if (seeded || booking) occupied++;
    });
    const chairs = salon.staff.length;
    const lift = !pricing.past && pricing.disc > 0
      ? (chairs - occupied) * (pricing.disc / 35) * 0.5 : 0;
    expectedNet += lift * priceFor(salon.services[0].base, pricing.disc) * 0.88;
    return {
      hour: `${pad(hour)}h`,
      baseline: Math.round(original / chairs * 100),
      beautyPass: Math.min(100, +((occupied + lift) / chairs * 100).toFixed(1)),
    };
  });
  const completedNet = +state.ledger.filter((entry) => entry.salonId === salonId
    && dateKey(new Date(entry.at)) === today).reduce((sum, entry) => sum + entry.net, 0).toFixed(2);
  const projectedNet = +(completedNet + expectedNet).toFixed(2);
  return {
    occupancy,
    revenue: [{ name: 'Cadeiras ociosas', vazia: 0, recuperada: projectedNet }],
    projectedNet,
    completedNet,
  };
}
