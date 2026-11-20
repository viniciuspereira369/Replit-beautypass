import type { ReactElement } from 'react';
import { Scissors, Sparkles, Hand, Flower2, Droplets, Palette } from 'lucide-react';
import type { Category } from '@/lib/data';
import { hash } from '@/lib/pricing';
import { cn } from '@/lib/utils';

export function Emblem({ className = 'h-8 w-8', light = false }: { className?: string; light?: boolean }) {
  const a = light ? '#5EEAD4' : '#0D9488'; const b = light ? '#F0FDFA' : '#123E35';
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="22" fill="none" stroke={b} strokeWidth="1.5" />
      <path d="M24 8 C31 16 31 26 24 34 C17 26 17 16 24 8Z" fill={a} opacity=".9" />
      <path d="M10 26 C17 22 22 26 24 34 C16 35 11 31 10 26Z" fill={b} opacity=".85" />
      <path d="M38 26 C31 22 26 26 24 34 C32 35 37 31 38 26Z" fill={b} opacity=".85" />
      <circle cx="24" cy="39" r="1.8" fill={a} />
    </svg>
  );
}

export const catIcon = (c: Category) => ({ Cabelo: Scissors, Barba: Sparkles, Unhas: Hand, Massagem: Flower2, Estética: Droplets, Misto: Palette }[c]);

export function CategoryArt({ category, seed, className }: { category: Category; seed: string; className?: string }) {
  const h = hash(seed); const r = (n: number) => (h >> n) % 40;
  const Icon = catIcon(category);
  const motif = {
    Cabelo: <g fill="none" stroke="#8DD1BF" strokeWidth="2.5">{[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${-20 + i * 28} 200 C ${40 + i * 30} ${120 - r(i)} ${10 + i * 40} 60 ${120 + i * 30} -10`} opacity={0.35 + i * 0.12} />)}</g>,
    Barba: <g stroke="#8DD1BF" strokeWidth="2">{Array.from({ length: 14 }).map((_, i) => <line key={i} x1={150 + i * 9} y1={30} x2={150 + i * 9} y2={70 + (i % 3) * 14} opacity=".6" />)}<rect x="140" y="20" width="140" height="14" rx="7" fill="#5EEAD4" opacity=".5" /></g>,
    Unhas: <g>{[0, 1, 2, 3].map((i) => <ellipse key={i} cx={170 + i * 34} cy={60 + (i % 2) * 22} rx="13" ry="22" fill={i % 2 ? '#5EEAD4' : '#CBE8DF'} opacity=".75" transform={`rotate(${-12 + i * 8} ${170 + i * 34} 70)`} />)}</g>,
    Massagem: <g>{[0, 1, 2].map((i) => <ellipse key={i} cx={230} cy={110 - i * 26} rx={52 - i * 12} ry={13 - i * 2} fill={['#0D9488', '#8DD1BF', '#CBE8DF'][i]} opacity=".8" />)}<circle cx="80" cy="40" r="30" fill="none" stroke="#5EEAD4" opacity=".4" /></g>,
    Estética: <g fill="none" stroke="#5EEAD4">{[18, 34, 50, 66].map((rr, i) => <circle key={i} cx={240} cy={70} r={rr} opacity={0.8 - i * 0.15} strokeWidth="1.5" />)}<path d="M240 40 C256 62 256 78 240 92 C224 78 224 62 240 40Z" fill="#CBE8DF" opacity=".8" /></g>,
    Misto: <g>{[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={150 + (i % 3) * 42} y={22 + Math.floor(i / 3) * 42} width="34" height="34" rx={i % 2 ? 17 : 6} fill={i % 2 ? '#5EEAD4' : '#8DD1BF'} opacity={0.4 + (i % 3) * 0.18} />)}</g>,
  }[category];
  return (
    <div className={cn('relative overflow-hidden bg-forest', className)}>
      <svg viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs><radialGradient id={`g${h}`} cx="20%" cy="0%" r="90%"><stop offset="0" stopColor="#00685F" /><stop offset="1" stopColor="#123E35" /></radialGradient></defs>
        <rect width="320" height="150" fill={`url(#g${h})`} />
        <circle cx={40 + r(3)} cy={130} r={60} fill="#0D9488" opacity=".25" />
        {motif}
      </svg>
      <div className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-tint/15 text-mint backdrop-blur"><Icon className="h-4 w-4" /></div>
    </div>
  );
}

export function QR({ value, size = 160 }: { value: string; size?: number }) {
  const n = 25; let x = hash(value) || 1;
  const rnd = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) % 2; };
  const finder = (r: number, c: number) => {
    for (const [fr, fc] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
      const a = r - fr, b = c - fc;
      if (a >= -1 && a <= 7 && b >= -1 && b <= 7) {
        if (a < 0 || b < 0 || a > 6 || b > 6) return 0;
        return a === 0 || a === 6 || b === 0 || b === 6 || (a >= 2 && a <= 4 && b >= 2 && b <= 4) ? 1 : 0;
      }
    }
    return -1;
  };
  const cells: ReactElement[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const f = finder(r, c); const on = f === -1 ? rnd() : f;
    if (on) cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1.02" height="1.02" />);
  }
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} width={size} height={size} role="img" aria-label={`QR ${value}`} className="rounded-xl bg-white">
      <g fill="#123E35">{cells}</g>
    </svg>
  );
}

export function Initials({ name, className }: { name: string; className?: string }) {
  const i = name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  return <span className={cn('inline-flex items-center justify-center rounded-full bg-mint-3 text-[10px] font-semibold text-ink ring-2 ring-white', className)}>{i}</span>;
}
