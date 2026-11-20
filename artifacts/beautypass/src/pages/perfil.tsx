import { Link } from 'wouter';
import { Crown, Coins, PiggyBank, CalendarCheck, Briefcase, RotateCcw, Check } from 'lucide-react';
import { PLANS, TOPUPS, type PlanName } from '@/lib/data';
import { brl } from '@/lib/pricing';
import { addCredits, resetDemo, switchPlan, useStore } from '@/lib/store';
import { Emblem } from '@/components/art';
import { PageHeader } from '@/components/shell';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function PerfilPage() {
  const st = useStore(); const { toast } = useToast(); const u = st.user;
  const total = st.bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED').length;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Passaporte" title="Perfil" />
      <div className="px-5 pt-4">
        <div className="rise relative overflow-hidden rounded-[28px] bg-gradient-to-br from-forest via-teal-deep to-forest p-5 text-tint shadow-xl" data-testid="card-vip">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-mint/20 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div><p className="text-[10px] uppercase tracking-[.25em] text-mint">BeautyPass · {u.plan}</p><p className="mt-1 font-display text-2xl">{u.name}</p><p className="text-xs text-mint-3">Pinheiros, São Paulo</p></div>
            <Emblem className="h-10 w-10" light />
          </div>
          <div className="relative mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-white/10 p-3 backdrop-blur tnum">
            <div><Coins className="h-4 w-4 text-mint" /><p className="mt-1 text-lg font-bold" data-testid="text-credits">{u.credits}</p><p className="text-[10px] text-mint-3">créditos = {brl(u.credits)}</p></div>
            <div><PiggyBank className="h-4 w-4 text-mint" /><p className="mt-1 text-lg font-bold" data-testid="text-saved">{brl(u.saved)}</p><p className="text-[10px] text-mint-3">economizados</p></div>
            <div><CalendarCheck className="h-4 w-4 text-mint" /><p className="mt-1 text-lg font-bold">{total}</p><p className="text-[10px] text-mint-3">reservas</p></div>
          </div>
          <p className="relative mt-3 text-[10px] text-mint-3">1 BeautyCredit = R$ 1</p>
        </div>

        <h2 className="mt-6 font-display text-xl text-forest">Seu plano</h2>
        <div className="mt-2 grid gap-3 @xl:grid-cols-2">
          {(Object.keys(PLANS) as PlanName[]).map((p) => { const d = PLANS[p]; const on = u.plan === p; return (
            <div key={p} className={cn('rounded-3xl border p-4', on ? 'border-teal bg-tint' : 'border-line bg-white')} data-testid={`card-plan-${p}`}>
              <p className="flex items-center gap-1.5 font-display text-lg text-forest">{p === 'Black VIP' && <Crown className="h-4 w-4 text-gold" />}{p}</p>
              <p className="tnum"><b className="text-2xl text-forest">{brl(d.price)}</b><span className="text-xs text-muted-ink">/mês</span></p>
              <ul className="mt-2 space-y-1 text-xs text-ink"><li className="flex gap-1"><Check className="h-3.5 w-3.5 text-teal" />{d.credits} créditos por mês</li><li className="flex gap-1"><Check className="h-3.5 w-3.5 text-teal" />{d.vouchers} vouchers de encaixe</li></ul>
              <button data-testid={`button-plan-${p}`} disabled={on} onClick={() => { switchPlan(p); toast({ title: `Plano ${p} ativado`, description: `+${d.credits} créditos (simulado)` }); }} className="mt-3 w-full rounded-full bg-forest py-2 text-xs font-semibold text-tint disabled:bg-mint-3 disabled:text-forest">{on ? 'Plano atual' : 'Mudar para este'}</button>
            </div>); })}
        </div>

        <h2 className="mt-6 font-display text-xl text-forest">Recarregar créditos</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {TOPUPS.map((t) => <button key={t.credits} data-testid={`button-topup-${t.credits}`} onClick={() => { addCredits(t.credits); toast({ title: `+${t.credits} BeautyCredits`, description: `Pagamento simulado de ${brl(t.price)}` }); }} className="rounded-2xl border border-line bg-white p-3 text-left transition hover:border-teal active:scale-95 tnum"><b className="block text-lg text-forest">+{t.credits}</b><span className="text-xs text-muted-ink">{brl(t.price)}</span>{t.credits > 50 && <span className="mt-1 block text-[10px] font-semibold text-teal-deep">{Math.round((1 - t.price / t.credits) * 100)}% bônus</span>}</button>)}
        </div>

        <div className="mt-6 grid gap-2">
          <Link href="/painel" data-testid="link-b2b" className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-sm font-semibold text-forest"><Briefcase className="h-4 w-4 text-teal" />Painel Salão B2B</Link>
          <button data-testid="button-reset-profile" onClick={() => { resetDemo(); toast({ title: 'Demo reiniciada' }); }} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-sm font-semibold text-ink"><RotateCcw className="h-4 w-4 text-muted-ink" />Reiniciar Demo</button>
        </div>
      </div>
    </div>
  );
}
