import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getSalon } from '@/lib/data';
import { submitReview, type Booking } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const WORDS = ['', 'Ruim', 'Regular', 'Boa', 'Muito boa', 'Impecável'];

export function ReviewModal({ b, onClose }: { b: Booking | null; onClose: () => void }) {
  const [rating, setRating] = useState(0); const [hover, setHover] = useState(0); const [text, setText] = useState(''); const [err, setErr] = useState('');
  const { toast } = useToast(); const s = b ? getSalon(b.salonId) : null;
  const close = () => { setRating(0); setText(''); setErr(''); onClose(); };
  const send = () => {
    if (!b) return;
    if (!rating) { setErr('Escolha de 1 a 5 estrelas.'); return; }
    const r = submitReview(b.code, rating, text.trim());
    if (!r.ok) { setErr(r.error ?? 'Não foi possível enviar.'); toast({ title: 'Avaliação não enviada', description: r.error, variant: 'destructive' }); return; }
    toast({ title: 'Avaliação publicada', description: `${s?.name} agradece, nota ${rating}/5` }); close();
  };
  const shown = hover || rating;
  return (
    <Dialog open={!!b} onOpenChange={(o) => !o && close()}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-sm max-h-[calc(100dvh-2rem)] rounded-[28px] border-line bg-white p-5" data-testid="dialog-review">
        <DialogHeader>
          <DialogTitle className="tight text-xl font-bold text-forest">Avaliar Experiência</DialogTitle>
          <DialogDescription className="text-sm text-muted-ink">{s?.name} · {b?.code}. Sua avaliação aparece como verificada.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center">
          <div className="flex gap-1" role="radiogroup" aria-label="Nota de 1 a 5" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <motion.button key={n} whileTap={{ scale: 0.8 }} role="radio" aria-checked={rating === n} aria-label={`${n} estrela${n > 1 ? 's' : ''}`} data-testid={`button-star-${n}`}
                onMouseEnter={() => setHover(n)} onClick={() => { setRating(n); setErr(''); }}
                onKeyDown={(e) => { if (e.key === 'ArrowRight') setRating(Math.min(5, rating + 1)); if (e.key === 'ArrowLeft') setRating(Math.max(1, rating - 1)); }}
                className="rounded-full p-1">
                <Star className={cn('h-9 w-9 transition', n <= shown ? 'fill-gold text-gold' : 'text-line')} />
              </motion.button>
            ))}
          </div>
          <p className="mt-1 h-4 text-xs font-semibold text-muted-ink">{WORDS[shown]}</p>
        </div>
        <label className="text-xs font-semibold text-ink">Comentário (opcional)
          <textarea data-testid="input-review-comment" value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={280} placeholder="Como foi o atendimento?" className="mt-1 w-full rounded-2xl border border-line bg-porcelain p-3 text-sm font-normal outline-none focus:border-teal" />
        </label>
        {err && <p role="alert" className="rounded-xl bg-coral-bg p-2 text-xs text-coral">{err}</p>}
        <button data-testid="button-review-submit" onClick={send} className="w-full rounded-full bg-forest py-3 text-sm font-bold text-white transition active:scale-[.98]">Publicar avaliação</button>
      </DialogContent>
    </Dialog>
  );
}
