import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import type { PartnerAnalytics } from '@/lib/analytics';
import { brl } from '@/lib/pricing';

const tip = { contentStyle: { borderRadius: 14, border: '1px solid #E2ECE9', fontSize: 12, fontFamily: 'Inter', color: '#134E4A' }, labelStyle: { color: '#123E35', fontWeight: 700 } };

export function B2BCharts({ a }: { a: PartnerAnalytics }) {
  return (
    <div className="grid gap-3 px-4 pt-4 md:grid-cols-2 lg:px-8" data-testid="section-b2b-charts">
      <div className="rounded-[24px] border border-line bg-white p-4">
        <p className="tight text-sm font-bold text-forest">Ocupação hoje · 09h–19h</p>
        <p className="text-[11px] text-muted-ink">Linha de base vs. projeção ilustrativa com regras BeautyPass</p>
        <div className="mt-2 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={a.occupancy} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="gBp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0E8A73" stopOpacity={0.45} /><stop offset="1" stopColor="#0E8A73" stopOpacity={0.02} /></linearGradient>
                <linearGradient id="gBase" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#94A3B8" stopOpacity={0.35} /><stop offset="1" stopColor="#94A3B8" stopOpacity={0.02} /></linearGradient>
              </defs>
              <CartesianGrid stroke="#EBF5F2" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#5A7A78' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#5A7A78' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip {...tip} formatter={(v: number, n: string) => [`${Math.round(v)}%`, n === 'baseline' ? 'Linha de base' : 'Com BeautyPass (projeção)']} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} formatter={(v: string) => v === 'baseline' ? 'Linha de base' : 'BeautyPass (projeção)'} />
              <Area type="monotone" dataKey="baseline" stroke="#94A3B8" strokeWidth={2} fill="url(#gBase)" />
              <Area type="monotone" dataKey="beautyPass" stroke="#0E8A73" strokeWidth={2.5} fill="url(#gBp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-[24px] border border-line bg-white p-4">
        <p className="tight text-sm font-bold text-forest">Receita líquida · cadeira vazia vs. recuperada</p>
        <p className="text-[11px] text-muted-ink tnum">Projeção ilustrativa {brl(a.projectedNet)} · repasse confirmado {brl(a.completedNet)}</p>
        <div className="mt-2 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={a.revenue} margin={{ top: 6, right: 6, left: -8, bottom: 0 }}>
              <CartesianGrid stroke="#EBF5F2" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#5A7A78' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#5A7A78' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `R$${v}`} />
              <Tooltip {...tip} cursor={{ fill: '#EBF5F2' }} formatter={(v: number, n: string) => [brl(v), n === 'vazia' ? 'Cadeira vazia' : 'Recuperada (líquido)']} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} formatter={(v: string) => (v === 'vazia' ? 'Cadeira vazia' : 'Recuperada')} />
              <Bar dataKey="vazia" fill="#CBD5E1" radius={[8, 8, 0, 0]} />
              <Bar dataKey="recuperada" fill="#00685F" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-[10.5px] text-muted-ink md:col-span-2">Gráficos são projeções ilustrativas calculadas localmente a partir das regras ativas; apenas vouchers com check-in compõem o repasse confirmado (Receita D+1).</p>
    </div>
  );
}
