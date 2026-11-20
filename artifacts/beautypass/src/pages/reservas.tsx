import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { motion } from 'framer-motion';
import { CalendarCheck, X, Navigation, Star, QrCode, Home as HomeIcon, BadgeCheck } from 'lucide-react';
import { getSalon } from '@/lib/data';
import { brl, fmtDate, pad, slotStart } from '@/lib/pricing';
import { cancelBooking, cancelPolicy, useStore, type Booking } from '@/lib/store';
import { categoryPhoto } from '@/lib/media';
import { Voucher, STATUS_PT } from '@/components/voucher';
import { Empty, PageHeader } from '@/components/shell';
import { Photo } from '@/components/art';
import { ReviewModal } from '@/components/review-modal';
import { Celebration } from '@/components/celebration';
import { walkMin } from '@/components/salon-card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const REASONS = ['Mudei de planos', 'Encontrei opção melhor', 'Emergência', 'Preço ficou alto demais', 'Outro'];

function CancelModal({ b, onClose }: { b: Booking; onClose: () => void }) {
  const [r, setR] = useState(''); const [txt, setTxt] = useState(''); const { toast } = useToast();
  const p = cancelPolicy(b); const ok = r && (r !== 'Outro' || txt.trim().length > 2);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest/40 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="cancel-title" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="rise max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-5">
        <div className="flex items-center justify-between"><h2 id="cancel-title" className="tight text-xl font-bold text-forest">Cancelar <span className="font-mono">{b.code}</span></h2><button aria-label="Fechar" onClick={onClose} className="rounded-full bg-tint p-1.5"><X className="h-4 w-4" /></button></div>
        <div className={cn('mt-3 rounded-2xl p-3 text-xs tnum', p.free ? 'bg-economy-bg text-forest' : 'bg-coral-bg text-coral')} data-testid="text-cancel-policy">
          {p.free ? <>Faltam mais de 24h. Cancelamento gratuito: reembolso integral de {brl(p.refund)}.</> : <>Faltam menos de 24h. Multa de 30% ({brl(p.fee)}). Reembolso de {brl(p.refund)}{b.payment === 'credits' ? ` (${Math.round(p.refund)} BC)` : ''}.</>}
        </div>
        <fieldset className="mt-4 space-y-2"><legend className="mb-1 text-xs font-semibold text-ink">Motivo</legend>
          {REASONS.map((x) => <label key={x} className={cn('flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm', r === x ? 'border-teal bg-tint' : 'border-line bg-white')}><input type="radio" name="reason" value={x} checked={r === x} onChange={() => setR(x)} data-testid={`radio-reason-${x}`} className="accent-teal" />{x}</label>)}
        </fieldset>
        {r === 'Outro' && <label className="mt-2 block text-xs text-ink">Conte o motivo *<textarea data-testid="input-cancel-other" value={txt} onChange={(e) => setTxt(e.target.value)} required className="mt-1 w-full rounded-xl border border-line p-2 text-sm" /></label>}
        <button data-testid="button-cancel-confirm" disabled={!ok} onClick={() => { cancelBooking(b.code, r === 'Outro' ? `Outro: ${txt.trim()}` : r); toast({ title: 'Reserva cancelada', description: `Reembolso de ${brl(p.refund)}` }); onClose(); }} className="mt-4 w-full rounded-full bg-coral py-3 text-sm font-bold text-white disabled:opacity-40">Confirmar cancelamento</button>
      </div>
    </div>
  );
}

export default function ReservasPage() {
  const st = useStore(); const [tab, setTab] = useState<'open' | 'hist'>('open');
  const [voucher, setVoucher] = useState<Booking | null>(null); const [cancel, setCancel] = useState<Booking | null>(null); const [review, setReview] = useState<Booking | null>(null);
  const open = st.bookings.filter((b) => b.status === 'CONFIRMED');
  const hist = st.bookings.filter((b) => b.status !== 'CONFIRMED');
  const list = [...(tab === 'open' ? open : hist)].sort((a, b) => slotStart(a.date, a.hour).getTime() - slotStart(b.date, b.hour).getTime());
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Agenda" title="Reservas"><p className="text-sm text-muted-ink">Suas reservas BeautyPass</p></PageHeader>
      <div className="relative mx-5 mt-4 grid grid-cols-2 rounded-full border border-line bg-white p-1">
        {([['open', `Em Aberto (${open.length})`], ['hist', `Histórico (${hist.length})`]] as const).map(([v, l]) => <button key={v} data-testid={`tab-${v}`} aria-pressed={tab === v} onClick={() => setTab(v)} className={cn('relative rounded-full py-2 text-xs font-bold', tab === v ? 'text-white' : 'text-muted-ink')}>{tab === v && <motion.span layoutId="res-tab" className="absolute inset-0 rounded-full bg-forest" />}<span className="relative">{l}</span></button>)}
      </div>
      <div className="space-y-3 px-5 pt-4">
        {list.length === 0 && <Empty icon={CalendarCheck} title={tab === 'open' ? 'Nenhuma reserva em aberto' : 'Histórico vazio'} text="Horários econômicos aparecem todos os dias. Que tal um encaixe?" action={<Link href="/pedir" className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white">Pedir Agora</Link>} />}
        {list.map((b, i) => { const s = getSalon(b.salonId)!; const canReview = b.status === 'COMPLETED' && !b.reviewed; return (
          <motion.div key={b.code} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }} className="rounded-[24px] border border-line bg-white p-4" data-testid={`card-booking-${b.code}`}>
            <div className="flex items-start gap-3">
              <Photo src={categoryPhoto(s.category)} alt={s.name} className="h-[54px] w-[54px] shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1"><p className="tight truncate text-base font-bold text-forest">{s.name}</p><p className="text-xs capitalize text-muted-ink tnum">{fmtDate(b.date)} · {pad(b.hour)}:00 · <span className="font-mono normal-case">{b.code}</span></p></div>
              <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold', STATUS_PT[b.status].c)}>{STATUS_PT[b.status].t}</span>
            </div>
            {b.notes && <p className="mt-2 rounded-xl bg-amber-bg p-2 text-xs text-ink">Obs.: {b.notes}</p>}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="tnum">{b.disc > 0 && <s className="mr-1 text-xs text-strike">{brl(b.base)}</s>}<b className="text-forest">{brl(b.final + b.fee)}</b>{b.disc > 0 && <span className="ml-1 text-xs font-semibold text-economy">-{b.disc}%</span>}</p>
              <div className="flex flex-wrap gap-2">
                <button data-testid={`button-voucher-${b.code}`} onClick={() => setVoucher(b)} className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink"><QrCode className="h-3.5 w-3.5" />Ver QR Code & Voucher</button>
                {b.status === 'CONFIRMED' && <button data-testid={`button-cancel-${b.code}`} onClick={() => setCancel(b)} className="rounded-full bg-coral-bg px-3 py-1.5 text-xs font-semibold text-coral">Cancelar</button>}
                {canReview && <button data-testid={`button-review-${b.code}`} onClick={() => setReview(b)} className="flex items-center gap-1 rounded-full bg-amber-bg px-3 py-1.5 text-xs font-bold text-[#92400E]"><Star className="h-3.5 w-3.5 fill-gold text-gold" />Avaliar Experiência</button>}
                {b.status === 'COMPLETED' && b.reviewed && <span className="flex items-center gap-1 rounded-full bg-economy-bg px-3 py-1.5 text-xs font-semibold text-economy" data-testid={`text-reviewed-${b.code}`}><BadgeCheck className="h-3.5 w-3.5" />Avaliada</span>}
                {b.status !== 'CONFIRMED' && <Link href={`/salao/${s.id}`} className="rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-white">Reservar de novo</Link>}
              </div>
            </div>
          </motion.div>); })}
      </div>
      {voucher && <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Voucher" onClick={() => setVoucher(null)} onKeyDown={(e) => e.key === 'Escape' && setVoucher(null)}><div className="rise max-h-[90vh] w-full max-w-sm overflow-y-auto" onClick={(e) => e.stopPropagation()}><Voucher b={st.bookings.find((x) => x.code === voucher.code) ?? voucher} /><button autoFocus data-testid="button-voucher-close" onClick={() => setVoucher(null)} className="mt-3 w-full rounded-full bg-white py-2.5 text-sm font-semibold text-forest">Fechar</button></div></div>}
      {cancel && <CancelModal b={cancel} onClose={() => setCancel(null)} />}
      <ReviewModal b={review} onClose={() => setReview(null)} />
    </div>
  );
}

export function ConfirmadoPage() {
  const { code } = useParams<{ code: string }>(); const st = useStore(); const b = st.bookings.find((x) => x.code === code);
  const [burst] = useState(() => { if (!b || Date.now() - b.createdAt > 120000) return false; const k = `bpui:celebrated:${code}`; if (sessionStorage.getItem(k)) return false; sessionStorage.setItem(k, '1'); return true; });
  if (!b) return <div className="px-5 pt-10"><Empty icon={CalendarCheck} title="Voucher não encontrado" text="Talvez a demo tenha sido reiniciada." action={<Link href="/reservas" className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white">Ver reservas</Link>} /></div>;
  const s = getSalon(b.salonId)!;
  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <div className="mb-4 flex flex-col items-center text-center"><Celebration burst={burst} /><h1 className="mt-3 font-display text-3xl font-semibold text-forest">Tudo certo, Camila.</h1><p className="text-sm text-muted-ink">Apresente o QR na recepção para o check-in.</p></div>
      <Voucher b={b} />
      <div className="mt-4 rounded-[24px] border border-line bg-white p-4 text-sm">
        <p className="tight font-bold text-forest">Itinerário</p>
        <ol className="mt-2 space-y-1 text-xs text-ink"><li>1. Saia de Pinheiros com {walkMin(s.distanceKm)} min a pé ({s.distanceKm.toString().replace('.', ',')} km).</li><li>2. Chegue 10 min antes, às {pad(b.hour - 1)}:50.</li><li>3. Mostre o voucher <span className="font-mono">{b.code}</span> na recepção.</li></ol>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/mapa" data-testid="link-to-map" className="flex items-center justify-center gap-1 rounded-full border border-line bg-white py-3 text-xs font-bold text-forest"><Navigation className="h-3.5 w-3.5" />Ver rota</Link>
        <Link href="/reservas" data-testid="link-to-reservas" className="flex items-center justify-center gap-1 rounded-full bg-forest py-3 text-xs font-bold text-white"><HomeIcon className="h-3.5 w-3.5" />Minhas reservas</Link>
      </div>
    </div>
  );
}
