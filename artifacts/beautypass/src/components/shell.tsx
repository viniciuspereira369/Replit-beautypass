import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Map, Zap, CalendarCheck, User, RotateCcw, Smartphone, Monitor } from 'lucide-react';
import { Emblem } from './art';
import { resetDemo } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const VIEW_KEY = 'bpui:view';
export function useView() {
  const [v, setV] = useState<'phone' | 'full'>(() => (localStorage.getItem(VIEW_KEY) as 'phone' | 'full') || 'full');
  return [v, (n: 'phone' | 'full') => { localStorage.setItem(VIEW_KEY, n); setV(n); }] as const;
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <Emblem className="h-7 w-7" light={light} />
      <span className={cn('font-display text-xl font-semibold tracking-tight', light ? 'text-tint' : 'text-forest')}>Beauty<span className="italic text-teal">Pass</span></span>
    </span>
  );
}

export function TopBar({ view, setView }: { view: string; setView: (v: 'phone' | 'full') => void }) {
  const [loc, navigate] = useLocation(); const b2b = loc.startsWith('/painel'); const { toast } = useToast();
  const seg = 'rounded-full px-3 py-1.5 text-xs font-medium transition';
  return (
    <header className="sticky top-0 z-40 hidden h-14 items-center justify-between border-b border-line bg-porcelain/85 px-5 backdrop-blur md:flex">
      <Link href="/" data-testid="link-home-logo"><Wordmark /></Link>
      <div className="flex items-center gap-2 rounded-full border border-line bg-white/70 p-1">
        <button data-testid="button-mode-client" onClick={() => navigate('/')} className={cn(seg, !b2b ? 'bg-forest text-tint' : 'text-muted-ink hover:text-ink')}>App Cliente</button>
        <button data-testid="button-mode-b2b" onClick={() => navigate('/painel')} className={cn(seg, b2b ? 'bg-forest text-tint' : 'text-muted-ink hover:text-ink')}>Painel Salão B2B</button>
      </div>
      <div className="flex items-center gap-2">
        {!b2b && (
          <div className="flex items-center rounded-full border border-line bg-white/70 p-1">
            <button data-testid="button-view-phone" onClick={() => setView('phone')} className={cn(seg, 'flex items-center gap-1', view === 'phone' ? 'bg-tint-2 text-ink' : 'text-muted-ink')}><Smartphone className="h-3.5 w-3.5" />Celular 412px</button>
            <button data-testid="button-view-full" onClick={() => setView('full')} className={cn(seg, 'flex items-center gap-1', view === 'full' ? 'bg-tint-2 text-ink' : 'text-muted-ink')}><Monitor className="h-3.5 w-3.5" />Tela Cheia</button>
          </div>
        )}
        <button data-testid="button-reset-demo" onClick={() => { resetDemo(); toast({ title: 'Demo reiniciada', description: 'Dados do BeautyPass restaurados.' }); }} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs font-medium text-ink transition hover:bg-tint-2"><RotateCcw className="h-3.5 w-3.5" />Reiniciar Demo</button>
      </div>
    </header>
  );
}

const NAV = [
  { href: '/', label: 'Home', icon: Home }, { href: '/mapa', label: 'Mapa', icon: Map },
  { href: '/pedir', label: 'Pedir Agora', icon: Zap, big: true },
  { href: '/reservas', label: 'Reservas', icon: CalendarCheck }, { href: '/perfil', label: 'Perfil', icon: User },
];

export function ClientShell({ children, framed }: { children: ReactNode; framed: boolean }) {
  const [loc] = useLocation(); const ref = useRef<HTMLElement>(null);
  useEffect(() => { ref.current?.scrollTo({ top: 0 }); }, [loc]);
  return (
    <div className={cn(framed && 'md:flex md:justify-center md:py-6')}>
      <div className={cn('relative flex flex-col overflow-hidden bg-porcelain', framed ? 'h-[100dvh] md:h-[860px] md:w-[412px] md:rounded-[46px] md:border-[10px] md:border-forest md:shadow-[0_30px_80px_-20px_rgba(18,62,53,.45)]' : 'h-[100dvh] w-full md:h-[calc(100dvh-56px)]')}>
        <main ref={ref} className="@container flex-1 overflow-y-auto pb-32">{children}</main>
        <nav className="absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-3" aria-label="Navegação principal">
          <div className="flex w-full max-w-md items-end justify-between rounded-[28px] border border-white/60 bg-white/75 px-2 py-2 shadow-[0_10px_40px_-12px_rgba(18,62,53,.35)] backdrop-blur-xl">
            {NAV.map(({ href, label, icon: Icon, big }) => {
              const active = href === '/' ? loc === '/' : loc.startsWith(href);
              return big ? (
                <Link key={href} href={href} data-testid="nav-pedir" className="-mt-7 flex flex-col items-center gap-1">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest text-mint shadow-lg ring-4 ring-porcelain transition hover:scale-105 hover:bg-forest-hover active:scale-95"><Icon className="h-6 w-6" /></span>
                  <span className="text-[10px] font-semibold text-forest">{label}</span>
                </Link>
              ) : (
                <Link key={href} href={href} data-testid={`nav-${label.toLowerCase()}`} className={cn('flex w-14 flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] font-medium transition', active ? 'text-forest' : 'text-muted-ink hover:text-ink')}>
                  <Icon className={cn('h-5 w-5 transition', active && 'scale-110 text-teal')} />{label}
                  <span className={cn('h-1 w-1 rounded-full bg-teal transition', active ? 'opacity-100' : 'opacity-0')} />
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="rise px-5 pt-6">
      {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-teal">{eyebrow}</p>}
      <h1 className="font-display text-3xl font-semibold text-forest">{title}</h1>
      {children}
    </div>
  );
}

export function Empty({ icon: Icon, title, text, action }: { icon: typeof Home; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center rounded-3xl border border-dashed border-mint-2 bg-tint px-6 py-10 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-mint-3 text-forest"><Icon className="h-5 w-5" /></span>
      <p className="font-display text-lg text-forest">{title}</p>
      <p className="mt-1 text-sm text-muted-ink">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
