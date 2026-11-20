import { useMemo } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Crown, Coins, PiggyBank, CalendarCheck, Briefcase, RotateCcw, Check, ShieldCheck, ChevronRight, HardDrive } from 'lucide-react';
import { PLANS, TOPUPS, type PlanName } from '@/lib/data';
import { brl } from '@/lib/pricing';
import { addCredits, resetDemo, switchPlan, useStore } from '@/lib/store';
import { MEDIA } from '@/lib/media';
import { Emblem, Portrait } from '@/components/art';
import { FulfillmentToggle } from '@/components/fulfillment-toggle';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function PerfilPage() {
  const st = useStore(); const { toast } = useToast(); const u = st.user;
  const total = st.bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED').length;
  const storage = useMemo(() => { const keys = Object.keys(localStorage).filter((k) => k.startsWith('bp')); return { keys: keys.length, kb: keys.reduce((a, k) => a + (localStorage.getItem(k)?.length ?? 0), 0) / 1024 }; }, [st]);
  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative overflow-hidden bg-gradient-to-br from-forest via-[#0F4A40] to-teal-deep px-5 pb-24 pt-6 text-white">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-mint/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <Portrait src={MEDIA.camila} name={u.name} className="h-14 w-14 ring-[3px] ring-mint/60" />
          <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-mint">Passaporte · Ajustes</p><h1 className="font-display text-[28px] font-semibold leading-tight" data-testid="text-profile-name">{u.name}</h1><p className="text-xs text-white/70">Pinheiros, São Paulo</p></div>
        </div>
      </div>
      <div className="relative -mt-20 px-5">
        <motion.div initial={{ opacity: 0, y: 16, rotateX: 8 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 18 }}
          className="relative overflow-hidden rounded-[28px] border border-white/40 bg-white/15 p-5 text-white shadow-[0_30px_60px_-30px_rgba(12,45,38,.8)] backdrop-blur-xl" style={{ backgroundImage: 'linear-gradient(135deg, rgba(18,62,53,.92), rgba(0,104,95,.85))' }} data-testid="card-vip">
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-mint/25 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[.25em] text-mint">BeautyPass {u.plan === 'Black VIP' ? 'Black VIP' : 'Essencial'}</p><p className="mt-1 font-mono text-sm tracking-[.2em] text-white/80">•••• 0412</p></div>
            <Emblem className="h-10 w-10" light />
          </div>
          <div className="relative mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-white/15 bg-white/10 p-3 tnum">
            <div><Coins className="h-4 w-4 text-mint" /><p className="mt-1 text-lg font-bold" data-testid="text-credits">{u.credits}</p><p className="text-[10px] text-white/70">créditos = {brl(u.credits)}</p></div>
            <div><PiggyBank className="h-4 w-4 text-mint" /><p className="mt-1 text-lg font-bold" data-testid="text-saved">{brl(u.saved)}</p><p className="text-[10px] text-white/70">economizados</p></div>
            <div><CalendarCheck className="h-4 w-4 text-mint" /><p className="mt-1 text-lg font-bold">{total}</p><p className="text-[10px] text-white/70">reservas</p></div>
          </div>
          <p className="relative mt-3 text-[10px] text-white/70">1 BeautyCredit = R$ 1</p>
        </motion.div>

        <Link href="/painel" data-testid="link-b2b" className="mt-4 flex items-center gap-3 rounded-[24px] bg-forest p-4 text-white shadow-[0_16px_30px_-18px_rgba(18,62,53,.8)] transition active:scale-[.98]">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><Briefcase className="h-5 w-5 text-mint" /></span>
          <span className="flex-1"><b className="tight block text-[15px]">Abrir Painel do Salão Parceiro</b><span className="text-[11px] text-white/70">B2B · regras dinâmicas, check-in QR e receita</span></span>
          <ChevronRight className="h-5 w-5 text-mint" />
        </Link>

        <h2 className="tight mt-6 text-base font-bold text-forest">Preferência de atendimento</h2>
        <div className="mt-2"><FulfillmentToggle id="perfil" /></div>

        <h2 className="tight mt-6 text-base font-bold text-forest">Seu plano</h2>
        <div className="mt-2 grid gap-3 @xl:grid-cols-2">
          {(Object.keys(PLANS) as PlanName[]).map((p) => { const d = PLANS[p]; const on = u.plan === p; return (
            <div key={p} className={cn('rounded-[24px] border p-4', on ? 'border-teal bg-tint' : 'border-line bg-white')} data-testid={`card-plan-${p}`}>
              <p className="tight flex items-center gap-1.5 text-lg font-bold text-forest">{p === 'Black VIP' && <Crown className="h-4 w-4 text-gold" />}{p}</p>
              <p className="tnum"><b className="text-2xl text-forest">{brl(d.price)}</b><span className="text-xs text-muted-ink">/mês</span></p>
              <ul className="mt-2 space-y-1 text-xs text-ink"><li className="flex gap-1"><Check className="h-3.5 w-3.5 text-teal" />{d.credits} créditos por mês</li><li className="flex gap-1"><Check className="h-3.5 w-3.5 text-teal" />{d.vouchers} vouchers de encaixe</li></ul>
              <button data-testid={`button-plan-${p}`} disabled={on} onClick={() => { switchPlan(p); toast({ title: `Plano ${p} ativado`, description: `+${d.credits} créditos (simulado)` }); }} className="mt-3 w-full rounded-full bg-forest py-2 text-xs font-semibold text-white transition active:scale-[.98] disabled:bg-mint-3 disabled:text-forest">{on ? 'Plano atual' : 'Mudar para este'}</button>
            </div>); })}
        </div>

        <h2 className="tight mt-6 text-base font-bold text-forest">Recarregar créditos</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {TOPUPS.map((t) => <motion.button whileTap={{ scale: 0.94 }} key={t.credits} data-testid={`button-topup-${t.credits}`} onClick={() => { addCredits(t.credits); toast({ title: `+${t.credits} BeautyCredits`, description: `Pagamento simulado de ${brl(t.price)}` }); }} className="rounded-2xl border border-line bg-white p-3 text-left transition hover:border-teal tnum"><b className="block text-lg text-forest">+{t.credits}</b><span className="text-xs text-muted-ink">{brl(t.price)}</span>{t.credits > 50 && <span className="mt-1 block text-[10px] font-bold text-economy">{Math.round((1 - t.price / t.credits) * 100)}% bônus</span>}</motion.button>)}
        </div>

        <section className="mt-6 rounded-[24px] border border-line bg-white p-4" data-testid="card-privacy">
          <p className="tight flex items-center gap-2 text-base font-bold text-forest"><ShieldCheck className="h-5 w-5 text-economy" />Privacidade · LGPD</p>
          <p className="mt-1 text-xs text-ink">Esta demonstração não usa servidor: reservas, créditos, avaliações e preferências ficam somente no armazenamento local deste navegador. Nada é enviado a terceiros e não há cobrança real.</p>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-ink tnum"><HardDrive className="h-3.5 w-3.5" />{storage.keys} chave{storage.keys === 1 ? '' : 's'} locais · {storage.kb.toFixed(1).replace('.', ',')} KB</p>
          <button data-testid="button-reset-profile" onClick={() => { resetDemo(); toast({ title: 'Dados locais apagados', description: 'Demo reiniciada.' }); }} className="mt-3 flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-semibold text-ink transition hover:bg-tint"><RotateCcw className="h-3.5 w-3.5" />Apagar dados e reiniciar demo</button>
        </section>
      </div>
    </div>
  );
}
