import { MapPin, Clock, User, StickyNote } from 'lucide-react';
import { getSalon } from '@/lib/data';
import { brl, fmtDate, kindLabel, pad } from '@/lib/pricing';
import type { Booking } from '@/lib/store';
import { QR, Emblem } from './art';

export const STATUS_PT: Record<string, { t: string; c: string }> = {
  CONFIRMED: { t: 'Confirmada', c: 'bg-tint text-teal-deep' }, COMPLETED: { t: 'Concluída', c: 'bg-tint-2 text-forest' },
  CANCELLED_BY_USER: { t: 'Cancelada por você', c: 'bg-coral-bg text-coral' }, CANCELLED_BY_MERCHANT: { t: 'Cancelada pelo salão', c: 'bg-coral-bg text-coral' },
};

export function Voucher({ b }: { b: Booking }) {
  const s = getSalon(b.salonId)!; const services = s.services.filter((x) => b.serviceIds.includes(x.id));
  const staff = s.staff.find((p) => p.id === b.staffId); const lbl = kindLabel(b.kind);
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white" data-testid={`voucher-${b.code}`}>
      <div className="flex items-center justify-between bg-forest px-5 py-4 text-tint">
        <div><p className="text-[10px] uppercase tracking-[.2em] text-mint">Voucher BeautyPass</p><p className="font-display text-xl" data-testid="text-voucher-code">{b.code}</p></div>
        <Emblem className="h-9 w-9" light />
      </div>
      <div className="flex flex-col items-center gap-2 border-b border-dashed border-line p-5">
        <QR value={b.code} size={150} />
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${STATUS_PT[b.status].c}`}>{STATUS_PT[b.status].t}</span>
      </div>
      <div className="space-y-2 p-5 text-sm text-ink">
        <p className="font-display text-lg text-forest">{s.name}</p>
        <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-teal" /><span className="capitalize">{fmtDate(b.date)}</span> · {pad(b.hour)}:00</p>
        <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-teal" />{b.mode === 'domicilio' ? `A domicílio: ${b.address}` : `${s.address}, ${s.hood}`}</p>
        <p className="flex items-center gap-2"><User className="h-4 w-4 text-teal" />{staff ? staff.name : 'Qualquer Profissional'}</p>
        <p className="text-xs text-muted-ink">{services.map((x) => x.name).join(' + ')}</p>
        {b.notes && <p className="flex items-start gap-2 rounded-xl bg-tint p-2 text-xs"><StickyNote className="mt-0.5 h-3.5 w-3.5 text-teal" />{b.notes}</p>}
        <div className="flex items-end justify-between border-t border-line pt-3 tnum">
          <span className="text-xs text-muted-ink">{lbl && b.disc > 0 ? `${lbl.title} -${b.disc}%` : 'Preço padrão'}{b.fee > 0 && ` · taxa ${brl(b.fee)}`}</span>
          <span>{b.disc > 0 && <s className="mr-1 text-xs text-muted-ink">{brl(b.base)}</s>}<b className="text-forest">{brl(b.final + b.fee)}</b></span>
        </div>
        {b.cancelReason && <p className="text-xs text-coral">Motivo: {b.cancelReason} · multa {brl(b.cancelFee ?? 0)} · reembolso {brl(b.refund ?? 0)}</p>}
      </div>
    </div>
  );
}
