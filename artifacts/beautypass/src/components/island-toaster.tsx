import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/** Floating frosted Dynamic-Island style toasts. */
export function IslandToaster() {
  const { toasts, dismiss } = useToast(); const reduce = useReducedMotion();
  const live = toasts.filter((t) => t.open !== false);
  const top = live[0];
  useEffect(() => { if (!top) return; const t = setTimeout(() => dismiss(top.id), 3400); return () => clearTimeout(t); }, [top, dismiss]);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[120] flex justify-center px-3" aria-live="polite" role="status">
      <AnimatePresence>
        {top && (
          <motion.div key={top.id} data-testid="toast-island"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -24, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.7 }} transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="island pointer-events-auto flex min-w-[240px] max-w-[380px] items-center gap-3 rounded-full py-2.5 pl-3 pr-2 text-white shadow-[0_18px_40px_-14px_rgba(12,45,38,.6)]">
            <span className={top.variant === 'destructive' ? 'text-[#FDA4AF]' : 'text-mint'}>
              {top.variant === 'destructive' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </span>
            <span className="min-w-0 flex-1">
              {top.title && <span className="block truncate text-[13px] font-semibold tight">{top.title}</span>}
              {top.description && <span className="block truncate text-[11px] text-white/70">{top.description}</span>}
            </span>
            <button aria-label="Fechar aviso" onClick={() => dismiss(top.id)} className="rounded-full p-1.5 text-white/60 hover:bg-white/10"><X className="h-3.5 w-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
