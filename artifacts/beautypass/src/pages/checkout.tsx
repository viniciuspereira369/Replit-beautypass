import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { CreditCard, QrCode, Timer, ShieldCheck, Copy, ArrowLeft, Hourglass, MapPin, Check } from 'lucide-react';
import { getSalon } from '@/lib/data';
import { brl, fmtDate, hash, kindLabel, pad } from '@/lib/pricing';
import { clearHold, confirmHold, setState, useStore, type Payment } from '@/lib/store';
import { QR } from '@/components/art';
import { Empty, PageHeader } from '@/components/shell';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const luhn = (n: string) => { const d = n.replace(/[\s-]/g, ''); if (!/^\d{13,19}$/.test(d)) return false; let s = 0; for (let i = 0; i < d.length; i++) { let x = +d[d.length - 1 - i]; if (i % 2) { x *= 2; if (x > 9) x -= 9; } s += x; } return s % 10 === 0; };
const expOk = (v: string) => { const m = /^(\d{2})\/(\d{2})$/.exec(v.trim()); if (!m) return false; const mo = +m[1]; if (mo < 1 || mo > 12) return false; const end = new Date(2000 + +m[2], mo, 1); return end.getTime() > Date.now(); };
const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
const fmtExp = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

function copyFallback(text: string) {
  const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; } document.body.removeChild(ta); return ok;
}

export default function CheckoutPage() {
  const st = useStore(); const h = st.hold; const [, navigate] = useLocation(); const { toast } = useToast();
  const [pay, setPay] = useState<Payment>(st.user.preferredPayment === 'card' ? 'card' : 'pix');
  const [card, setCard] = useState('4111 1111 1111 1111'); const [name, setName] = useState('CAMILA ALVES'); const [exp, setExp] = useState('12/29'); const [cvv, setCvv] = useState('123');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(Date.now()); const [err, setErr] = useState(''); const busy = useRef(false); const [sending, setSending] = useState(false);
  const pixRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  if (!h) return <div className="px-5 pt-10"><Empty icon={Hourglass} title="Nenhuma reserva em andamento" text="Escolha um salão e um horário para começar." action={<Link href="/" className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white">Explorar salões</Link>} /></div>;
  const s = getSalon(h.salonId)!; const left = Math.max(0, h.expiresAt - now); const expired = left === 0;
  const total = h.final; const lbl = kindLabel(h.kind);
  const pix = `00020126BEAUTYPASS${hash(h.salonId + h.date + h.hour + h.expiresAt)}5204${Math.round(total * 100)}`;
  const patch = (p: Partial<typeof h>) => setState((x) => (x.hold ? { ...x, hold: { ...x.hold, ...p } } : x));

  const errs = {
    card: luhn(card) ? '' : 'Use 13 a 19 dígitos que passem na verificação de Luhn.',
    name: name.trim() ? '' : 'Nome do titular é obrigatório.',
    exp: expOk(exp) ? '' : 'Use MM/AA com mês 01–12 e data futura.',
    cvv: /^\d{3,4}$/.test(cvv) ? '' : 'CVV deve ter 3 ou 4 dígitos.',
  };
  const cardValid = !errs.card && !errs.name && !errs.exp && !errs.cvv;

  const copyPix = async () => {
    try { if (!navigator.clipboard) throw new Error('x'); await navigator.clipboard.writeText(pix); toast({ title: 'Código Pix copiado' }); }
    catch {
      if (copyFallback(pix)) toast({ title: 'Código Pix copiado' });
      else { pixRef.current?.focus(); pixRef.current?.select(); toast({ title: 'Não foi possível copiar', description: 'O código foi selecionado — copie manualmente.', variant: 'destructive' }); }
    }
  };

  const submit = () => {
    if (busy.current) return; setErr('');
    if (pay === 'card' && !cardValid) { setTouched({ card: true, name: true, exp: true, cvv: true }); setErr('Revise os dados do cartão de teste.'); return; }
    busy.current = true; setSending(true);
    setTimeout(() => {
      const r = confirmHold(pay); busy.current = false; setSending(false);
      if (!r.ok) { setErr(r.error); return; }
      toast({ title: 'Reserva confirmada', description: r.code }); navigate(`/confirmado/${r.code}`);
    }, 700);
  };
  const tab = (v: Payment, l: string, sub: string, I: typeof QrCode) => { const on = pay === v; return (
    <button key={v} role="radio" aria-checked={on} data-testid={`button-pay-${v}`} onClick={() => { setPay(v); setErr(''); }} className={cn('flex flex-1 items-center gap-2.5 rounded-2xl border p-3 text-left transition active:scale-[.98]', on ? 'border-forest bg-forest text-white' : 'border-line bg-white text-ink')}>
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', on ? 'bg-white/10 text-mint' : 'bg-tint text-teal-deep')}><I className="h-4 w-4" /></span>
      <span className="min-w-0"><b className="block text-xs">{l}</b><span className={cn('text-[10px]', on ? 'text-white/70' : 'text-muted-ink')}>{sub}</span></span>
    </button>); };
  const inp = (bad: boolean) => cn('mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 tnum', bad ? 'border-coral focus:ring-coral/30' : 'border-line focus:border-teal focus:ring-mint/40');
  const field = (k: keyof typeof errs, label: string, val: string, set: (v: string) => void, extra: { cls?: string; mode?: 'numeric' | 'text'; ph?: string; max?: number; auto?: string } = {}) => {
    const bad = !!touched[k] && !!errs[k];
    return (
      <label className={cn('text-xs font-semibold text-ink', extra.cls)}>{label}
        <input data-testid={`input-${k === 'card' ? 'card' : `card-${k}`}`} value={val} aria-invalid={bad} aria-describedby={`err-${k}`} inputMode={extra.mode} placeholder={extra.ph} maxLength={extra.max} autoComplete={extra.auto}
          onChange={(e) => { set(e.target.value); setTouched((t) => ({ ...t, [k]: true })); }} onBlur={() => setTouched((t) => ({ ...t, [k]: true }))} className={inp(bad)} />
        <span id={`err-${k}`} className={cn('mt-0.5 block text-[10px] font-normal', bad ? 'text-coral' : 'text-muted-ink')} data-testid={`text-error-${k}`}>{bad ? errs[k] : touched[k] && !errs[k] ? 'Ok' : '\u00a0'}</span>
      </label>
    );
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Checkout" title="Confirme sua reserva" serif={false} />
      <div className="space-y-4 px-5 pt-4">
        <div className={cn('flex items-center justify-between rounded-2xl px-4 py-3 text-sm', expired ? 'bg-coral-bg text-coral' : 'bg-tint text-forest')} data-testid="text-hold-timer">
          <span className="flex items-center gap-2"><Timer className="h-4 w-4" />{expired ? 'Tempo esgotado — horário liberado' : 'Horário reservado para você por'}</span>
          {!expired && <b className="tnum">{pad(Math.floor(left / 60000))}:{pad(Math.floor(left / 1000) % 60)}</b>}
        </div>
        {expired && <button data-testid="button-hold-restart" onClick={() => { clearHold(); navigate(`/salao/${s.id}`); }} className="w-full rounded-full border border-forest py-2.5 text-sm font-semibold text-forest">Escolher novo horário</button>}

        <div className="rounded-[24px] border border-line bg-white p-4">
          <p className="tight text-lg font-bold text-forest">{s.name}</p>
          <p className="text-xs capitalize text-muted-ink">{fmtDate(h.date)} · {pad(h.hour)}:00 · {s.services.filter((x) => h.serviceIds.includes(x.id)).map((x) => x.name).join(' + ')}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink" data-testid="text-checkout-address"><MapPin className="h-3.5 w-3.5 shrink-0 text-teal" />{s.address}, {s.hood} · São Paulo</p>
          <dl className="mt-3 space-y-1 text-sm tnum">
            {h.disc > 0 && <div className="flex justify-between"><dt className="text-muted-ink">Preço de tabela</dt><dd><s className="text-strike">{brl(h.base)}</s></dd></div>}
            {h.disc > 0 && lbl && <div className="flex justify-between text-teal-deep"><dt>{lbl.title} -{h.disc}%</dt><dd>-{brl(h.base - h.final)}</dd></div>}
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-forest"><dt>Você paga</dt><dd data-testid="text-checkout-total">{brl(total)}</dd></div>
          </dl>
          <p className="mt-2 text-[11px] text-muted-ink">Preço final congelado. Sem assinatura, sem mensalidade — você paga apenas este agendamento.</p>
        </div>

        <label className="block text-xs font-semibold text-ink">Observações para o Profissional<textarea data-testid="input-notes" value={h.notes ?? ''} onChange={(e) => patch({ notes: e.target.value })} rows={2} placeholder="Alergias, preferências, referências…" className={cn(inp(false), 'font-normal')} /></label>

        <div role="radiogroup" aria-label="Forma de pagamento" className="flex gap-2">{tab('pix', 'Pix Instantâneo', 'Aprovação imediata', QrCode)}{tab('card', 'Cartão de Crédito', 'Simulado', CreditCard)}</div>

        {pay === 'pix' && <div className="flex flex-col items-center gap-2 rounded-[24px] border border-line bg-white p-4" data-testid="panel-pix">
          <QR value={pix} size={170} />
          <label className="w-full text-[10px] text-muted-ink"><span className="sr-only">Código Pix copia e cola</span>
            <input ref={pixRef} readOnly value={pix} onFocus={(e) => e.currentTarget.select()} data-testid="input-pix-code" className="w-full truncate rounded-lg bg-tint px-2 py-1.5 text-center font-mono text-[10px] text-muted-ink outline-none focus:ring-2 focus:ring-mint/40" />
          </label>
          <button data-testid="button-pix-copy" onClick={copyPix} className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-tint"><Copy className="h-3.5 w-3.5" />Copiar código</button>
        </div>}

        {pay === 'card' && <div className="grid grid-cols-2 gap-x-2 gap-y-1 rounded-[24px] border border-line bg-white p-4" data-testid="panel-card">
          <p className="col-span-2 mb-1 flex items-center justify-between text-[11px] text-muted-ink"><span>Dados de teste pré-preenchidos (simulado)</span>{cardValid && <span className="flex items-center gap-1 font-semibold text-economy"><Check className="h-3 w-3" />Válido</span>}</p>
          {field('card', 'Número do cartão', card, (v) => setCard(fmtCard(v)), { cls: 'col-span-2', mode: 'numeric', ph: '0000 0000 0000 0000', max: 23, auto: 'cc-number' })}
          {field('name', 'Nome do titular *', name, (v) => setName(v.toUpperCase()), { cls: 'col-span-2', auto: 'cc-name' })}
          {field('exp', 'Validade (MM/AA)', exp, (v) => setExp(fmtExp(v)), { mode: 'numeric', ph: 'MM/AA', max: 5, auto: 'cc-exp' })}
          {field('cvv', 'CVV', cvv, (v) => setCvv(v.replace(/\D/g, '').slice(0, 4)), { mode: 'numeric', ph: '123', max: 4, auto: 'cc-csc' })}
        </div>}

        <div className="space-y-1 rounded-2xl bg-tint-2 p-3 text-[11px] text-ink">
          <p className="flex gap-1.5"><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal" />Pagamento simulado — nenhum valor será cobrado neste teste.</p>
          <p>Cancelamento gratuito até 24h antes. Ao concluir, você autoriza o salão a reter até 30% do valor em caso de não comparecimento.</p>
        </div>
        {err && <p role="alert" className="rounded-xl bg-coral-bg p-3 text-xs text-coral" data-testid="text-checkout-error">{err}</p>}
        <button data-testid="button-confirm" disabled={expired || sending} onClick={submit} className="w-full rounded-full bg-forest py-3.5 text-sm font-bold text-white transition hover:bg-forest-hover active:scale-[.98] disabled:opacity-50">{sending ? 'Confirmando…' : `Confirmar · ${brl(total)}`}</button>
        <button data-testid="button-release-hold" onClick={() => { clearHold(); navigate(`/salao/${s.id}`); }} className="flex w-full items-center justify-center gap-1 text-xs text-muted-ink"><ArrowLeft className="h-3 w-3" />Voltar e liberar horário</button>
      </div>
    </div>
  );
}
