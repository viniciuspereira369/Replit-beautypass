import { motion, useReducedMotion } from 'framer-motion';
import { USER_POS, type Salon } from '@/lib/data';
import { cn } from '@/lib/utils';

export const HOODS = [
  { n: 'Perdizes', d: 'M40 30 L250 20 L240 150 L60 160Z', lx: 120, ly: 70 },
  { n: 'Vila Madalena', d: 'M20 165 L160 155 L150 260 L30 270Z', lx: 50, ly: 210 },
  { n: 'Pinheiros', d: 'M160 155 L260 150 L270 330 L150 340 L150 260Z', lx: 175, ly: 300 },
  { n: 'Consolação', d: 'M250 20 L390 30 L380 250 L265 260 L260 150Z', lx: 300, ly: 120 },
  { n: 'Jardins', d: 'M265 260 L380 250 L390 380 L270 385Z', lx: 330, ly: 370 },
  { n: 'Itaim Bibi', d: 'M150 340 L270 330 L270 385 L390 380 L380 490 L140 490Z', lx: 210, ly: 465 },
];

export const routePath = (s: Salon) => {
  const { x: ux, y: uy } = USER_POS; const my = (uy + s.y) / 2;
  return `M${ux} ${uy} C ${ux + (s.x - ux) * 0.1} ${my + 30}, ${s.x - (s.x - ux) * 0.1} ${my - 30}, ${s.x} ${s.y}`;
};

/** Stylized 6-neighbourhood SVG map (no external tiles). */
export function RouteMap({ salons, selected, onSelect, label, className, viewBox = '0 0 410 500', recenterKey = 0 }: {
  salons: Salon[]; selected: string | null; onSelect: (id: string) => void; label: (s: Salon) => string; className?: string; viewBox?: string; recenterKey?: number;
}) {
  const reduce = useReducedMotion(); const sel = salons.find((s) => s.id === selected);
  return (
    <svg viewBox={viewBox} preserveAspectRatio="xMidYMid slice" className={cn('block h-full w-full', className)} role="group" aria-label="Mapa estilizado de salões em São Paulo">
      <rect x="-200" y="-200" width="810" height="900" fill="#EEF6F3" />
      {HOODS.map((h) => <g key={h.n}><path d={h.d} fill={h.n === 'Pinheiros' ? '#E2F3EE' : '#F4F9F7'} stroke="#D3E4DF" strokeWidth="1.5" /><text x={h.lx} y={h.ly} fontSize="9.5" fill="#5A7A78" letterSpacing="1.6" fontWeight="700" opacity=".8">{h.n.toUpperCase()}</text></g>)}
      <g stroke="#fff" strokeWidth="7" strokeLinecap="round" fill="none">
        <path d="M0 250 C120 240 260 260 410 230" /><path d="M200 0 C190 160 230 330 210 500" /><path d="M0 120 L410 160" /><path d="M60 500 L380 0" opacity=".9" /><path d="M0 400 C150 380 260 420 410 400" />
      </g>
      <path d="M0 380 C100 370 120 470 140 500" stroke="#A7DCCD" strokeWidth="10" fill="none" opacity=".55" />
      <circle cx="90" cy="440" r="26" fill="#CDEBDF" opacity=".7" />
      {sel && <motion.path key={`${sel.id}-${recenterKey}`} d={routePath(sel)} stroke="#123E35" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity=".18" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7 }} />}
      {sel && <path className="walk-route" d={routePath(sel)} stroke="#0D9488" strokeWidth="3" fill="none" strokeLinecap="round" />}
      <circle className="gps-pulse" cx={USER_POS.x} cy={USER_POS.y} r="11" fill="#5EEAD4" />
      <circle cx={USER_POS.x} cy={USER_POS.y} r="7" fill="#0D9488" stroke="#fff" strokeWidth="3" />
      {salons.map((s) => {
        const on = s.id === selected; const text = label(s); const w = Math.max(54, text.length * 5.6 + 18);
        return (
          <g key={s.id} transform={`translate(${s.x} ${s.y})`} className="cursor-pointer outline-none" onClick={() => onSelect(s.id)} role="button" tabIndex={0} aria-pressed={on} aria-label={`${s.name}, ${text}`} data-testid={`pin-${s.id}`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(s.id); } }}>
            <motion.g animate={{ scale: on ? 1.18 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ originX: 0.5, originY: 1 }}>
              <rect x={-w / 2} y={-34} width={w} height="22" rx="11" fill={on ? '#123E35' : '#fff'} stroke={on ? '#5EEAD4' : '#D3E4DF'} strokeWidth={on ? 2 : 1} />
              <path d="M-5 -12.5 L0 -5 L5 -12.5Z" fill={on ? '#123E35' : '#fff'} />
              <text y="-19" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={on ? '#fff' : '#123E35'} style={{ fontVariantNumeric: 'tabular-nums' }}>{text}</text>
              <circle r="3.5" fill={on ? '#5EEAD4' : '#0D9488'} stroke="#fff" strokeWidth="1.5" />
            </motion.g>
          </g>
        );
      })}
    </svg>
  );
}
