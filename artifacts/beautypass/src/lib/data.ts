export type Category = 'Cabelo' | 'Barba' | 'Unhas' | 'Massagem' | 'Estética' | 'Misto';
export type Service = { id: string; name: string; duration: number; base: number };
export type Staff = { id: string; name: string; role: string; rating: number; featured?: boolean };
export type Review = { author: string; rating: number; text: string; when: string };
export type Salon = {
  id: string; name: string; hood: string; category: Category; rating: number; distanceKm: number;
  address: string; discount: number; services: Service[]; staff: Staff[]; reviews: Review[];
  proof: { name: string; service: string; minutes: number }; mutuals: string[]; x: number; y: number; tagline: string;
};

type Raw = [string, string, string, Category, number, number, string, number, [string, number, number][], [string, string][], string[], [number, number], string, string, number];

const raw: Raw[] = [
  ['atelie-belle-epoque', 'Ateliê Belle Époque', 'Pinheiros', 'Cabelo', 4.9, 0.8, 'Rua dos Pinheiros, 812', 35,
    [['Escova', 120, 45], ['Corte Feminino', 180, 60], ['Hidratação Profunda', 150, 50]],
    [['Helena Duarte', 'Hair stylist sênior'], ['Rafaela Costa', 'Colorista'], ['Tiago Nunes', 'Cabeleireiro']],
    ['Mariana', 'Júlia', 'Bia'], [176, 236], 'Escovas com acabamento de revista, sem pressa.', 'Mariana', 12],
  ['lumina-studio', 'Lumina Studio & Nail Bar', 'Pinheiros', 'Unhas', 4.8, 1.2, 'Rua Cardeal Arcoverde, 1450', 30,
    [['Spa Mãos', 85, 50], ['Esmaltação em Gel', 110, 60], ['Pedicure Spa', 70, 45]],
    [['Yasmin Prado', 'Nail designer'], ['Carol Mendes', 'Manicure']],
    ['Letícia', 'Paula'], [238, 302], 'Nail bar luminoso com cabines individuais.', 'Letícia', 7],
  ['serena-spa', 'Serena Spa', 'Jardins', 'Massagem', 4.9, 1.9, 'Alameda Lorena, 1620', 35,
    [['Massagem Sueca', 180, 60], ['Pedras Quentes', 230, 75], ['Drenagem Linfática', 200, 60]],
    [['Luana Ribeiro', 'Massoterapeuta'], ['Paula Torres', 'Terapeuta corporal'], ['Diego Alves', 'Massoterapeuta']],
    ['Camila R.', 'Fernanda', 'Isa'], [300, 336], 'Silêncio, óleos mornos e luz baixa.', 'Fernanda', 19],
  ['dermacare', 'Dermacare Estética', 'Itaim Bibi', 'Estética', 4.85, 2.3, 'Rua Joaquim Floriano, 466', 35,
    [['Limpeza de Pele', 210, 70], ['Peeling de Diamante', 260, 60], ['Revitalização Facial', 190, 50]],
    [['Dra. Marina Sato', 'Biomédica esteta'], ['Fernanda Lopes', 'Esteticista']],
    ['Renata', 'Lu'], [268, 418], 'Protocolos faciais com biomédicas.', 'Renata', 24],
  ['barbearia-maestro', 'Barbearia Maestro', 'Vila Madalena', 'Barba', 4.7, 2.1, 'Rua Aspicuelta, 301', 30,
    [['Corte & Barba', 70, 50], ['Barboterapia', 55, 30], ['Corte Clássico', 60, 40]],
    [['Renato Bastos', 'Barbeiro mestre'], ['Caio Freitas', 'Barbeiro'], ['Edu Lima', 'Barbeiro']],
    ['Pedro', 'André'], [122, 186], 'Toalha quente, navalha e boa conversa.', 'Pedro', 5],
  ['arte-nail', 'Arte Nail Studio', 'Consolação', 'Unhas', 4.6, 2.8, 'Rua Augusta, 1180', 30,
    [['Nail Art', 95, 60], ['Alongamento em Fibra', 160, 90], ['Manicure Express', 45, 40]],
    [['Bruna Okada', 'Nail artist'], ['Lívia Matos', 'Manicure']],
    ['Tati'], [326, 214], 'Arte autoral em cada unha.', 'Tati', 31],
  ['studio-mix', 'Studio Mix', 'Perdizes', 'Misto', 4.75, 3.2, 'Rua Cardoso de Almeida, 990', 35,
    [['Cabelo & Make', 195, 90], ['Maquiagem Social', 150, 60], ['Escova Modelada', 95, 45]],
    [['Natália Reis', 'Make & hair'], ['Gustavo Pires', 'Cabeleireiro'], ['Ana Lúcia', 'Maquiadora']],
    ['Gabi', 'Carol', 'Nina'], [168, 104], 'Produção completa para a noite.', 'Gabi', 16],
  ['capelli-doro', "Espaço Capelli D'Oro", 'Jardins', 'Cabelo', 4.92, 2.0, 'Rua Oscar Freire, 720', 35,
    [['Visagismo', 160, 60], ['Coloração Premium', 280, 120], ['Corte & Escova', 190, 75]],
    [['Giovanna Ferri', 'Visagista'], ['Marcos Vitti', 'Colorista']],
    ['Mariana', 'Sofia'], [334, 296], 'Visagismo italiano no coração dos Jardins.', 'Sofia', 9],
];

const reviewTexts = [
  (s: string) => `Fui no horário econômico e o ${s.toLowerCase()} ficou impecável. Voltarei.`,
  () => 'Equipe pontual, ambiente lindo e preço justo. O desconto apareceu certinho no app.',
  () => 'Atendimento atencioso do começo ao fim. Recomendo para quem quer cuidado de verdade.',
];
const reviewers = ['Luiza M.', 'Beatriz S.', 'Renata C.'];
const whens = ['há 2 dias', 'há 1 semana', 'há 3 semanas'];

export const SALONS: Salon[] = raw.map((r) => {
  const [id, name, hood, category, rating, distanceKm, address, discount, svcs, staff, mutuals, xy, tagline, pn, pm] = r;
  return {
    id, name, hood, category, rating, distanceKm, address, discount, tagline,
    services: svcs.map(([n, base, duration], i) => ({ id: `${id}-s${i}`, name: n, base, duration })),
    staff: staff.map(([n, role], i) => ({ id: `${id}-p${i}`, name: n, role, featured: i === 0,
      rating: i === 0 ? Math.min(5, +(rating + 0.3).toFixed(2)) : +(rating - 0.1 * i).toFixed(2) })),
    reviews: reviewers.map((a, i) => ({ author: a, rating: i === 2 ? 4.8 : 5, text: reviewTexts[i](svcs[0][0]), when: whens[i] })),
    proof: { name: pn, service: svcs[0][0], minutes: pm }, mutuals, x: xy[0], y: xy[1],
  };
});

export const getSalon = (id: string) => SALONS.find((s) => s.id === id);
export const CATEGORIES = ['Todos', 'Cabelo', 'Barba', 'Unhas', 'Massagem', 'Estética'] as const;
export const USER_POS = { x: 206, y: 266 };

export const PLANS = {
  Essencial: { price: 89, credits: 120, vouchers: 2 },
  'Black VIP': { price: 189, credits: 260, vouchers: 4 },
} as const;
export type PlanName = keyof typeof PLANS;
export const TOPUPS = [{ credits: 50, price: 45 }, { credits: 120, price: 99 }, { credits: 250, price: 189 }];
