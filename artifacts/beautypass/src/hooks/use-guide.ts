import { useEffect, useRef, useSyncExternalStore } from 'react';

/** Roteiro Demo focus guide: a target id that a page scrolls to and highlights once. */
let target: string | null = null;
const ls = new Set<() => void>();
export function setGuide(t: string | null) { target = t; ls.forEach((l) => l()); }
const sub = (l: () => void) => { ls.add(l); return () => { ls.delete(l); }; };

export function useGuide<T extends HTMLElement = HTMLDivElement>(id: string, onFocus?: () => void) {
  const t = useSyncExternalStore(sub, () => target);
  const ref = useRef<T | null>(null);
  const cb = useRef(onFocus); cb.current = onFocus;
  useEffect(() => {
    if (t !== id) return;
    cb.current?.();
    const timer = setTimeout(() => {
      const el = ref.current; if (!el) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      el.classList.remove('guide-focus'); void el.offsetWidth; el.classList.add('guide-focus');
      const f = el.querySelector<HTMLElement>('button:not([disabled]), input, select');
      f?.focus({ preventScroll: true });
      setGuide(null);
    }, 350);
    return () => clearTimeout(timer);
  }, [t, id]);
  return ref;
}
