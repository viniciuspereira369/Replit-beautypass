import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Home, Map, CalendarCheck, Settings2, RotateCcw, Smartphone, Monitor, Route, Zap, Gauge, Megaphone, ChevronRight } from 'lucide-react';
import { Emblem } from './art';
import { resetDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { setGuide } from '@/hooks/use-guide';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const VIEW_KEY = 'bpui:view:v2';
export function useView() {
  const [v, setV] = useState<'phone' | 'full'>(() => (localStorage.getItem(VIEW_KEY) as 'phone' | 'full') || 'phone');
  return [v, (n: 'phone' | 'full') => { localStorage.setItem(VIEW_KEY, n); setV(n); }] as const;
}

export function Wordmark({ light = false, size = 'md' }: { light?: boolean; size?: 'md' | 'sm' }) {
  return (
    <span className="flex items-center gap-2">
      <Emblem className={size === 'sm' ? 'h-6 w-6' : 'h-7 w-7'} light={light} />
      <span className={cn('font-display font-semibold tracking-tight', size === 'sm' ? 'text-lg' : 'text-xl', light ? 'text-white' : 'text-forest')}>Beauty<span className={cn('italic', light ? 'text-mint' : 'text-teal')}>Pass</span></span>
    </span>
  );
}

/** Forest splash: once per session and after each demo reset. Skippable. */
export function Splash() {
  const [show, setShow] = useState(() => !sessionStorage.getItem('bpui:splash'));
  useEffect(() => {
    const on = () => setShow(true);
    window.addEventListener('bp:reset', on); return () => window.removeEventListener('bp:reset', on);
  }, []);
  useEffect(() => {
    if (!show) return; sessionStorage.setItem('bpui:splash', '1');
    const t = setTimeout(() => setShow(false), 900);
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') setShow(false); };
    window.addEventListener('keydown', k);
    return () => { clearTimeout(t); window.removeEventListener('keydown', k); };
  }, [show]);
  if (!show) return null;
  return (
    <div role="dialog" aria-label="BeautyPass" data-testid="splash" onClick={() => setShow(false)}
      className="splash-fade fixed inset-0 z-[200] flex cursor-pointer flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_35%,#1B5A4D,#123E35_45%,#0C2D26)] text-white">
      <div className="rise"><Emblem light className="h-24 w-24" /></div>
      <p className="rise mt-5 font-display text-4xl font-semibold" style={{ animationDelay: '.1s' }}>Beauty<span className="italic text-mint">Pass</span></p>
      <p className="rise mt-2 text-sm text-white/70" style={{ animationDelay: '.2s' }}>Sua beleza, no seu tempo. São Paulo.</p>
      <button onClick={() => setShow(false)} className="absolute bottom-10 rounded-full border border-white/20 px-4 py-1.5 text-xs text-white/70">Pular</button>
    </div>
  );
}

const JOURNEYS = [
  { id: 'pedir', title: 'Encaixe Imediato', sub: 'Pedir Agora em 3 etapas', icon: Zap, to: '/pedir', guide: 'pedir-start' },
  { id: 'clock', title: 'Agendar com Relógio Radial', sub: 'Ateliê Belle Époque · agenda', icon: Gauge, to: '/salao/atelie-belle-epoque', guide: 'salon-clock' },
  { id: 'b2b', title: 'Publicar Regra B2B ao Vivo e Validar Check-in QR', sub: 'Painel · Regras, depois Check-in & Receita D+1', icon: Megaphone, to: '/painel', guide: 'b2b-rules' },
];

function DemoGuide() {
  const [open, setOpen] = useState(false); const [, navigate] = useLocation();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button data-testid="button-demo-guide" className="flex items-center gap-1.5 rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95"><Route className="h-3.5 w-3.5 text-mint" />Roteiro Demo</button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 rounded-3xl border-line bg-white p-2 shadow-[0_24px_60px_-24px_rgba(18,62,53,.45)]">
        <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[.18em] text-muted-ink">Jornadas em um clique</p>
        {JOURNEYS.map((j) => (
          <button key={j.id} data-testid={`button-journey-${j.id}`} onClick={() => { setOpen(false); navigate(j.to); setGuide(j.guide); }}
            className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-tint focus-visible:bg-tint focus-visible:outline-none">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tint text-teal-deep"><j.icon className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1"><b className="block text-[13px] text-ink tight">{j.title}</b><span className="text-[11px] text-muted-ink">{j.sub}</span></span>
            <ChevronRight className="h-4 w-4 text-muted-ink" />
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function TopBar({ view, setView }: { view: string; setView: (v: 'phone' | 'full') => void }) {
  const [loc, navigate] = useLocation(); const b2b = loc.startsWith('/painel'); const { toast } = useToast();
  const seg = 'rounded-full px-3 py-1.5 text-xs font-medium transition';
  return (
    <header className="sticky top-0 z-40 flex h-[52px] items-center justify-between gap-2 border-b border-line bg-porcelain/80 px-3 backdrop-blur-xl md:px-5">
      <Link href="/" data-testid="link-home-logo" aria-label="BeautyPass início"><Wordmark size="sm" /></Link>
      <div className="hidden items-center gap-1 rounded-full border border-line bg-white/70 p-1 md:flex">
        <button data-testid="button-mode-client" onClick={() => navigate('/')} className={cn(seg, !b2b ? 'bg-forest text-white' : 'text-muted-ink hover:text-ink')}>App Cliente</button>
        <button data-testid="button-mode-b2b" onClick={() => navigate('/painel')} className={cn(seg, b2b ? 'bg-forest text-white' : 'text-muted-ink hover:text-ink')}>Painel Salão B2B</button>
      </div>
      <div className="flex items-center gap-2">
        {!b2b && (
          <div className="hidden items-center rounded-full border border-line bg-white/70 p-1 lg:flex">
            <button data-testid="button-view-phone" aria-pressed={view === 'phone'} onClick={() => setView('phone')} className={cn(seg, 'flex items-center gap-1', view === 'phone' ? 'bg-tint text-ink' : 'text-muted-ink')}><Smartphone className="h-3.5 w-3.5" />Celular</button>
            <button data-testid="button-view-full" aria-pressed={view === 'full'} onClick={() => setView('full')} className={cn(seg, 'flex items-center gap-1', view === 'full' ? 'bg-tint text-ink' : 'text-muted-ink')}><Monitor className="h-3.5 w-3.5" />Tela Cheia</button>
          </div>
        )}
        <DemoGuide />
        <button data-testid="button-reset-demo" aria-label="Reiniciar Demo" onClick={() => { resetDemo(); toast({ title: 'Demo reiniciada', description: 'Dados do BeautyPass restaurados.' }); }} className="flex items-center gap-1.5 rounded-full border border-line bg-white/70 p-2 text-xs font-medium text-ink transition hover:bg-tint md:px-3"><RotateCcw className="h-3.5 w-3.5" /><span className="hidden md:inline">Reiniciar</span></button>
      </div>
    </header>
  );
}

const NAV = [
  { href: '/', label: 'Início', icon: Home, tid: 'nav-home' }, { href: '/mapa', label: 'Mapa', icon: Map, tid: 'nav-mapa' },
  { href: '/pedir', label: 'Pedir Agora', icon: Zap, big: true, tid: 'nav-pedir' },
  { href: '/reservas', label: 'Reservas', icon: CalendarCheck, tid: 'nav-reservas' }, { href: '/perfil', label: 'Ajustes', icon: Settings2, tid: 'nav-perfil' },
];

export function ClientShell({ children, framed }: { children: ReactNode; framed: boolean }) {
  const [loc] = useLocation(); const ref = useRef<HTMLElement>(null);
  useEffect(() => { ref.current?.scrollTo({ top: 0 }); }, [loc]);
  // Keep keyboard-focused controls fully visible above the sticky action bar (nav sits outside the scroller).
  useEffect(() => {
    const main = ref.current; if (!main) return;
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null; if (!el || !main.contains(el)) return;
      const bar = main.querySelector<HTMLElement>('[data-sticky-bar]');
      if (bar && bar.contains(el)) return;
      const r = el.getBoundingClientRect(); const m = main.getBoundingClientRect();
      const limit = bar ? Math.min(m.bottom - 24, bar.getBoundingClientRect().top - 8) : m.bottom - 24;
      if (r.bottom > limit) main.scrollBy({ top: r.bottom - limit });
      else if (r.top < m.top + 8) main.scrollBy({ top: r.top - m.top - 8 });
    };
    main.addEventListener('focusin', onFocus); return () => main.removeEventListener('focusin', onFocus);
  }, []);
  return (
    <div className={cn(framed && 'ambient md:flex md:min-h-[calc(100dvh-52px)] md:items-center md:justify-center md:py-2.5')}>
      <div className={cn('relative flex flex-col overflow-hidden bg-porcelain', framed ? 'h-[calc(100dvh-52px)] md:h-[min(860px,calc(100dvh-72px))] md:w-[412px] md:rounded-[48px] md:border-[9px] md:border-[#0C2D26] md:shadow-[0_40px_90px_-30px_rgba(18,62,53,.55),0_0_0_1px_rgba(18,62,53,.15)]' : 'h-[calc(100dvh-52px)] w-full')}>
        <main ref={ref} className="client-scroller @container flex-1 overflow-y-auto overflow-x-hidden mb-[74px] pb-8">{children}</main>
        <nav className="absolute inset-x-0 bottom-0 z-30 h-[74px] border-t border-line bg-white" aria-label="Navegação principal">
          <div className="mx-auto flex h-full max-w-md items-stretch justify-between px-2">
            {NAV.map(({ href, label, icon: Icon, big, tid }) => {
              const active = href === '/' ? loc === '/' : loc.startsWith(href);
              return big ? (
                <Link key={href} href={href} data-testid={tid} aria-current={active ? 'page' : undefined} className="group relative -mt-5 flex w-[72px] flex-col items-center gap-1">
                  <motion.span whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-forest to-teal-deep shadow-[0_0_0_3px_#fff,0_0_0_9px_rgba(94,234,212,.28),0_12px_24px_-8px_rgba(18,62,53,.6)]">
                    <Emblem light className="h-8 w-8" />
                  </motion.span>
                  <span className="text-[10px] font-bold text-forest">{label}</span>
                </Link>
              ) : (
                <Link key={href} href={href} data-testid={tid} aria-current={active ? 'page' : undefined} className={cn('relative flex w-16 flex-col items-center justify-center gap-1 text-[10.5px] font-semibold transition', active ? 'text-forest' : 'text-muted-ink hover:text-ink')}>
                  {active && <motion.span layoutId="nav-pill" className="absolute top-0 h-[3px] w-8 rounded-b-full bg-forest" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                  <motion.span whileTap={{ scale: 0.85 }}><Icon className={cn('h-[22px] w-[22px]', active && 'text-teal-deep')} strokeWidth={active ? 2.2 : 1.8} /></motion.span>{label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children, serif = true }: { eyebrow?: string; title: string; children?: ReactNode; serif?: boolean }) {
  return (
    <div className="rise px-5 pt-6">
      {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[.18em] text-teal">{eyebrow}</p>}
      <h1 className={cn('text-3xl font-semibold text-forest', serif ? 'font-display' : 'tight font-bold')}>{title}</h1>
      {children}
    </div>
  );
}

export function Empty({ icon: Icon, title, text, action }: { icon: typeof Home; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center rounded-3xl border border-dashed border-mint-2 bg-tint px-6 py-10 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-teal-deep shadow-sm"><Icon className="h-5 w-5" /></span>
      <p className="tight text-lg font-bold text-forest">{title}</p>
      <p className="mt-1 text-sm text-muted-ink">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
