import { MapPin, Clock, User, StickyNote, Footprints } from 'lucide-react';
import { getSalon } from '@/lib/data';
import { brl, fmtDate, kindLabel, pad } from '@/lib/pricing';
import type { Booking } from '@/lib/store';
import { categoryPhoto } from '@/lib/media';
import { QR, Emblem, Photo } from './art';
import { walkMin } from './salon-card';

export const STATUS_PT: Record<string, { t: string; c: string }> = {
  CONFIRMED: { t: 'Confirmada', c: 'bg-economy-bg text-economy' }, COMPLETED: { t: 'Concluída', c: 'bg-tint text-forest' },
  CANCELLED_BY_USER: { t: 'Cancelada por você', c: 'bg-coral-bg text-coral' }, CANCELLED_BY_MERCHANT: { t: 'Cancelada pelo salão', c: 'bg-coral-bg text-coral' },
};

/** Boarding-pass style voucher. */
export function Voucher({ b }: { b: Booking }) {
  const s = getSalon(b.salonId)!; const services = s.services.filter((x) => b.serviceIds.includes(x.id));
  const staff = s.staff.find((p) => p.id === b.staffId); const lbl = kindLabel(b.kind);
  return (
    <div className="overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_24px_50px_-30px_rgba(18,62,53,.55)]" data-testid={`voucher-${b.code}`}>
      <div className="relative bg-gradient-to-br from-forest to-teal-deep px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-mint">Voucher BeautyPass</p><p className="font-mono text-xl font-semibold tracking-wider" data-testid="text-voucher-code">{b.code}</p></div>
          <Emblem className="h-9 w-9" light />
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs">
          <div><p className="text-white/60">Saída</p><b>Pinheiros</b></div>
          <div className="flex flex-1 items-center gap-1 text-mint"><span className="h-px flex-1 border-t border-dashed border-mint/60" /><Footprints className="h-3.5 w-3.5" /><span className="tnum">{walkMin(s.distanceKm)} min</span><span className="h-px flex-1 border-t border-dashed border-mint/60" /></div>
          <div className="text-right"><p className="text-white/60">Chegada</p><b>{s.hood}</b></div>
        </div>
      </div>
      <div className="relative flex flex-col items-center gap-2 border-b-2 border-dashed border-line p-5">
        <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-porcelain" /><span className="absolute -bottom-3 -right-3 h-6 w-6 rounded-full bg-porcelain" />
        <div className="rounded-3xl bg-gradient-to-br from-tint to-economy-bg p-3"><QR value={b.code} size={150} /></div>
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${STATUS_PT[b.status].c}`}>{STATUS_PT[b.status].t}</span>
      </div>
      <div className="space-y-2 p-5 text-sm text-ink">
        <div className="flex items-center gap-3"><Photo src={categoryPhoto(s.category)} alt={s.name} className="h-11 w-11 shrink-0 rounded-xl" /><p className="tight text-lg font-bold text-forest">{s.name}</p></div>
        <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-teal" /><span className="capitalize">{fmtDate(b.date)}</span> · <span className="tnum">{pad(b.hour)}:00</span></p>
        <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-teal" />{s.address}, {s.hood} · São Paulo</p>
        <p className="flex items-center gap-2"><User className="h-4 w-4 text-teal" />{staff ? staff.name : 'Qualquer Profissional'}</p>
        <p className="text-xs text-muted-ink">{services.map((x) => x.name).join(' + ')}</p>
        {b.notes && <p className="flex items-start gap-2 rounded-xl bg-amber-bg p-2.5 text-xs"><StickyNote className="mt-0.5 h-3.5 w-3.5 text-gold" />{b.notes}</p>}
        <div className="flex items-end justify-between border-t border-line pt-3 tnum">
          <span className="text-xs text-muted-ink">{lbl && b.disc > 0 ? `${lbl.title} -${b.disc}%` : 'Preço padrão'}</span>
          <span>{b.disc > 0 && <s className="mr-1 text-xs text-strike">{brl(b.base)}</s>}<b className="text-forest">{brl(b.final)}</b></span>
        </div>
        {b.cancelReason && <p className="text-xs text-coral">Motivo: {b.cancelReason} · multa {brl(b.cancelFee ?? 0)} · reembolso {brl(b.refund ?? 0)}</p>}
      </div>
    </div>
  );
}
