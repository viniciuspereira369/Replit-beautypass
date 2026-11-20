import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { SALONS } from './data';
import { addDays, dateKey, domicileFee, kindLabel, priceFor, slotDiscount } from './pricing';
import { salonRating, salonReviews } from './experience';
import { buildPartnerAnalytics } from './analytics';

const entries = new Map<string, string>();
const storage = {
  getItem: (key: string) => entries.get(key) ?? null,
  setItem: (key: string, value: string) => { entries.set(key, value); },
  removeItem: (key: string) => { entries.delete(key); },
  clear: () => entries.clear(),
  get length() { return entries.size; },
  key: (index: number) => [...entries.keys()][index] ?? null,
};
// resetDemo enumerates own localStorage keys, as browsers do.
const local = new Proxy(storage, {
  ownKeys: () => [...entries.keys()],
  getOwnPropertyDescriptor: (_target, key) => entries.has(String(key))
    ? { enumerable: true, configurable: true, value: entries.get(String(key)) } : undefined,
});
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'window', { value: new EventTarget(), configurable: true });
const store = await import('./store');

beforeEach(() => store.resetDemo());

test('the eight salons, six neighborhoods and original seed bookings remain intact', () => {
  assert.equal(SALONS.length, 8);
  assert.equal(new Set(SALONS.map((s) => s.hood)).size, 6);
  assert.equal(store.getState().user.credits, 185);
  assert.deepEqual(store.getState().bookings.map((b) => [b.code, b.final, b.status]), [
    ['BP-108420', 84, 'CONFIRMED'], ['BP-952130', 52.5, 'COMPLETED'], ['BP-884192', 68, 'CANCELLED_BY_MERCHANT'],
  ]);
});

test('peak hours remain full price and promotion-free, including Saturday mornings', () => {
  const salon = SALONS[0];
  const rules = [{ id: 'test', salonId: salon.id, kind: 'economico' as const, hour: 18, pct: 35 }];
  for (const [day, hour] of [['2026-11-20', 18], ['2026-11-20', 19], ['2026-11-21', 9], ['2026-11-21', 10], ['2026-11-21', 11]] as const) {
    const result = slotDiscount(salon, day, hour, rules, new Date(2026, 10, 20, 8));
    assert.equal(result.disc, 0);
    assert.equal(result.kind, null);
    assert.equal(kindLabel(result.kind), null);
  }
});

test('economic and last-minute discounts keep exact text, clamp, minimum price and travel fee', () => {
  const salon = SALONS[0];
  const now = new Date(2026, 10, 20, 11, 30);
  const imminent = slotDiscount(salon, '2026-11-20', 12, [], now);
  assert.equal(imminent.kind, 'ultima');
  assert.deepEqual(kindLabel(imminent.kind), { title: 'Última Hora', sub: 'desconto para hoje' });
  assert.deepEqual(kindLabel('economico'), { title: 'Horário Econômico', sub: 'preço menor em horário de menor procura' });
  assert.equal(slotDiscount(salon, '2026-11-20', 16, [], now).kind, null);
  store.addRule({ salonId: salon.id, kind: 'economico', hour: 16, pct: 90 });
  assert.equal(store.getState().rules.at(-1)?.pct, 35);
  assert.equal(priceFor(30, 35), 25);
  assert.equal(domicileFee(2), 10);
  assert.equal(domicileFee(2.3), 15);
  assert.equal(domicileFee(3.2), 20);
});

test('frozen checkout deducts credits once and preserves notes and multi-service snapshot', () => {
  const salon = SALONS[0];
  const base = salon.services[0].base + salon.services[1].base;
  store.addCredits(50);
  store.startHold({
    salonId: salon.id, serviceIds: salon.services.slice(0, 2).map((s) => s.id), staffId: null,
    date: dateKey(addDays(new Date(), 2)), hour: 13, mode: 'salao', notes: 'Escova modelada, por favor.',
    base, final: 210, fee: 0, disc: 30, kind: 'economico',
  });
  store.addRule({ salonId: salon.id, kind: 'economico', hour: 13, pct: 35 });
  const result = store.confirmHold('credits');
  assert.equal(result.ok, true);
  assert.equal(store.getState().user.credits, 25);
  assert.equal(store.getState().bookings[0].final, 210);
  assert.equal(store.getState().bookings[0].notes, 'Escova modelada, por favor.');
  assert.equal(store.confirmHold('credits').ok, false);
  assert.equal(store.getState().user.credits, 25);
  assert.equal(store.isTaken(store.getState(), salon.id, dateKey(addDays(new Date(), 2)), 14), true);
});

test('hold expiry blocks confirmation and cancellation policy is precise at 24 hours', () => {
  const booking = store.getState().bookings[0];
  store.startHold({ ...booking, date: dateKey(addDays(new Date(), 2)) });
  store.setState((s) => ({ ...s, hold: { ...s.hold!, expiresAt: Date.now() - 1 } }));
  assert.equal(store.confirmHold('pix').ok, false);
  const start = new Date(booking.date + 'T14:00:00').getTime();
  assert.equal(store.cancelPolicy(booking, start - 24 * 3600000).fee, 0);
  assert.equal(store.cancelPolicy(booking, start - 23 * 3600000).fee, 25.2);
});

test('check-in creates a single payout and unlocks a single verified, persisted review', () => {
  const salon = SALONS[0];
  assert.equal(store.submitReview('BP-108420', 5, 'Excelente atendimento.').ok, false);
  assert.equal(store.checkIn('BP-108420', SALONS[1].id).ok, false);
  assert.equal(store.checkIn('BP-108420', salon.id).ok, true);
  assert.equal(store.checkIn('BP-108420', salon.id).ok, false);
  assert.equal(store.getState().ledger.filter((l) => l.code === 'BP-108420').length, 1);
  assert.equal(store.getState().ledger.find((l) => l.code === 'BP-108420')?.net, 73.92);
  assert.equal(store.submitReview('BP-108420', 0, 'teste').ok, false);
  assert.equal(store.submitReview('BP-108420', 5, '').ok, false);
  assert.equal(store.submitReview('BP-108420', 5, 'Equipe maravilhosa e pontual.').ok, true);
  assert.equal(store.getState().bookings.find((b) => b.code === 'BP-108420')?.reviewed, true);
  assert.equal(salonReviews(salon, store.getState().reviews).length, 4);
  assert.ok(salonRating(salon, store.getState().reviews) > salon.rating);
  assert.equal(store.submitReview('BP-108420', 1, 'Duplicada').ok, false);
  assert.equal(JSON.parse(local.getItem('bp:state:v1')!).reviews.length, 1);
  assert.equal(store.submitReview('BP-884192', 5, 'Cancelada').ok, false);
});

test('B2B charts react to rules and payouts with bounded occupancy percentages', () => {
  const salon = SALONS[0];
  const now = new Date(); now.setHours(8, 0, 0, 0);
  const before = buildPartnerAnalytics(store.getState(), salon.id, now);
  for (const hour of [12, 16, 17]) store.addRule({ salonId: salon.id, kind: 'economico', hour, pct: 35 });
  const after = buildPartnerAnalytics(store.getState(), salon.id, now);
  assert.equal(after.occupancy.length, 11);
  assert.ok(after.occupancy.every((h) => h.beautyPass >= 0 && h.beautyPass <= 100));
  assert.ok(after.projectedNet > before.projectedNet);
  store.checkIn('BP-108420', salon.id);
  assert.equal(buildPartnerAnalytics(store.getState(), salon.id, now).completedNet, 73.92);
});

test('older local demos migrate without losing bookings; storage sync carries reviews', () => {
  const legacy = { ...store.getState() };
  delete (legacy as Partial<typeof legacy>).reviews;
  delete (legacy as Partial<typeof legacy>).fulfillment;
  local.setItem('bp:state:v1', JSON.stringify(legacy));
  window.dispatchEvent(Object.assign(new Event('storage'), { key: 'bp:state:v1' }));
  assert.equal(store.getState().bookings.length, 3);
  assert.deepEqual(store.getState().reviews, []);
  assert.equal(store.getState().fulfillment, 'salao');
  store.submitReview('BP-952130', 4, 'Muito bom, atendimento cuidadoso.');
  const saved = local.getItem('bp:state:v1')!;
  store.resetDemo();
  local.setItem('bp:state:v1', saved);
  window.dispatchEvent(Object.assign(new Event('storage'), { key: 'bp:state:v1' }));
  assert.equal(store.getState().reviews.length, 1);
});

test('reset restores the demo, triggers splash and never deletes unrelated storage', () => {
  local.setItem('other-product', 'keep');
  let fired = 0;
  window.addEventListener('bp:reset', () => fired++, { once: true });
  store.addCredits(50);
  store.resetDemo();
  assert.equal(store.getState().user.credits, 185);
  assert.equal(store.getState().reviews.length, 0);
  assert.equal(local.getItem('other-product'), 'keep');
  assert.equal(fired, 1);
});
