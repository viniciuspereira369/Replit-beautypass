import { useState, type ReactElement } from 'react';
import { Scissors, Sparkles, Hand, Flower2, Droplets, Palette, ImageOff, UserRound } from 'lucide-react';
import type { Category } from '@/lib/data';
import { hash } from '@/lib/pricing';
import { MEDIA } from '@/lib/media';
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

export function QR({ value, size = 160 }: { value: string; size?: number }) {
  const n = 25; let x = hash(value) || 1;
  const rnd = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) % 2; };
  const inFinder = (r: number, c: number) => [[0, 0], [0, n - 7], [n - 7, 0]].some(([fr, fc]) => r - fr >= -1 && r - fr <= 7 && c - fc >= -1 && c - fc <= 7);
  const center = (r: number, c: number) => Math.abs(r - 12) <= 3 && Math.abs(c - 12) <= 3;
  const cells: ReactElement[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (inFinder(r, c)) continue;
    const on = rnd();
    if (on && !center(r, c)) cells.push(<rect key={`${r}-${c}`} x={c + 0.08} y={r + 0.08} width=".84" height=".84" rx=".32" fill={(r + c) % 5 === 0 ? '#0D9488' : '#00685F'} />);
  }
  const finder = (fx: number, fy: number) => (
    <g key={`${fx}-${fy}`}>
      <rect x={fx + 0.5} y={fy + 0.5} width="6" height="6" rx="1.8" fill="none" stroke="#123E35" strokeWidth="1" />
      <rect x={fx + 2} y={fy + 2} width="3" height="3" rx="1" fill="#0D9488" />
    </g>
  );
  return (
    <div className="relative inline-block rounded-2xl bg-white p-1" style={{ width: size, height: size }} role="img" aria-label={`QR ${value}`}>
      <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="h-full w-full">
        {cells}{finder(0, 0)}{finder(n - 7, 0)}{finder(0, n - 7)}
      </svg>
      <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white p-1 shadow-[0_0_0_2px_#EBF5F2]" style={{ width: size * 0.24, height: size * 0.24 }}>
        <Emblem className="h-full w-full" />
      </span>
    </div>
  );
}
