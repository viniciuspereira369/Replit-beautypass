import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

// Uses the system Chromium's local debugging port; no browser dependency or backend.
const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = targets.find((entry) => entry.type === 'page');
assert.ok(target, 'Start Chromium with --remote-debugging-port=9222 first.');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
const waiting = new Map();
const errors = [];
let sequence = 0;
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const pending = waiting.get(message.id);
    waiting.delete(message.id);
    if (message.error) pending?.reject(new Error(JSON.stringify(message.error)));
    else pending?.resolve(message.result);
  }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
});
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  waiting.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result.value;
};
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const until = async (expression, message) => {
  const expires = Date.now() + 15000;
  while (Date.now() < expires) {
    if (await evaluate(expression)) return;
    await pause(100);
  }
  throw new Error(`Timed out: ${message}`);
};
const selector = (id) => `[data-testid="${id}"]`;
const click = async (id) => {
  await until(`!!document.querySelector(${JSON.stringify(selector(id))})`, id);
  await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector(id))});
    if (el.disabled) throw new Error('Button disabled: ${id}');
    el.scrollIntoView({block:'center'});
    el.click();
  })()`);
  await pause(160);
};
const input = async (id, value) => {
  await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector(id))});
    if (!el) throw new Error('Missing input: ${id}');
    const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype :
      el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', {bubbles:true}));
    el.dispatchEvent(new Event('change', {bubbles:true}));
  })()`);
  await pause(100);
};
const state = () => evaluate(`JSON.parse(localStorage.getItem('bp:state:v1'))`);
const go = async (path) => {
  await call('Page.navigate', { url: `http://127.0.0.1:80${path}` });
  await until(`document.readyState === 'complete' && !!document.querySelector('main, [data-testid="select-salon"]')`, path);
  await until(`!document.querySelector('[data-testid="splash"]')`, 'splash ends');
  await pause(350);
};
const screenshot = async (name) => {
  const result = await call('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
  await writeFile(`generated-artifacts/beautypass-tests/${name}.jpg`, Buffer.from(result.data, 'base64'));
};

try {
  await mkdir('generated-artifacts/beautypass-tests', { recursive: true });
  await call('Runtime.enable');
  await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  let code;
  if (!process.argv.includes('--map-onward')) {
  await go('/');
  await click('button-reset-demo');
  await until(`!document.querySelector('[data-testid="splash"]')`, 'reset splash ends');
  assert.ok(await evaluate(`document.querySelector('main').getBoundingClientRect().width <= 412`));
  await click('button-toggle-hub');
  await click('pill-discount-35');
  assert.ok(await evaluate(`document.querySelector('[data-testid="pill-discount-35"]').getAttribute('aria-pressed') === 'true'`));
  await input('input-search', 'atelie');
  assert.ok(await evaluate(`document.querySelector('main').innerText.includes('Ateliê Belle Époque')`));
  await input('input-search', '');
  await screenshot('home-desktop');
  console.log('PASS mobile-frame default, splash/reset, coupon hub and accent-insensitive search');

  await click('button-demo-guide');
  assert.equal(await evaluate(`document.querySelectorAll('[data-testid^="button-journey-"]').length`), 3);
  await click('button-journey-clock');
  await until(`!!document.querySelector('[data-testid="radial-clock"]')`, 'radial journey');
  await click('button-day-2');
  await click('button-preset-19');
  assert.equal(await evaluate(`document.querySelector('[data-testid="text-clock-time"]').textContent`), '19:00');
  assert.equal(await evaluate(`document.querySelector('[data-testid="button-period-Noite"]').getAttribute('aria-checked')`), 'true');
  assert.equal(await evaluate(`document.querySelector('[data-testid="card-live-price"]').innerText.includes('%')`), false);
  const photos = await evaluate(`Array.from(document.querySelectorAll('button img')).filter(i=>i.alt.includes('foto')).map(i=>i.src)`);
  // Gallery controls stay native buttons even if their test IDs change.
  const galleryChanged = await evaluate(`(() => {
    const gallery = Array.from(document.querySelectorAll('section')).find(s=>s.innerText.includes('Ambiente & Espaço'));
    const buttons = gallery?.querySelectorAll('button');
    if (!buttons?.[1]) return false;
    buttons[1].click(); return true;
  })()`);
  assert.ok(galleryChanged, 'Four-photo gallery should be interactive');
  await click('button-period-Tarde');
  const available = await evaluate(`Array.from(document.querySelectorAll('[data-testid^="button-slot-"]')).find(b=>!b.disabled && b.textContent.includes('%'))?.getAttribute('data-testid')`);
  assert.ok(available, 'A future off-peak slot should be available');
  await click(available);
  await screenshot('salon-radial');
  const quote = await evaluate(`document.querySelector('[data-testid="text-total"]').textContent`);
  await click('button-reserve');
  await until(`location.pathname === '/checkout'`, 'checkout');
  assert.equal(await evaluate(`document.querySelector('[data-testid="text-checkout-total"]').textContent`), quote);
  await input('input-notes', 'Prefiro acabamento natural. Demonstração para os jurados.');
  await click('button-pay-card');
  await input('input-card', '1111 1111 1111 1111');
  await click('button-confirm');
  assert.ok(await evaluate(`document.querySelector('[data-testid="text-checkout-error"]')?.textContent.includes('inválido')`));
  await input('input-card', '4111 1111 1111 1111');
  await click('button-confirm');
  await until(`location.pathname.startsWith('/confirmado/BP-')`, 'booking confirmation');
  code = (await state()).bookings[0].code;
  const amount = (await state()).bookings[0].final;
  assert.ok((await state()).bookings[0].notes.includes('acabamento natural'));
  await screenshot('boarding-pass');
  console.log(`PASS radial/period/gallery selection, frozen checkout, Luhn validation and voucher ${code}`);

  await go('/painel');
  await click('tab-b2b-Regras Dinâmicas');
  const rulesBefore = (await state()).rules.length;
  await click('button-rule-pct-30');
  await click('button-add-rule');
  assert.equal((await state()).rules.length, rulesBefore + 1);
  assert.ok(await evaluate(`document.querySelectorAll('.recharts-surface').length >= 2`));
  await click('button-next-checkin');
  await input('input-checkin-code', code);
  await click('button-checkin');
  await until(`document.querySelector('[data-testid="text-checkin-result"]')?.textContent.includes('Check-in confirmado')`, 'partner check-in');
  assert.equal((await state()).bookings.find((b) => b.code === code).status, 'COMPLETED');
  assert.equal((await state()).ledger.find((l) => l.code === code).net, +(amount * 0.88).toFixed(2));
  await screenshot('partner-checkin');
  await go('/reservas');
  await click('tab-hist');
  await click(`button-review-${code}`);
  await click('button-star-5');
  await input('input-review-comment', 'Atendimento excelente, pontual e muito cuidadoso.');
  await click('button-review-submit');
  await until(`!!document.querySelector('[data-testid="text-reviewed-${code}"]')`, 'review marked');
  assert.equal((await state()).reviews.length, 1);
  await go('/salao/atelie-belle-epoque');
  assert.ok(await evaluate(`document.querySelector('main').innerText.includes('Atendimento excelente, pontual e muito cuidadoso.')`));
  console.log('PASS B2B rule, live charts, check-in ledger, unlocked review and updated salon reviews after reload');
  } else {
    code = (await state()).bookings[0].code;
  }

  await go('/mapa');
  await click('card-map-rest-atelie-belle-epoque');
  await until(`!!document.querySelector('[data-testid="card-map-detail"]')`, 'map focused sheet transition');
  await click('button-map-close');
  await until(`!!document.querySelector('[data-testid="card-map-rest-atelie-belle-epoque"]')`, 'map resting carousel');
  await click('button-recenter');
  await go('/pedir');
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Tarde')?.click()`);
  await click('button-pedir-search');
  await until(`!!document.querySelector('[data-testid="button-match-book"]')`, 'instant matching results after radar');
  await click('button-match-book');
  await until(`location.pathname === '/checkout'`, 'instant checkout');
  assert.ok((await state()).hold.final >= 30);
  console.log('PASS map sheet selection/recenter and instant match → checkout');

  await call('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 1, mobile: true });
  await go('/perfil');
  assert.ok(await evaluate(`document.documentElement.scrollWidth <= 412`));
  await screenshot('profile-mobile');
  assert.equal(errors.length, 0, errors.join('\n'));
  await writeFile('generated-artifacts/beautypass-tests/browser-result.json', JSON.stringify({ passed: true, code, errors }, null, 2));
  console.log('PASS mobile bounds and no uncaught JavaScript errors');
} finally {
  socket.close();
}
