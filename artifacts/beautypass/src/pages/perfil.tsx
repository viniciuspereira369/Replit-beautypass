import { useMemo } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { PiggyBank, CalendarCheck, Heart, Briefcase, RotateCcw, ShieldCheck, ChevronRight, HardDrive, QrCode, CreditCard, Check, BadgeCheck, CalendarX } from 'lucide-react';
import { brl } from '@/lib/pricing';
import { resetDemo, setPreferredPayment, totalSaved, useStore, type Payment } from '@/lib/store';
import { MEDIA } from '@/lib/media';
import { Emblem, Portrait } from '@/components/art';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PAYS: { id: Payment; title: string; sub: string; icon: typeof QrCode }[] = [
  { id: 'pix', title: 'Pix Instantâneo', sub: 'QR Code e copia e cola', icon: QrCode },
  { id: 'card', title: 'Cartão de Crédito', sub: 'Simulado nesta demo', icon: CreditCard },
];

export default function PerfilPage() {
  const st = useStore(); const { toast } = useToast(); const u = st.user;
  const total = st.bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED').length;
  const saved = totalSaved(st);
  const storage = useMemo(() => { const keys = Object.keys(localStorage).filter((k) => k.startsWith('bp')); return { keys: keys.length, kb: keys.reduce((a, k) => a + (localStorage.getItem(k)?.length ?? 0), 0) / 1024 }; }, [st]);
  const metrics = [
    { icon: PiggyBank, v: brl(saved), l: 'Economia acumulada', id: 'text-saved' },
    { icon: CalendarCheck, v: String(total), l: 'Agendamentos', id: 'text-bookings-count' },
    { icon: Heart, v: String(st.favorites.length), l: 'Favoritos', id: 'text-favorites-count' },
  ];
  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative overflow-hidden bg-gradient-to-br from-forest via-[#0F4A40] to-teal-deep px-5 pb-24 pt-6 text-white">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-mint/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <Portrait src={MEDIA.camila} name={u.name} className="h-14 w-14 ring-[3px] ring-mint/60" />
          <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-mint">Passaporte & Economia</p><h1 className="font-display text-[28px] font-semibold leading-tight" data-testid="text-profile-name">{u.name}</h1><p className="text-xs text-white/70">Pinheiros, São Paulo</p></div>
        </div>
      </div>
      <div className="relative -mt-20 px-5 pb-8">
        <motion.div initial={{ opacity: 0, y: 16, rotateX: 8 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 18 }}
          className="relative overflow-hidden rounded-[28px] border border-white/40 p-5 text-white shadow-[0_30px_60px_-30px_rgba(12,45,38,.8)]" style={{ backgroundImage: 'linear-gradient(135deg, rgba(18,62,53,.96), rgba(0,104,95,.9))' }} data-testid="card-passport">
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-mint/25 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.25em] text-mint">Passaporte BeautyPass</p>
              <p className="mt-1 font-display text-xl font-semibold">{u.name}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-forest" data-testid="text-access-pill"><BadgeCheck className="h-3.5 w-3.5 text-teal" />Acesso Gratuito · Pague apenas por agendamento</span>
            </div>
            <Emblem className="h-10 w-10 shrink-0" light />
          </div>
          <div className="relative mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-white/15 bg-white/10 p-3 tnum">
            {metrics.map((m) => <div key={m.id}><m.icon className="h-4 w-4 text-mint" /><p className="mt-1 text-lg font-bold" data-testid={m.id}>{m.v}</p><p className="text-[10px] text-white/70">{m.l}</p></div>)}
          </div>
          <div className="relative mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/75">
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-mint" />R$ 0 de mensalidade</span>
            <span className="flex items-center gap-1"><CalendarX className="h-3 w-3 text-mint" />Cancelamento grátis até 24h antes</span>
          </div>
        </motion.div>

        <h2 className="tight mt-6 text-base font-bold text-forest">Pagamento preferido</h2>
        <p className="text-xs text-muted-ink">Já vem selecionado no checkout. Você paga só quando agenda.</p>
        <div role="radiogroup" aria-label="Pagamento preferido" className="mt-2 grid grid-cols-2 gap-2" data-testid="card-payment-preference">
          {PAYS.map((p) => { const on = (u.preferredPayment ?? 'pix') === p.id; return (
            <motion.button whileTap={{ scale: 0.96 }} key={p.id} role="radio" aria-checked={on} data-testid={`button-pref-${p.id}`}
              onClick={() => { if (!on) { setPreferredPayment(p.id); toast({ title: 'Preferência salva', description: p.title }); } }}
              className={cn('relative flex items-center gap-2.5 rounded-[20px] border p-3 text-left transition', on ? 'border-forest bg-forest text-white' : 'border-line bg-white text-ink hover:border-mint-2')}>
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', on ? 'bg-white/10 text-mint' : 'bg-tint text-teal-deep')}><p.icon className="h-4 w-4" /></span>
              <span className="min-w-0"><b className="block text-[13px]">{p.title}</b><span className={cn('text-[10px]', on ? 'text-white/70' : 'text-muted-ink')}>{p.sub}</span></span>
              {on && <Check className="absolute right-3 top-3 h-3.5 w-3.5 text-mint" />}
            </motion.button>); })}
        </div>

        <Link href="/painel" data-testid="link-b2b" className="mt-6 flex items-center gap-3 rounded-[24px] bg-forest p-4 text-white shadow-[0_16px_30px_-18px_rgba(18,62,53,.8)] transition active:scale-[.98]">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><Briefcase className="h-5 w-5 text-mint" /></span>
          <span className="flex-1"><b className="tight block text-[15px]">Abrir Painel do Salão Parceiro</b><span className="text-[11px] text-white/70">B2B · regras dinâmicas, check-in QR e receita</span></span>
          <ChevronRight className="h-5 w-5 text-mint" />
        </Link>

        <section className="mt-6 rounded-[24px] border border-line bg-white p-4" data-testid="card-privacy">
          <p className="tight flex items-center gap-2 text-base font-bold text-forest"><ShieldCheck className="h-5 w-5 text-economy" />Privacidade · LGPD</p>
          <p className="mt-1 text-xs text-ink">Esta demonstração não usa servidor: reservas, avaliações e preferências ficam somente no armazenamento local deste navegador. Nada é enviado a terceiros e não há cobrança real.</p>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-ink tnum"><HardDrive className="h-3.5 w-3.5" />{storage.keys} chave{storage.keys === 1 ? '' : 's'} locais · {storage.kb.toFixed(1).replace('.', ',')} KB</p>
          <button data-testid="button-reset-profile" onClick={() => { resetDemo(); toast({ title: 'Dados locais apagados', description: 'Demo reiniciada.' }); }} className="mt-3 flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-semibold text-ink transition hover:bg-tint"><RotateCcw className="h-3.5 w-3.5" />Apagar dados e reiniciar demo</button>
        </section>
      </div>
    </div>
  );
}
