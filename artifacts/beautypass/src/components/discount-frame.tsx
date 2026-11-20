import { discountFraming, kindLabel, type DiscKind } from '@/lib/pricing';
import { cn } from '@/lib/utils';

/** Canonical discount presentation: primary lead + supporting secondary + explicit kind label.
 *  Coral tint only for genuine Última Hora; everything else is the economy green tint with dark ink. */
export function kindTone(kind: DiscKind) {
  return kind === 'ultima'
    ? 'border-coral/40 bg-coral-bg text-[#9F1239]'
    : 'border-economy/40 bg-economy-bg text-[#065F4E]';
}

export function DiscountFrame({ base, final, disc, kind, tid, align = 'left', compact = false, className }: {
  base: number; final: number; disc: number; kind: DiscKind; tid?: string; align?: 'left' | 'right'; compact?: boolean; className?: string;
}) {
  const f = discountFraming(base, final, disc);
  if (!f) return null;
  const lbl = kindLabel(kind) ?? kindLabel('economico');
  return (
    <span className={cn('inline-flex flex-col gap-0.5', align === 'right' ? 'items-end text-right' : 'items-start', className)} data-testid={tid}>
      <span className={cn('inline-flex gap-1 rounded-2xl border px-2 py-0.5 font-bold tnum', compact ? 'flex-col items-end text-[10.5px]' : 'flex-wrap items-center text-[11.5px]', kindTone(kind))}>
        <span data-testid={tid ? `${tid}-primary` : undefined}>{f.primary}</span>
        <span className="font-semibold" data-testid={tid ? `${tid}-secondary` : undefined}>{!compact && '· '}{f.secondary}</span>
      </span>
      {lbl && <span className={cn('font-semibold', compact ? 'text-[10px]' : 'text-[10.5px]', kind === 'ultima' ? 'text-[#9F1239]' : 'text-[#065F4E]')} data-testid={tid ? `${tid}-kind` : undefined}>{lbl.title}</span>}
    </span>
  );
}
