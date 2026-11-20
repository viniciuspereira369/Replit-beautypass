import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SALONS } from './data';
import { addDays, brl, dateKey, discountFraming, kindLabel, priceFor, slotDiscount } from './pricing';
import { REVIEW_MAX_LENGTH, salonRating, salonReviews } from './experience';
import { REVENUE_BASELINE, buildPartnerAnalytics } from './analytics';
import { QR } from '../components/art';
import { DiscountFrame } from '../components/discount-frame';
import { QR_DARK, QR_WHITE, QR_VIEWBOX } from './qr-layout';

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
  assert.equal(store.getState().user.preferredPayment, 'pix');
  assert.equal(store.totalSaved(store.getState()), 53.5);
  assert.ok(store.getState().bookings.every((b) => b.payment === 'pix'));
  assert.equal('fulfillment' in store.getState(), false);
  assert.equal('plan' in store.getState().user, false);
  assert.equal('credits' in store.getState().user, false);
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

test('economic and last-minute discounts keep exact text, 15–35% clamps and R$25 floor', () => {
  const salon = SALONS[0];
  const now = new Date(2026, 10, 20, 11, 30);
  const imminent = slotDiscount(salon, '2026-11-20', 12, [], now);
  assert.equal(imminent.kind, 'ultima');
  assert.deepEqual(kindLabel(imminent.kind), { title: 'Última Hora', sub: 'desconto para hoje' });
  assert.deepEqual(kindLabel('economico'), { title: 'Horário Econômico', sub: 'preço menor em horário de menor procura' });
  assert.equal(slotDiscount(salon, '2026-11-20', 16, [], now).kind, null);
  store.addRule({ salonId: salon.id, kind: 'economico', hour: 16, pct: 90 });
  assert.equal(store.getState().rules.at(-1)?.pct, 35);
  store.addRule({ salonId: salon.id, kind: 'economico', hour: 17, pct: 1 });
  assert.equal(store.getState().rules.at(-1)?.pct, 15);
  assert.equal(priceFor(30, 35), 25);
  assert.equal(priceFor(100, 95), 65);
  assert.equal(priceFor(100, 1), 85);
  assert.equal(priceFor(20, 0), 25);
});

test('frozen Pix checkout preserves exact BRL service total, savings, notes and multi-service buffer', () => {
  const salon = SALONS[0];
  const base = salon.services[0].base + salon.services[1].base;
  store.startHold({
    salonId: salon.id, serviceIds: salon.services.slice(0, 2).map((s) => s.id), staffId: null,
    date: dateKey(addDays(new Date(), 2)), hour: 13, notes: 'Escova modelada, por favor.',
    base, final: 210, disc: 30, kind: 'economico',
  });
  const expiresAt = store.getState().hold!.expiresAt;
  assert.ok(Math.abs(expiresAt - Date.now() - 600000) < 500);
  store.addRule({ salonId: salon.id, kind: 'economico', hour: 13, pct: 35 });
  const result = store.confirmHold('pix');
  assert.equal(result.ok, true);
  assert.equal(store.totalSaved(store.getState()), 143.5);
  assert.equal(store.getState().bookings[0].final, 210);
  assert.equal(store.getState().bookings[0].notes, 'Escova modelada, por favor.');
  assert.equal(store.getState().bookings[0].payment, 'pix');
  assert.equal('fee' in store.getState().bookings[0], false);
  assert.equal('mode' in store.getState().bookings[0], false);
  assert.equal(store.confirmHold('pix').ok, false);
  assert.equal(store.getState().bookings.length, 4);
  assert.equal(store.isTaken(store.getState(), salon.id, dateKey(addDays(new Date(), 2)), 14), true);
  assert.equal(store.isTaken(store.getState(), salon.id, dateKey(addDays(new Date(), 2)), 15), false);
});

test('card checkout is direct BRL; preferred method persists without changing existing snapshots', () => {
  store.setPreferredPayment('card');
  const booking = store.getState().bookings[0];
  store.startHold({ ...booking, date: dateKey(addDays(new Date(), 3)) });
  assert.equal(store.confirmHold('card').ok, true);
  assert.equal(store.getState().bookings[0].payment, 'card');
  assert.equal(store.getState().bookings[0].final, 84);
  window.dispatchEvent(Object.assign(new Event('storage'), { key: 'bp:state:v1' }));
  assert.equal(store.getState().user.preferredPayment, 'card');
  assert.equal(store.getState().bookings[0].final, 84);
});

test('hold expiry blocks confirmation and BRL cancellation is precise at the 24-hour boundary', () => {
  const booking = store.getState().bookings[0];
  store.startHold({ ...booking, date: dateKey(addDays(new Date(), 2)) });
  store.setState((s) => ({ ...s, hold: { ...s.hold!, expiresAt: Date.now() - 1 } }));
  assert.equal(store.confirmHold('pix').ok, false);
  const start = new Date(booking.date + 'T14:00:00').getTime();
  assert.equal(store.cancelPolicy(booking, start - 24 * 3600000).fee, 0);
  assert.equal(store.cancelPolicy(booking, start - 23 * 3600000).fee, 25.2);
  assert.equal(store.cancelPolicy(booking, start - 23 * 3600000).refund, 58.8);
  assert.equal(store.cancelPolicy(booking, start - 25 * 3600000).refund, 84);
  const policy = store.cancelPolicy(booking);
  store.cancelBooking(booking.code, 'Mudei de planos');
  const cancelled = store.getState().bookings.find((b) => b.code === booking.code)!;
  assert.equal(cancelled.cancelFee, policy.fee);
  assert.equal(cancelled.refund, policy.refund);
  assert.equal(store.totalSaved(store.getState()), 17.5);
  store.cancelBooking(booking.code, 'Duplicada');
  assert.equal(store.getState().bookings.find((b) => b.code === booking.code)?.refund, policy.refund);
});

test('check-in creates a single payout and unlocks a single verified, persisted review', () => {
  const salon = SALONS[0];
  const userBefore = { ...store.getState().user };
  assert.equal(store.submitReview('BP-108420', 5, 'Excelente atendimento.').ok, false);
  assert.equal(store.checkIn('BP-108420', SALONS[1].id).ok, false);
  assert.equal(store.checkIn('BP-108420', salon.id).ok, true);
  assert.equal(store.checkIn('BP-108420', salon.id).ok, false);
  assert.equal(store.getState().ledger.filter((l) => l.code === 'BP-108420').length, 1);
  assert.equal(store.getState().ledger.find((l) => l.code === 'BP-108420')?.net, 73.92);
  assert.deepEqual(store.getState().user, userBefore);
  assert.equal(store.submitReview('BP-108420', 0, 'teste').ok, false);
  const tooLong = store.submitReview('BP-108420', 5, 'a'.repeat(281));
  assert.equal(tooLong.ok, false);
  assert.ok(tooLong.error?.includes('280'));
  assert.equal(store.submitReview('BP-108420', 5, 'Equipe maravilhosa e pontual.').ok, true);
  assert.equal(store.getState().bookings.find((b) => b.code === 'BP-108420')?.reviewed, true);
  assert.equal(salonReviews(salon, store.getState().reviews).length, 4);
  assert.ok(salonRating(salon, store.getState().reviews) > salon.rating);
  assert.equal(store.submitReview('BP-108420', 1, 'Duplicada').ok, false);
  assert.equal(JSON.parse(local.getItem('bp:state:v1')!).reviews.length, 1);
  assert.equal(store.submitReview('BP-884192', 5, 'Cancelada').ok, false);
});

test('verified ratings can be submitted without comments, including whitespace, and persist after reload', () => {
  assert.equal(store.submitReview('BP-952130', 4).ok, true);
  assert.equal(store.getState().reviews[0].text, '');
  assert.equal(store.getState().reviews[0].rating, 4);
  window.dispatchEvent(Object.assign(new Event('storage'), { key: 'bp:state:v1' }));
  assert.equal(store.getState().reviews[0].text, '');
  assert.equal(salonReviews(SALONS[4], store.getState().reviews).length, 4);
  assert.equal(store.submitReview('BP-952130', 5, 'Duplicada').ok, false);
  store.checkIn('BP-108420', SALONS[0].id);
  assert.equal(store.submitReview('BP-108420', 5, '   ').ok, true);
  assert.equal(store.getState().reviews[0].text, '');
});

test('review comments share exactly the input 280-character limit, without requiring any text', () => {
  assert.equal(REVIEW_MAX_LENGTH, 280);
  assert.equal(store.submitReview('BP-952130', 0, '').ok, false);
  assert.equal(store.submitReview('BP-952130', 6, '').ok, false);
  assert.equal(store.submitReview('BP-952130', 3.5, '').ok, false);
  for (const text of ['a'.repeat(281), ' '.repeat(281)]) {
    const result = store.submitReview('BP-952130', 4, text);
    assert.equal(result.ok, false);
    assert.ok(result.error?.includes('280'));
    assert.equal(store.getState().reviews.length, 0);
  }
  assert.equal(store.submitReview('BP-952130', 4, 'a'.repeat(280)).ok, true);
  assert.equal(store.getState().reviews[0].text.length, 280);
});

test('Rule of 100 leads with percentages below R$100 and actual BRL savings at or above the threshold', () => {
  const low = discountFraming(85, 60, 30)!;
  assert.deepEqual(low, { primary: '-30%', secondary: `Economize ${brl(25)}`, savings: 25, percent: 30 });
  assert.equal(discountFraming(99, 64, 35)?.primary, '-35%');
  assert.equal(discountFraming(100, 65, 35)?.primary, `Economize ${brl(35)}`);
  assert.equal(discountFraming(120, 78, 35)?.primary, `Economize ${brl(42)}`);
  assert.equal(discountFraming(120, 78, 35)?.secondary, '-35%');
  assert.equal(discountFraming(210, 137, 35)?.savings, 73);
  assert.equal(discountFraming(100, 100, 0), null);
  assert.equal(discountFraming(100, 100, 25), null);
  const frame = renderToStaticMarkup(createElement(DiscountFrame, { base: 120, final: 78, disc: 35, kind: 'economico', tid: 'test-frame' }));
  assert.ok(frame.indexOf('Economize') < frame.indexOf('-35%'));
  assert.ok(frame.includes('Horário Econômico'));
  assert.equal(renderToStaticMarkup(createElement(DiscountFrame, { base: 120, final: 120, disc: 0, kind: null })), '');
});

test('demo QR uses a four-module white quiet zone and deep-forest modules, with no Pix medallion', () => {
  const pix = renderToStaticMarkup(createElement(QR, { value: 'PIX-SIMULADO', medallion: false }));
  const voucher = renderToStaticMarkup(createElement(QR, { value: 'BP-108420', medallion: true }));
  assert.equal(QR_VIEWBOX, '-4 -4 33 33');
  for (const markup of [pix, voucher]) {
    assert.ok(markup.includes('data-qr-quiet-zone="4"'));
    assert.ok(markup.includes(`viewBox="${QR_VIEWBOX}"`));
    const colors = [...markup.matchAll(/fill="(#[A-Fa-f0-9]{6})"/g)].map((m) => m[1]);
    assert.ok(colors.length > 10);
    assert.ok(colors.every((c) => c === QR_DARK || c === QR_WHITE));
    assert.ok(markup.includes('x="-4" y="-4" width="33" height="33"'));
  }
  assert.equal(pix.includes('data-testid="qr-medallion"'), false);
  assert.ok(voucher.includes('data-testid="qr-medallion"'));
  assert.equal(pix, renderToStaticMarkup(createElement(QR, { value: 'PIX-SIMULADO', medallion: false })));
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

test('B2B revenue is three sorted, comparable BRL bars with exact zero baseline and no double-counted projection', () => {
  const now = new Date(); now.setHours(8, 0, 0, 0);
  store.checkIn('BP-108420', SALONS[0].id);
  const a = buildPartnerAnalytics(store.getState(), SALONS[0].id, now);
  assert.equal(REVENUE_BASELINE, 0);
  assert.equal(a.revenue.length, 3);
  assert.equal(a.revenue.find((r) => r.id === 'empty')?.value, 0);
  assert.equal(a.revenue.find((r) => r.id === 'confirmed')?.value, 73.92);
  assert.equal(a.revenue.find((r) => r.id === 'projected')?.value, a.activeProjectedNet);
  assert.equal(a.projectedNet, +(a.activeProjectedNet + a.completedNet).toFixed(2));
  assert.ok(a.revenue.every((r, i, rows) => Number.isFinite(r.value) && r.value >= 0 && (i === 0 || rows[i - 1].value >= r.value)));
  assert.deepEqual(new Set(a.revenue.map((r) => r.name)), new Set(['Projeção de horários ativos', 'Repasse confirmado D+1', 'Cadeira vazia']));
  assert.ok(a.occupancyLiftPp > 0 && a.occupancyLiftPp <= 50);
  assert.ok(a.occupancy.every((h) => h.beautyPass >= h.baseline));
  const evening = new Date(); evening.setHours(23, 59, 0, 0);
  const noFutureLift = buildPartnerAnalytics(store.getState(), SALONS[0].id, evening);
  assert.equal(noFutureLift.occupancyLiftPp, 0);
  assert.equal(noFutureLift.activeProjectedNet, 0);
  assert.ok(noFutureLift.baselineOccupancy >= 0 && noFutureLift.baselineOccupancy <= 100);
  const empty = buildPartnerAnalytics(store.getState(), 'unknown-salon', now);
  assert.equal(empty.revenue.length, 3);
  assert.ok(empty.revenue.every((r) => r.value === 0));
});
test('legacy demos discard removed products and travel data, map former payments to Pix and preserve vouchers', () => {
  store.startHold({ ...store.getState().bookings[0], date: dateKey(addDays(new Date(), 2)) });
  const current = store.getState();
  const legacy = {
    ...current, fulfillment: 'domicilio',
    user: { ...current.user, plan: 'Black VIP', credits: 999, clubDismissed: true },
    bookings: current.bookings.map((b) => ({ ...b, mode: 'domicilio', address: 'Endereço antigo', fee: 20, payment: 'credits' })),
    hold: { ...current.hold!, mode: 'domicilio', address: 'Endereço antigo', fee: 20 },
    ledger: current.ledger.map((l) => ({ ...l, gross: l.gross + 20, net: l.net + 17.6 })),
    reviews: undefined,
  };
  local.setItem('bp:state:v1', JSON.stringify(legacy));
  window.dispatchEvent(Object.assign(new Event('storage'), { key: 'bp:state:v1' }));
  assert.equal(store.getState().bookings.length, 3);
  assert.deepEqual(store.getState().reviews, []);
  assert.equal(store.getState().user.preferredPayment, 'pix');
  assert.equal(store.totalSaved(store.getState()), 53.5);
  assert.equal(store.getState().hold?.final, 84);
  assert.equal(store.getState().hold?.notes, current.hold?.notes);
  assert.equal(store.getState().ledger[0].gross, 52.5);
  assert.equal(store.getState().ledger[0].net, 46.2);
  const serialized = local.getItem('bp:state:v1')!;
  for (const removed of ['fulfillment', 'plan', 'credits', 'clubDismissed', 'mode', 'address', 'fee']) {
    assert.equal(serialized.includes(`"${removed}":`), false, `${removed} must be removed from persisted state`);
  }
  assert.ok(store.getState().bookings.every((b) => b.payment === 'pix'));
  store.submitReview('BP-952130', 4, 'Muito bom, atendimento cuidadoso.');
  const saved = local.getItem('bp:state:v1')!;
  store.resetDemo();
  local.setItem('bp:state:v1', saved);
  window.dispatchEvent(Object.assign(new Event('storage'), { key: 'bp:state:v1' }));
  assert.equal(store.getState().reviews.length, 1);
});

test('legacy card records stay card, BRL refunds exclude former surcharges and migrated state is idempotent', () => {
  const current = store.getState();
  const legacy = {
    ...current, user: { ...current.user, preferredPayment: 'card' },
    bookings: current.bookings.map((b) => b.code === 'BP-108420'
      ? { ...b, status: 'CANCELLED_BY_USER', payment: 'card', cancelFee: 31.2, refund: 72.8, fee: 20 } : b),
  };
  local.setItem('bp:state:v1', JSON.stringify(legacy));
  const reload = () => window.dispatchEvent(Object.assign(new Event('storage'), { key: 'bp:state:v1' }));
  reload();
  const booking = store.getState().bookings[0];
  assert.equal(booking.payment, 'card');
  assert.equal(booking.final, 84);
  assert.equal(booking.cancelFee, 25.2);
  assert.equal(booking.refund, 58.8);
  const migrated = local.getItem('bp:state:v1');
  reload();
  assert.equal(local.getItem('bp:state:v1'), migrated);
});

test('free-marketplace deal dismissal persists independently of favorites and payment preference', () => {
  store.dismissDeals();
  store.toggleFavorite(SALONS[0].id);
  store.setPreferredPayment('card');
  window.dispatchEvent(Object.assign(new Event('storage'), { key: 'bp:state:v1' }));
  assert.equal(store.getState().user.dealsDismissed, true);
  assert.ok(store.getState().favorites.includes(SALONS[0].id));
  assert.equal(store.getState().user.preferredPayment, 'card');
});

test('reset restores the demo, triggers splash and never deletes unrelated storage', () => {
  local.setItem('other-product', 'keep');
  let fired = 0;
  window.addEventListener('bp:reset', () => fired++, { once: true });
  store.setPreferredPayment('card');
  store.dismissDeals();
  store.resetDemo();
  assert.equal(store.getState().user.preferredPayment, 'pix');
  assert.equal(store.getState().user.dealsDismissed, false);
  assert.equal(store.totalSaved(store.getState()), 53.5);
  assert.equal(store.getState().reviews.length, 0);
  assert.equal(local.getItem('other-product'), 'keep');
  assert.equal(fired, 1);
});
