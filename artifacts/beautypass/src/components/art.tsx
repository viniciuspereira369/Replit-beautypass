import { useState, type ReactElement } from 'react';
import { Scissors, Sparkles, Hand, Flower2, Droplets, Palette, ImageOff, UserRound } from 'lucide-react';
import type { Category } from '@/lib/data';
import { hash } from '@/lib/pricing';
import { MEDIA } from '@/lib/media';
import { QR_MODULES, QR_QUIET_ZONE, QR_DARK, QR_WHITE, QR_VIEWBOX } from '@/lib/qr-layout';
import { cn } from '@/lib/utils';

/** Official emblem. White version on dark surfaces, teal on light surfaces. Never inverted. */
export function Emblem({ className = 'h-8 w-8', light = false }: { className?: string; light?: boolean }) {
  const [err, setErr] = useState(false);
  if (err) return <Flower2 className={cn(className, light ? 'text-mint' : 'text-teal')} aria-hidden />;
  return <img src={light ? MEDIA.emblemWhite : MEDIA.emblemTeal} alt="" aria-hidden onError={() => setErr(true)} className={cn('object-contain', className)} draggable={false} />;
}

export const catIcon = (c: Category) => ({ Cabelo: Scissors, Barba: Sparkles, Unhas: Hand, Massagem: Flower2, Estética: Droplets, Misto: Palette }[c]);

/** Real editorial photo with a soft emerald/mint fallback. */
export function Photo({ src, alt, className, imgClassName, position, eager }: { src: string; alt: string; className?: string; imgClassName?: string; position?: string; eager?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  const bad = failed === src;
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-tint to-mint-3', className)}>
      {bad ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-teal-deep/70" role="img" aria-label={alt}>
          <ImageOff className="h-5 w-5" strokeWidth={1.5} /><span className="sr-only">{alt}</span>
        </div>
      ) : (
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(src)} draggable={false}
          style={position ? { objectPosition: position } : undefined}
          className={cn('absolute inset-0 h-full w-full object-cover', imgClassName)} />
      )}
    </div>
  );
}

/** Round portrait (specialists / friends) with mint stroke-icon fallback. */
export function Portrait({ src, name, className, ring = true }: { src: string; name: string; className?: string; ring?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={cn('relative inline-flex shrink-0 overflow-hidden rounded-full bg-mint-3', ring && 'ring-2 ring-white', className)}>
      {failed ? <UserRound className="m-auto h-1/2 w-1/2 text-teal-deep" strokeWidth={1.6} aria-label={name} />
        : <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover object-top" draggable={false} />}
    </span>
  );
}

export function QR({ value, size = 160, medallion = true }: { value: string; size?: number; medallion?: boolean }) {
  const n = QR_MODULES; let x = hash(value) || 1;
  const rnd = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) % 2; };
  const inFinder = (r: number, c: number) => [[0, 0], [0, n - 7], [n - 7, 0]].some(([fr, fc]) => r - fr >= -1 && r - fr <= 7 && c - fc >= -1 && c - fc <= 7);
  const center = (r: number, c: number) => Math.abs(r - 12) <= 3 && Math.abs(c - 12) <= 3;
  const cells: ReactElement[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (inFinder(r, c)) continue;
    const on = rnd();
    if (on && !(medallion && center(r, c))) cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" rx=".1" fill={QR_DARK} />);
  }
  const finder = (fx: number, fy: number) => (
    <g key={`${fx}-${fy}`}>
      <rect x={fx} y={fy} width="7" height="7" rx=".5" fill={QR_DARK} />
      <rect x={fx + 1} y={fy + 1} width="5" height="5" rx=".3" fill={QR_WHITE} />
      <rect x={fx + 2} y={fy + 2} width="3" height="3" rx=".2" fill={QR_DARK} />
    </g>
  );
  return (
    <div className="relative inline-block shrink-0 bg-white" style={{ width: size, height: size, backgroundColor: QR_WHITE }} role="img" aria-label={`QR ${value}`} data-qr-quiet-zone={QR_QUIET_ZONE} data-qr-medallion={medallion}>
      <svg viewBox={QR_VIEWBOX} className="h-full w-full" aria-hidden>
        <rect x={-QR_QUIET_ZONE} y={-QR_QUIET_ZONE} width={n + QR_QUIET_ZONE * 2} height={n + QR_QUIET_ZONE * 2} fill={QR_WHITE} />
        {cells}{finder(0, 0)}{finder(n - 7, 0)}{finder(0, n - 7)}
      </svg>
      {medallion && <span data-testid="qr-medallion" className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white p-1 ring-2 ring-white" style={{ width: size * 0.20, height: size * 0.20 }}>
        <Emblem className="h-full w-full" />
      </span>}
    </div>
  );
}
