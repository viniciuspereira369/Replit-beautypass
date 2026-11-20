import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { REVENUE_BASELINE, type PartnerAnalytics } from '@/lib/analytics';
import { brl } from '@/lib/pricing';

const tip = { contentStyle: { borderRadius: 14, border: '1px solid #E2ECE9', fontSize: 12, fontFamily: 'Inter', color: '#134E4A' }, labelStyle: { color: '#123E35', fontWeight: 700 } };
const BAR_COLOR: Record<string, string> = { confirmed: '#00685F', projected: '#8DD1BF', empty: '#CBD5E1' };
const pp = (n: number) => n.toFixed(1).replace('.', ',');

export function B2BCharts({ a }: { a: PartnerAnalytics }) {
  const occ = a.occupancy; const last = occ[occ.length - 1];
  const lift = a.occupancyLiftPp ?? 0; const base = Math.round(a.baselineOccupancy ?? 0);
  // Separate inline end labels when they would collide.
  let yBase = 0; let yBp = 0;
  if (last && Math.abs(last.beautyPass - last.baseline) < 9) { if (last.beautyPass >= last.baseline) { yBp = -7; yBase = 7; } else { yBp = 7; yBase = -7; } }
  const endLabel = (key: 'baseline' | 'beautyPass', text: string, color: string, dy: number) => (p: { x?: number; y?: number; index?: number }) =>
    p.index === occ.length - 1 && p.x != null && p.y != null ? <text key={key} x={p.x - 4} y={p.y + dy - 6} textAnchor="end" fontSize={10} fontWeight={700} fill={color}>{text}</text> : null;
  const occTitle = lift > 0 ? `+${pp(lift)}pp de ocupação projetada nas horas ociosas com desconto` : `Ocupação de base ${base}% · nenhuma hora ociosa futura com desconto ativo`;
  const revTitle = `${brl(a.completedNet)} recuperados hoje frente a ${brl(REVENUE_BASELINE)} da cadeira vazia`;

  return (
    <div className="grid gap-3 px-4 pt-4 md:grid-cols-2 lg:px-8" data-testid="section-b2b-charts">
      <figure className="rounded-[24px] border border-line bg-white p-4" data-testid="chart-occupancy">
        <figcaption>
          <p className="tight text-sm font-bold text-forest" data-testid="text-occupancy-title">{occTitle}</p>
          <p className="text-[11px] text-muted-ink">Hoje · 09h–19h · linha de base média {base}% · projeção ilustrativa, não medida</p>
        </figcaption>
        <div className="mt-2 h-48" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={occ} margin={{ top: 14, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke="#EEF4F2" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#5A7A78' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#5A7A78' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} ticks={[0, 40, 80, 100]} />
              <ReferenceLine y={80} stroke="#5A7A78" strokeDasharray="3 4" label={{ value: 'Meta ilustrativa 80%', position: 'insideTopLeft', fontSize: 9.5, fill: '#5A7A78' }} />
              <Tooltip {...tip} formatter={(v: number, n: string) => [`${Math.round(v)}%`, n === 'baseline' ? 'Linha de base' : 'Projeção BeautyPass']} />
              <Area type="monotone" dataKey="beautyPass" stroke="#0E8A73" strokeWidth={2.5} fill="#0E8A73" fillOpacity={0.1} isAnimationActive={false}>
                <LabelList dataKey="beautyPass" content={endLabel('beautyPass', 'Projeção', '#00685F', yBp)} />
              </Area>
              <Line type="monotone" dataKey="baseline" stroke="#94A3B8" strokeWidth={2} dot={false} isAnimationActive={false}>
                <LabelList dataKey="baseline" content={endLabel('baseline', 'Base', '#64748B', yBase)} />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <table className="sr-only" data-testid="table-occupancy"><caption>Ocupação por hora: linha de base e projeção ilustrativa</caption>
          <thead><tr><th>Hora</th><th>Linha de base</th><th>Projeção</th></tr></thead>
          <tbody>{occ.map((o) => <tr key={o.hour}><td>{o.hour}</td><td>{Math.round(o.baseline)}%</td><td>{Math.round(o.beautyPass)}%</td></tr>)}</tbody>
        </table>
      </figure>

      <figure className="rounded-[24px] border border-line bg-white p-4" data-testid="chart-revenue">
        <figcaption>
          <p className="tight text-sm font-bold text-forest tnum" data-testid="text-revenue-title">{revTitle}</p>
          <p className="text-[11px] text-muted-ink tnum" data-testid="text-revenue-projection">Separadamente: projeção ilustrativa de {brl(a.activeProjectedNet ?? 0)} nos horários futuros com regra ativa — ainda não realizada.</p>
        </figcaption>
        <div className="mt-2 h-48" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={a.revenue} layout="vertical" margin={{ top: 4, right: 72, left: 0, bottom: 4 }} barCategoryGap="22%">
              <XAxis type="number" hide domain={[REVENUE_BASELINE, (m: number) => Math.max(1, m)]} />
              <YAxis type="category" dataKey="name" width={128} tick={{ fontSize: 10, fill: '#134E4A' }} axisLine={false} tickLine={false} />
              <Tooltip {...tip} cursor={{ fill: '#EBF5F2' }} formatter={(v: number) => [brl(v), 'Líquido']} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} isAnimationActive={false}>
                {a.revenue.map((r) => <Cell key={r.id} fill={BAR_COLOR[r.id] ?? '#CBD5E1'} />)}
                <LabelList dataKey="value" position="right" formatter={(v: number) => brl(v)} style={{ fontSize: 11, fontWeight: 700, fill: '#123E35', fontVariantNumeric: 'tabular-nums' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <table className="sr-only" data-testid="table-revenue"><caption>Receita líquida comparada</caption>
          <thead><tr><th>Categoria</th><th>Valor</th></tr></thead>
          <tbody>{a.revenue.map((r) => <tr key={r.id}><td>{r.name}</td><td>{brl(r.value)}</td></tr>)}</tbody>
        </table>
      </figure>
      <p className="text-[10.5px] text-muted-ink md:col-span-2">Projeções ilustrativas calculadas localmente a partir das regras ativas, sem garantia de recuperação. Apenas vouchers com check-in compõem o repasse confirmado (Receita D+1).</p>
    </div>
  );
}
