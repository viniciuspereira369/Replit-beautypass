import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { CreditCard, QrCode, Coins, Timer, ShieldCheck, Copy, ArrowLeft, Hourglass } from 'lucide-react';
import { getSalon, TOPUPS } from '@/lib/data';
import { brl, fmtDate, hash, kindLabel, pad } from '@/lib/pricing';
import { addCredits, clearHold, confirmHold, setState, useStore, type Payment } from '@/lib/store';
import { QR } from '@/components/art';
import { Empty, PageHeader } from '@/components/shell';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const luhn = (n: string) => { const d = n.replace(/[\s-]/g, ''); if (!/^\d{13,19}$/.test(d)) return false; let s = 0; for (let i = 0; i < d.length; i++) { let x = +d[d.length - 1 - i]; if (i % 2) { x *= 2; if (x > 9) x -= 9; } s += x; } return s % 10 === 0; };

const expOk = (v: string) => { const m = /^(\d{2})\/(\d{2})$/.exec(v.trim()); if (!m) return false; const mo = +m[1]; if (mo < 1 || mo > 12) return false; const end = new Date(2000 + +m[2], mo, 1); return end.getTime() > Date.now(); };

export default function CheckoutPage() {
  const st = useStore(); const h = st.hold; const [, navigate] = useLocation(); const { toast } = useToast();
  const [pay, setPay] = useState<Payment>('credits'); const [card, setCard] = useState('4111 1111 1111 1111');
  const [name, setName] = useState('CAMILA ALVES'); const [exp, setExp] = useState('12/29'); const [cvv, setCvv] = useState('123');
  const [now, setNow] = useState(Date.now()); const [err, setErr] = useState(''); const busy = useRef(false); const [sending, setSending] = useState(false);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  if (!h) return <div className="px-5 pt-10"><Empty icon={Hourglass} title="Nenhuma reserva em andamento" text="Escolha um salão e um horário para começar." action={<Link href="/" className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-tint">Explorar salões</Link>} /></div>;
  const s = getSalon(h.salonId)!; const left = Math.max(0, h.expiresAt - now); const expired = left === 0;
  const total = h.final + h.fee; const cost = Math.round(total); const lbl = kindLabel(h.kind);
  const pix = `00020126BEAUTYPASS${hash(h.salonId + h.date + h.hour + h.expiresAt)}5204${cost}`;
  const patch = (p: Partial<typeof h>) => setState((x) => (x.hold ? { ...x, hold: { ...x.hold, ...p } } : x));

  const submit = () => {
    if (busy.current) return; setErr('');
    if (pay === 'card') {
      if (!luhn(card)) { setErr('Número de teste inválido: use 13 a 19 dígitos que passem na verificação de Luhn.'); return; }
      if (!name.trim()) { setErr('Informe o nome de teste.'); return; }
      if (!expOk(exp)) { setErr('Validade de teste inválida: use MM/AA com mês entre 01 e 12 e data futura.'); return; }
      if (!/^\d{3,4}$/.test(cvv)) { setErr('Código de teste deve ter 3 ou 4 dígitos.'); return; }
    }
    busy.current = true; setSending(true);
    setTimeout(() => {
      const r = confirmHold(pay); busy.current = false; setSending(false);
      if (!r.ok) { setErr(r.error); return; }
      toast({ title: 'Reserva confirmada', description: r.code }); navigate(`/confirmado/${r.code}`);
    }, 700);
  };
  const tab = (v: Payment, l: string, I: typeof Coins) => <button key={v} data-testid={`button-pay-${v}`} onClick={() => setPay(v)} className={cn('flex flex-1 flex-col items-center gap-1 rounded-2xl border py-3 text-xs font-semibold transition', pay === v ? 'border-forest bg-forest text-tint' : 'border-line bg-white text-ink')}><I className="h-4 w-4" />{l}</button>;
  const inp = 'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-mint/40 tnum';

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Checkout" title="Confirme sua reserva" />
      <div className="space-y-4 px-5 pt-4">
        <div className={cn('flex items-center justify-between rounded-2xl px-4 py-3 text-sm', expired ? 'bg-coral-bg text-coral' : 'bg-tint text-forest')} data-testid="text-hold-timer">
          <span className="flex items-center gap-2"><Timer className="h-4 w-4" />{expired ? 'Tempo esgotado — horário liberado' : 'Horário reservado para você por'}</span>
          {!expired && <b className="tnum">{pad(Math.floor(left / 60000))}:{pad(Math.floor(left / 1000) % 60)}</b>}
        </div>
        {expired && <button data-testid="button-hold-restart" onClick={() => { clearHold(); navigate(`/salao/${s.id}`); }} className="w-full rounded-full border border-forest py-2.5 text-sm font-semibold text-forest">Escolher novo horário</button>}

        <div className="rounded-3xl border border-line bg-white p-4">
          <p className="font-display text-lg text-forest">{s.name}</p>
          <p className="text-xs capitalize text-muted-ink">{fmtDate(h.date)} · {pad(h.hour)}:00 · {s.services.filter((x) => h.serviceIds.includes(x.id)).map((x) => x.name).join(' + ')}</p>
          <dl className="mt-3 space-y-1 text-sm tnum">
            <div className="flex justify-between"><dt className="text-muted-ink">Preço base</dt><dd>{brl(h.base)}</dd></div>
            {h.disc > 0 && lbl && <div className="flex justify-between text-teal-deep"><dt>{lbl.title} -{h.disc}%</dt><dd>-{brl(h.base - h.final)}</dd></div>}
            {h.fee > 0 && <div className="flex justify-between"><dt className="text-muted-ink">Taxa a domicílio</dt><dd>{brl(h.fee)}</dd></div>}
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-forest"><dt>Total</dt><dd data-testid="text-checkout-total">{brl(total)}</dd></div>
          </dl>
          <p className="mt-2 text-[11px] text-muted-ink">Preço congelado: o valor não muda após a confirmação.</p>
        </div>

        {h.mode === 'domicilio' && <label className="block text-xs font-semibold text-ink">Endereço do atendimento *<input data-testid="input-address" required value={h.address ?? ''} onChange={(e) => patch({ address: e.target.value })} placeholder="Rua, número, apto" className={cn(inp, 'mt-1 font-normal')} /></label>}
        <label className="block text-xs font-semibold text-ink">Observações para o Profissional<textarea data-testid="input-notes" value={h.notes ?? ''} onChange={(e) => patch({ notes: e.target.value })} rows={2} placeholder="Alergias, preferências, referências…" className={cn(inp, 'mt-1 font-normal')} /></label>

        <div className="flex gap-2">{tab('credits', 'BeautyCredits', Coins)}{tab('card', 'Cartão', CreditCard)}{tab('pix', 'Pix', QrCode)}</div>
        {pay === 'card' && <div className="grid grid-cols-2 gap-2">
          <label className="col-span-2 text-xs text-muted-ink">Número de teste (simulado)<input data-testid="input-card" value={card} onChange={(e) => setCard(e.target.value)} inputMode="numeric" className={inp} /></label>
          <label className="col-span-2 text-xs text-muted-ink">Nome de teste<input data-testid="input-card-name" value={name} onChange={(e) => setName(e.target.value)} className={inp} /></label>
          <label className="text-xs text-muted-ink">Validade de teste (MM/AA)<input data-testid="input-card-exp" value={exp} onChange={(e) => setExp(e.target.value)} className={inp} /></label>
          <label className="text-xs text-muted-ink">Código de teste<input data-testid="input-card-cvv" value={cvv} onChange={(e) => setCvv(e.target.value)} className={inp} /></label>
        </div>}
        {pay === 'pix' && <div className="flex flex-col items-center gap-2 rounded-3xl border border-line bg-white p-4"><QR value={pix} size={170} /><code className="max-w-full truncate text-[10px] text-muted-ink">{pix}</code><button data-testid="button-pix-copy" onClick={async () => { try { if (!navigator.clipboard) throw new Error('x'); await navigator.clipboard.writeText(pix); toast({ title: 'Código Pix copiado' }); } catch { toast({ title: 'Não foi possível copiar', description: 'Selecione e copie o código manualmente.', variant: 'destructive' }); } }} className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink"><Copy className="h-3.5 w-3.5" />Copiar código</button></div>}
        {pay === 'credits' && <div className="rounded-3xl border border-line bg-white p-4 text-sm tnum">
          <p className="flex justify-between"><span className="text-muted-ink">Saldo</span><b data-testid="text-credit-balance">{st.user.credits} BC</b></p>
          <p className="flex justify-between"><span className="text-muted-ink">Débito</span><b>{cost} BC</b></p>
          <p className="mt-1 text-[11px] text-muted-ink">1 BeautyCredit = R$ 1</p>
          {st.user.credits < cost && <div className="mt-3 rounded-2xl bg-coral-bg p-3"><p className="text-xs text-coral">Faltam {cost - st.user.credits} BC. Recarga rápida:</p><div className="mt-2 flex gap-2">{TOPUPS.map((t) => <button key={t.credits} data-testid={`button-quick-topup-${t.credits}`} onClick={() => { addCredits(t.credits); toast({ title: `+${t.credits} BeautyCredits`, description: `Recarga simulada de ${brl(t.price)}` }); }} className="flex-1 rounded-xl bg-white py-2 text-xs font-semibold text-forest">+{t.credits}<span className="block text-[10px] font-normal text-muted-ink">{brl(t.price)}</span></button>)}</div></div>}
        </div>}

        <div className="space-y-1 rounded-2xl bg-tint-2 p-3 text-[11px] text-ink">
          <p className="flex gap-1.5"><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal" />Pagamento simulado — nenhum valor será cobrado neste teste.</p>
          <p>Ao concluir, você autoriza o salão a reter até 30% do valor em caso de não comparecimento.</p>
        </div>
        {err && <p role="alert" className="rounded-xl bg-coral-bg p-3 text-xs text-coral" data-testid="text-checkout-error">{err}</p>}
        <button data-testid="button-confirm" disabled={expired || sending} onClick={submit} className="w-full rounded-full bg-forest py-3.5 text-sm font-bold text-tint transition hover:bg-forest-hover active:scale-[.98] disabled:opacity-50">{sending ? 'Confirmando…' : `Confirmar · ${brl(total)}`}</button>
        <button onClick={() => { clearHold(); navigate(`/salao/${s.id}`); }} className="flex w-full items-center justify-center gap-1 text-xs text-muted-ink"><ArrowLeft className="h-3 w-3" />Voltar e liberar horário</button>
      </div>
    </div>
  );
}
