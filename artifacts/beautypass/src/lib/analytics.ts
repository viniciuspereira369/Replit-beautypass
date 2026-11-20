import { getSalon } from './data';
import { dateKey, pad, priceFor, slotDiscount, slotState } from './pricing';
import type { State } from './store';

export type PartnerAnalytics = {
  occupancy: { hour: string; baseline: number; beautyPass: number }[];
  revenue: RevenueBar[];
  projectedNet: number;
  completedNet: number;
  activeProjectedNet: number;
  occupancyLiftPp: number;
  baselineOccupancy: number;
};

export const REVENUE_BASELINE = 0;
export type RevenueBar = { id: 'projected' | 'confirmed' | 'empty'; name: string; value: number };
export function revenueBars(activeProjectedNet: number, completedNet: number): RevenueBar[] {
  const bars: RevenueBar[] = [
    { id: 'projected', name: 'Projeção de horários ativos', value: +Math.max(0, activeProjectedNet).toFixed(2) },
    { id: 'confirmed', name: 'Repasse confirmado D+1', value: +Math.max(0, completedNet).toFixed(2) },
    { id: 'empty', name: 'Cadeira vazia', value: REVENUE_BASELINE },
  ];
  return bars.sort((a, b) => b.value - a.value);
}

/**
 * Illustrative local projection, not a measured conversion forecast:
 * an economic rule recovers (discount / 35) * 50% of its idle chair-hours.
 * Completed vouchers remain realized ledger revenue, never projected twice.
 */
export function buildPartnerAnalytics(state: State, salonId: string, now = new Date()): PartnerAnalytics {
  const salon = getSalon(salonId);
  if (!salon) return { occupancy: [], revenue: revenueBars(0, 0), projectedNet: 0, completedNet: 0, activeProjectedNet: 0, occupancyLiftPp: 0, baselineOccupancy: 0 };
  const today = dateKey(now);
  const hours = Array.from({ length: 11 }, (_, i) => i + 9);
  let expectedNet = 0;
  const idleLifts: number[] = [];
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
    if (!pricing.past && pricing.disc > 0 && chairs > occupied) idleLifts.push(lift / chairs * 100);
    expectedNet += lift * priceFor(salon.services[0].base, pricing.disc) * 0.88;
    return {
      hour: `${pad(hour)}h`,
      baseline: +(original / chairs * 100).toFixed(1),
      beautyPass: Math.min(100, +((occupied + lift) / chairs * 100).toFixed(1)),
    };
  });
  const completedNet = +state.ledger.filter((entry) => entry.salonId === salonId
    && dateKey(new Date(entry.at)) === today).reduce((sum, entry) => sum + entry.net, 0).toFixed(2);
  const activeProjectedNet = +expectedNet.toFixed(2);
  const projectedNet = +(completedNet + activeProjectedNet).toFixed(2);
  const occupancyLiftPp = idleLifts.length ? +(idleLifts.reduce((sum, lift) => sum + lift, 0) / idleLifts.length).toFixed(1) : 0;
  const baselineOccupancy = +(occupancy.reduce((sum, hour) => sum + hour.baseline, 0) / occupancy.length).toFixed(1);
  return {
    occupancy,
    revenue: revenueBars(activeProjectedNet, completedNet),
    projectedNet, completedNet, activeProjectedNet, occupancyLiftPp, baselineOccupancy,
  };
}
