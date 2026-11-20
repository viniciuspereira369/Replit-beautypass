import { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { pad, PERIODS, type Period } from '@/lib/pricing';
import { cn } from '@/lib/utils';

export type ClockSlot = { h: number; disc: number; state: string; past: boolean };
const MIN = 9; const MAX = 19; const CX = 150; const CY = 150; const R = 118;
const pt = (h: number, r = R) => { const t = (Math.min(MAX, Math.max(MIN, h)) - MIN) / (MAX - MIN); const a = Math.PI * (1 - t); return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) }; };
const arc = (h: number) => { const p = pt(h); const s = pt(MIN); return `M ${s.x} ${s.y} A ${R} ${R} 0 0 1 ${p.x} ${p.y}`; };
const PRESETS = [9, 12, 15, 19];

/** Signature 180° radial gauge clock, bidirectionally synced with period, slider and slot chips. */
export function RadialClock({ slots, hour, onHour, period, onPeriod }: { slots: ClockSlot[]; hour: number | null; onHour: (h: number) => void; period: Period; onPeriod: (p: Period) => void }) {
  const reduce = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null); const dragging = useRef(false);
  const fromPointer = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 300 - CX; const y = CY - ((e.clientY - r.top) / r.height) * 170;
    const a = Math.atan2(Math.max(0, y), x); const h = Math.round(MAX - (a / Math.PI) * (MAX - MIN));
    const c = Math.min(MAX, Math.max(MIN, h)); if (c !== hour) onHour(c);
  };
  const sel = hour != null ? slots.find((s) => s.h === hour) : undefined;
  const color = sel && sel.disc > 0 && sel.state !== 'Ocupado' ? '#0E8A73' : '#00685F';
  const shown = hour ?? 14; const p = pt(shown);
  const unavailable = sel && sel.state === 'Ocupado';
  return (
    <div className="rounded-[24px] border border-line bg-white p-4" data-testid="radial-clock">
      <div className="grid grid-cols-3 gap-1 rounded-full bg-tint p-1" role="radiogroup" aria-label="Período">
        {(Object.keys(PERIODS) as Period[]).map((k) => (
          <button key={k} role="radio" aria-checked={period === k} data-testid={`button-period-${k}`} onClick={() => onPeriod(k)} className={cn('relative rounded-full py-1.5 text-[11px] font-bold uppercase tracking-wider transition', period === k ? 'text-white' : 'text-muted-ink')}>
            {period === k && <motion.span layoutId="period-pill" className="absolute inset-0 rounded-full bg-forest" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />}
            <span className="relative">{k === 'Manhã' ? 'MANHÃ' : k === 'Tarde' ? 'TARDE' : 'NOITE'}</span>
          </button>
        ))}
      </div>
      <div className="relative mx-auto mt-2 max-w-[300px]">
        <svg ref={svgRef} viewBox="0 0 300 170" className="w-full cursor-pointer touch-none select-none" aria-hidden data-testid="svg-clock-dial"
          onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); fromPointer(e); }}
          onPointerMove={(e) => { if (dragging.current) fromPointer(e); }}
          onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}>
          <path d={arc(MAX)} fill="none" stroke="#EBF5F2" strokeWidth="18" strokeLinecap="round" />
          {hour != null && <motion.path d={arc(shown)} fill="none" stroke={color} strokeWidth="18" strokeLinecap="round" initial={false} animate={{ d: arc(shown), stroke: color }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 140, damping: 20 }} />}
          {slots.filter((s) => s.h <= MAX).map((s) => { const a = pt(s.h, R + 20); const b = pt(s.h, R - 20);
            const c = s.state === 'Ocupado' ? '#CBD5E1' : s.disc > 0 ? '#0E8A73' : s.state === 'Alta Procura' ? '#F59E0B' : '#00685F';
            return <g key={s.h}><circle cx={a.x} cy={a.y} r="3" fill={c} /><text x={b.x} y={b.y + 3} textAnchor="middle" fontSize="9" fontWeight="700" fill={s.state === 'Ocupado' ? '#94A3B8' : '#5A7A78'} style={{ fontVariantNumeric: 'tabular-nums' }}>{pad(s.h)}</text></g>; })}
          <motion.g initial={false} animate={{ x: p.x, y: p.y }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 20 }}>
            <circle r="15" fill={color} opacity=".18" /><circle r="10" fill="#fff" stroke={color} strokeWidth="3" /><circle r="4" fill={color} />
          </motion.g>
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
          <p className={cn('text-[34px] font-bold leading-none tnum tight', unavailable ? 'text-strike line-through' : 'text-forest')} data-testid="text-clock-time">{hour != null ? `${pad(hour)}:00` : '--:--'}</p>
          <p className={cn('mt-1 text-[11px] font-semibold', !sel ? 'text-muted-ink' : unavailable ? 'text-strike' : sel.disc > 0 ? 'text-economy' : 'text-teal-deep')}>
            {!sel ? 'Escolha um horário' : sel.past ? 'Horário já passou' : unavailable ? 'Ocupado' : sel.disc > 0 ? `-${sel.disc}% neste horário` : sel.state}
          </p>
        </div>
      </div>
      <label className="mt-3 block"><span className="sr-only">Hora</span>
        <input type="range" min={MIN} max={MAX} step={1} value={Math.min(MAX, shown)} onChange={(e) => onHour(+e.target.value)} data-testid="input-clock-slider" aria-valuetext={`${pad(shown)}:00`}
          className="w-full accent-[#00685F]" />
      </label>
      <div className="mt-1 flex justify-between">
        {PRESETS.map((h) => <button key={h} data-testid={`button-preset-${h}`} onClick={() => onHour(h)} className={cn('rounded-full px-3 py-1 text-[11px] font-bold tnum transition', hour === h ? 'bg-forest text-white' : 'bg-tint text-teal-deep')}>{pad(h)}:00</button>)}
      </div>
    </div>
  );
}
