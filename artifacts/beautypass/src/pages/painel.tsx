import { useState } from 'react';
import { useLocation } from 'wouter';
import { Eye, Gauge, Clock3, Sparkles, Wallet, Plus, Trash2, ScanLine, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { SALONS } from '@/lib/data';
import { brl, dateKey, HOURS, pad, priceFor, slotDiscount, slotState } from '@/lib/pricing';
import { addRule, checkIn, isTaken, removeRule, resetDemo, useStore } from '@/lib/store';
import { Wordmark } from '@/components/shell';
import { QR } from '@/components/art';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const TABS = ['Agenda & Ociosidade', 'Regras Dinâmicas', 'Check-in QR & Receita D+1'] as const;

export default function PainelPage() {
  const st = useStore(); const [, navigate] = useLocation(); const { toast } = useToast();
  const [sid, setSid] = useState(SALONS[0].id); const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const salon = SALONS.find((s) => s.id === sid)!; const today = dateKey(new Date());
  const rules = st.rules.filter((r) => r.salonId === sid);
  const grid = salon.staff.map((p, pi) => HOURS.map((h) => {
    const r = slotDiscount(salon, today, h, st.rules);
    const booked = st.bookings.some((b) => b.salonId === sid && b.date === today && b.hour === h && b.status !== 'CANCELLED_BY_USER' && b.status !== 'CANCELLED_BY_MERCHANT' && (b.staffId ? b.staffId === p.id : pi === 0));
    const occ = booked || slotState(salon, `${today}${p.id}`, h, 0, false) === 'Ocupado' || (pi === 0 && slotState(salon, today, h, 0, false) === 'Ocupado');
    return { h, occ, disc: r.disc, past: r.past };
  }));
  const cells = grid.flat(); const occ = cells.filter((c) => c.occ).length;
  const idle = cells.filter((c) => !c.occ && !c.past).length;
  const ledger = st.ledger.filter((l) => l.salonId === sid); const net = ledger.reduce((a, l) => a + l.net, 0);
  const [rk, setRk] = useState<'economico' | 'ultima'>('economico'); const [rh, setRh] = useState(16); const [rp, setRp] = useState(25);
  const [base, setBase] = useState(salon.services[0].base); const [sd, setSd] = useState(25);
  const [code, setCode] = useState(''); const [msg, setMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const client = priceFor(base, sd); const fee = +(client * 0.12).toFixed(2);
  const confirmed = st.bookings.filter((b) => b.salonId === sid && b.status === 'CONFIRMED');
  const doCheck = (c: string) => { const r = checkIn(c, sid); setMsg(r); toast({ title: r.ok ? 'Check-in feito' : 'Check-in recusado', description: r.msg, variant: r.ok ? 'default' : 'destructive' }); };
  const inp = 'rounded-xl border border-line bg-white px-3 py-2 text-sm tnum outline-none focus:border-teal';

  return (
    <div className="min-h-[100dvh] w-full max-w-[100vw] bg-porcelain md:min-h-[calc(100dvh-56px)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-forest px-4 py-4 lg:px-8 text-tint">
        <div className="flex items-center gap-4"><Wordmark light /><span className="hidden text-xs sm:inline uppercase tracking-[.2em] text-mint">Painel do Salão</span></div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-mint-3">Salão
            <select data-testid="select-salon" value={sid} onChange={(e) => { setSid(e.target.value); setMsg(null); setBase(SALONS.find((s) => s.id === e.target.value)!.services[0].base); }} className="ml-2 max-w-[200px] rounded-full bg-white/10 px-3 py-2 text-sm text-tint outline-none">
              {SALONS.map((s) => <option key={s.id} value={s.id} className="text-ink">{s.name}</option>)}
            </select>
          </label>
          <button data-testid="button-view-as-client" onClick={() => navigate(`/salao/${sid}`)} className="flex items-center gap-1.5 rounded-full bg-mint px-4 py-2 text-xs font-bold text-forest"><Eye className="h-3.5 w-3.5" />Ver como Cliente</button>
          <button onClick={() => { resetDemo(); toast({ title: 'Demo reiniciada' }); }} className="rounded-full border border-white/20 p-2 text-mint-3 md:hidden" aria-label="Reiniciar Demo"><RotateCcw className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 pt-6 lg:grid-cols-4 lg:gap-4 lg:px-8">
        {[{ i: Gauge, l: 'Ocupação hoje', v: `${Math.round((occ / cells.length) * 100)}%` }, { i: Clock3, l: 'Horas ociosas', v: `${idle}h` }, { i: Sparkles, l: 'Regras ativas', v: rules.length }, { i: Wallet, l: 'Receita D+1', v: brl(net) }].map((k) => (
          <div key={k.l} className="rounded-3xl border border-line bg-white p-5" data-testid={`kpi-${k.l}`}><k.i className="h-5 w-5 text-teal" /><p className="mt-3 text-2xl font-semibold text-forest tnum lg:text-3xl">{k.v}</p><p className="text-xs text-muted-ink">{k.l}</p></div>
        ))}
      </div>
      <div className="no-scrollbar flex gap-5 overflow-x-auto border-b border-line px-4 pt-6 lg:px-8">
        {TABS.map((t) => <button key={t} data-testid={`tab-b2b-${t}`} onClick={() => setTab(t)} className={cn('-mb-px shrink-0 border-b-2 pb-3 text-sm font-semibold', tab === t ? 'border-teal text-forest' : 'border-transparent text-muted-ink')}>{t}</button>)}
      </div>
      <div className="px-4 py-6 lg:px-8">
        {tab === TABS[0] && (
          <div className="overflow-x-auto rounded-3xl border border-line bg-white" data-testid="table-chairs">
            <div className="grid min-w-[900px]" style={{ gridTemplateColumns: `200px repeat(${HOURS.length}, 1fr)` }}>
              <div className="bg-tint-2 p-3 text-xs font-semibold text-muted-ink">Cadeira · hoje</div>
              {HOURS.map((h) => <div key={h} className="bg-tint-2 p-3 text-center text-xs font-semibold text-muted-ink tnum">{pad(h)}h</div>)}
              {salon.staff.map((p, pi) => [
                <div key={p.id} className="border-t border-line p-3 text-sm font-medium text-ink">{p.name}<span className="block text-[10px] text-muted-ink">{p.role}</span></div>,
                ...grid[pi].map((c) => (
                  <div key={`${p.id}${c.h}`} className="border-l border-t border-line p-1.5">
                    {c.occ ? <div className="h-full rounded-xl bg-forest py-3 text-center text-[10px] font-semibold text-mint-3">Ocupado</div>
                      : c.disc > 0 ? <div className="h-full rounded-xl bg-mint-3 py-3 text-center text-[10px] font-bold text-forest">regra -{c.disc}%</div>
                      : c.past ? <div className="h-full rounded-xl bg-tint-2 py-3 text-center text-[10px] text-muted-ink">passou</div>
                      : c.h === 18 || c.h === 19 || (new Date().getDay() === 6 && c.h < 12) ? <div className="h-full rounded-xl bg-[#FFFBEB] py-3 text-center text-[10px] text-ink">Alta procura<br />Preço cheio</div>
                      : <button data-testid={`button-activate-${p.id}-${c.h}`} onClick={() => { addRule({ salonId: sid, kind: 'economico', pct: 25, hour: c.h }); toast({ title: `-25% ativado às ${pad(c.h)}h`, description: 'Preço já visível para clientes.' }); }} className="group h-full w-full rounded-xl border border-dashed border-mint-2 py-1.5 text-[10px] text-muted-ink transition hover:bg-tint"><span className="block">ocioso</span><span className="font-bold text-teal group-hover:text-forest">+Ativar -25%</span></button>}
                  </div>
                )),
              ])}
            </div>
          </div>
        )}
        {tab === TABS[1] && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-3xl border border-line bg-white p-5">
              <h3 className="font-display text-xl text-forest">Nova regra</h3>
              <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); addRule({ salonId: sid, kind: rk, pct: rp, hour: rk === 'economico' ? rh : undefined }); toast({ title: 'Regra criada', description: `${rk === 'economico' ? 'Horário Econômico' : 'Última Hora'} -${rp}%` }); }}>
                <label className="block text-xs font-semibold text-ink">Tipo<select data-testid="select-rule-kind" value={rk} onChange={(e) => setRk(e.target.value as 'economico' | 'ultima')} className={cn(inp, 'mt-1 w-full')}><option value="economico">Horário Econômico</option><option value="ultima">Última Hora (até 3h antes)</option></select></label>
                {rk === 'economico' && <label className="block text-xs font-semibold text-ink">Horário<select data-testid="select-rule-hour" value={rh} onChange={(e) => setRh(+e.target.value)} className={cn(inp, 'mt-1 w-full')}>{HOURS.filter((h) => h !== 18 && h !== 19).map((h) => <option key={h} value={h}>{pad(h)}:00</option>)}</select></label>}
                <label className="block text-xs font-semibold text-ink">Desconto: <span className="tnum">{rp}%</span><input data-testid="input-rule-pct" type="range" min={15} max={35} step={5} value={rp} onChange={(e) => setRp(+e.target.value)} className="mt-2 w-full accent-teal" /></label>
                <button data-testid="button-add-rule" className="flex w-full items-center justify-center gap-1 rounded-full bg-forest py-2.5 text-sm font-semibold text-tint"><Plus className="h-4 w-4" />Adicionar regra</button>
                <p className="text-[11px] text-muted-ink">Sábado de manhã e 18h–19h seguem com preço cheio.</p>
              </form>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-line bg-white p-5">
                <h3 className="font-display text-xl text-forest">Regras ativas</h3>
                {rules.length === 0 ? <p className="mt-3 text-sm text-muted-ink">Nenhuma regra extra. Os descontos padrão do salão continuam valendo.</p> : <ul className="mt-3 divide-y divide-line">{rules.map((r) => <li key={r.id} className="flex items-center justify-between py-2 text-sm"><span>{r.kind === 'economico' ? `Horário Econômico · ${pad(r.hour ?? 0)}:00` : 'Última Hora'} <b className="text-teal-deep">-{r.pct}%</b></span><button data-testid={`button-remove-rule-${r.id}`} aria-label="Remover" onClick={() => removeRule(r.id)} className="rounded-full p-1.5 text-coral hover:bg-coral-bg"><Trash2 className="h-4 w-4" /></button></li>)}</ul>}
              </div>
              <div className="rounded-3xl border border-line bg-white p-5">
                <h3 className="font-display text-xl text-forest">Preço ao vivo para clientes · hoje</h3>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">{HOURS.map((h) => { const r = slotDiscount(salon, today, h, st.rules); return <div key={h} className={cn('rounded-xl p-2 text-center text-[11px] tnum', r.disc ? 'bg-tint text-forest' : 'bg-tint-2 text-muted-ink')}><b className="block">{pad(h)}h</b>{brl(priceFor(salon.services[0].base, r.disc))}{r.disc > 0 && <span className="block text-teal-deep">-{r.disc}%</span>}</div>; })}</div>
              </div>
            </div>
          <div className="grid gap-6 lg:col-span-2 lg:grid-cols-2" data-testid="section-simulator">
            <div className="space-y-4 rounded-3xl border border-line bg-white p-5">
              <h3 className="font-display text-xl text-forest">Simule um horário ocioso</h3>
              <label className="block text-xs font-semibold text-ink">Preço base (R$)<input data-testid="input-sim-base" type="number" min={0} value={base} onChange={(e) => setBase(Math.max(0, Number(e.target.value)))} className={cn(inp, 'mt-1 w-full')} /></label>
              <label className="block text-xs font-semibold text-ink">Desconto: {sd}%<input data-testid="input-sim-disc" type="range" min={15} max={35} step={5} value={sd} onChange={(e) => setSd(+e.target.value)} className="mt-2 w-full accent-teal" /></label>
            </div>
            <div className="rounded-3xl bg-forest p-6 text-tint tnum">
              {[['Preço base', brl(base)], ['Cliente paga', brl(client)], ['Taxa BeautyPass (12%)', `-${brl(fee)}`]].map(([a, b]) => <p key={a} className="flex justify-between border-b border-white/10 py-2 text-sm"><span className="text-mint-3">{a}</span><span>{b}</span></p>)}
              <p className="mt-4 text-xs text-mint">Você recebe em D+1</p><p className="text-4xl font-semibold" data-testid="text-sim-net">{brl(client - fee)}</p>
              <p className="mt-2 text-sm text-mint-3">vs. <b className="text-tint">R$ 0,00</b> com a cadeira vazia.</p>
            </div>
          </div>
          </div>
        )}
        {tab === TABS[2] && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <form className="rounded-3xl border border-line bg-white p-5" onSubmit={(e) => { e.preventDefault(); doCheck(code); }}>
                <h3 className="flex items-center gap-2 font-display text-xl text-forest"><ScanLine className="h-5 w-5 text-teal" />Validar voucher</h3>
                <div className="mt-3 flex gap-2"><label className="sr-only" htmlFor="code">Código</label><input id="code" data-testid="input-checkin-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="BP-108420" className={cn(inp, 'flex-1 uppercase')} /><button data-testid="button-checkin" className="rounded-full bg-forest px-5 text-sm font-semibold text-tint">Validar</button></div>
                {msg && <p role="status" data-testid="text-checkin-result" className={cn('mt-3 flex items-center gap-2 rounded-xl p-3 text-sm', msg.ok ? 'bg-tint text-forest' : 'bg-coral-bg text-coral')}>{msg.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{msg.msg}</p>}
              </form>
              <div className="rounded-3xl border border-line bg-white p-5">
                <h3 className="font-display text-xl text-forest">Chegando hoje e próximos</h3>
                {confirmed.length === 0 ? <p className="mt-2 text-sm text-muted-ink">Nenhuma reserva confirmada para este salão.</p> : confirmed.map((b) => <div key={b.code} className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-tint-2 p-3"><QR value={b.code} size={56} /><div className="flex-1 text-sm"><b className="text-forest">{b.code}</b><p className="text-xs text-muted-ink tnum">{b.date.split('-').reverse().join('/')} · {pad(b.hour)}:00 · {brl(b.final + b.fee)}</p>{b.notes && <p className="text-[11px] text-ink">Obs.: {b.notes}</p>}</div><button data-testid={`button-oneclick-${b.code}`} onClick={() => doCheck(b.code)} className="rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-tint">Check-in QR</button></div>)}
              </div>
            </div>
            <div className="rounded-3xl border border-line bg-white p-5">
              <h3 className="font-display text-xl text-forest">Receita D+1</h3>
              <p className="mt-1 text-3xl font-semibold text-forest tnum">{brl(net)}</p>
              {ledger.length === 0 ? <p className="mt-3 text-sm text-muted-ink">Sem check-ins ainda. Cada voucher validado aparece aqui com repasse no dia seguinte.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[420px] text-sm tnum"><thead><tr className="text-left text-xs text-muted-ink"><th className="pb-2">Voucher</th><th>Bruto</th><th>Taxa 12%</th><th>Líquido</th></tr></thead><tbody>{ledger.map((l) => <tr key={l.code} className="border-t border-line"><td className="py-2 font-semibold text-forest">{l.code}</td><td>{brl(l.gross)}</td><td className="text-coral">-{brl(l.platform)}</td><td className="font-semibold">{brl(l.net)}</td></tr>)}</tbody></table></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
