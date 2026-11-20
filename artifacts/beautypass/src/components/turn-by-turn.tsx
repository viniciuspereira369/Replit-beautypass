import { Navigation, CornerUpRight, CornerUpLeft, MapPin } from 'lucide-react';
import type { Salon } from '@/lib/data';
import { USER_POS } from '@/lib/data';
import { walkMin } from './salon-card';

/** Simulated walking directions from Camila (Pinheiros) to the real SP address. */
export function directions(s: Salon) {
  const m = Math.round(s.distanceKm * 1000); const street = s.address.split(',')[0];
  const right = s.x >= USER_POS.x; const north = s.y < USER_POS.y;
  return [
    { icon: Navigation, text: `Siga pela Rua Teodoro Sampaio sentido ${north ? 'Av. Dr. Arnaldo' : 'Largo da Batata'}`, m: Math.round(m * 0.45) },
    { icon: right ? CornerUpRight : CornerUpLeft, text: `Vire à ${right ? 'direita' : 'esquerda'} em direção a ${s.hood}`, m: Math.round(m * 0.35) },
    { icon: MapPin, text: `Chegue em ${street}, ${s.address.split(',')[1]?.trim() ?? ''}`, m: m - Math.round(m * 0.45) - Math.round(m * 0.35) },
  ];
}

export function TurnByTurn({ salon }: { salon: Salon }) {
  const steps = directions(salon); const total = Math.round(salon.distanceKm * 1000);
  return (
    <div className="rounded-2xl bg-economy-bg p-3.5" data-testid="card-directions">
      <div className="flex items-center justify-between text-[11px] font-semibold text-economy tnum">
        <span>{walkMin(salon.distanceKm)} min a pé</span><span>{total.toLocaleString('pt-BR')} m</span><span>≈ {Math.round(total * 1.3).toLocaleString('pt-BR')} passos</span>
      </div>
      <ol className="mt-2.5 space-y-2">
        {steps.map((st, i) => (
          <li key={i} className="flex items-center gap-2.5 text-xs text-ink">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-teal-deep"><st.icon className="h-3.5 w-3.5" /></span>
            <span className="flex-1">{st.text}</span><span className="text-[11px] text-muted-ink tnum">{st.m} m</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
