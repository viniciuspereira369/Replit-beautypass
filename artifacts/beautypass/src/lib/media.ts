import type { Category, Salon } from './data';
import { hash } from './pricing';

const REPO = 'https://raw.githubusercontent.com/viniciuspereira369/beautypass/main/';
const DRAW = `${REPO}android/app/src/main/res/drawable-nodpi/`;
export const MEDIA = {
  emblemWhite: `${DRAW}logo_beautypass_emblem.webp`,
  emblemTeal: `${REPO}assets/logo_beautypass_emblem.png`,
  hair: `${DRAW}salon_hair_boutique.webp`,
  nails: `${DRAW}salon_nail_lounge.webp`,
  barber: `${DRAW}salon_barber_modern.webp`,
  spa: `${DRAW}salon_spa_oasis.webp`,
  clinic: `${DRAW}salon_clinic_aesthetic.webp`,
  hairTreatment: `${DRAW}treatment_hair_salon.webp`,
  browsTreatment: `${DRAW}treatment_eyebrows_beauty.webp`,
  facialTreatment: `${DRAW}treatment_facial_spa.webp`,
  massageTreatment: `${DRAW}treatment_massage_spa.webp`,
  ritualTreatment: `${DRAW}treatment_skincare_cosmetics.webp`,
  juliana: `${DRAW}profile_owner_juliana.webp`,
  marcos: `${DRAW}profile_owner_marcos.webp`,
  renata: `${DRAW}profile_owner_renata.webp`,
  camila: `${DRAW}friend_camila.webp`,
  beatriz: `${DRAW}friend_beatriz.webp`,
  larissa: `${DRAW}friend_larissa.webp`,
} as const;

export const categoryPhoto = (category: Category | string) => ({
  Cabelo: MEDIA.hair, Misto: MEDIA.hair, Unhas: MEDIA.nails, Barba: MEDIA.barber,
  Massagem: MEDIA.spa, Estética: MEDIA.clinic,
})[category] ?? MEDIA.hair;

export function galleryFor(salon: Salon): string[] {
  const extras = salon.category === 'Massagem' ? [MEDIA.massageTreatment, MEDIA.facialTreatment, MEDIA.ritualTreatment]
    : salon.category === 'Estética' ? [MEDIA.facialTreatment, MEDIA.browsTreatment, MEDIA.ritualTreatment]
    : salon.category === 'Unhas' ? [MEDIA.ritualTreatment, MEDIA.browsTreatment, MEDIA.spa]
    : salon.category === 'Barba' ? [MEDIA.hairTreatment, MEDIA.ritualTreatment, MEDIA.hair]
    : [MEDIA.hairTreatment, MEDIA.browsTreatment, MEDIA.ritualTreatment];
  const rotation = hash(salon.id) % 3;
  return [categoryPhoto(salon.category), ...extras.slice(rotation), ...extras.slice(0, rotation)];
}

export function treatmentPhoto(name: string, category: Category) {
  if (/sobrancelha|cilio|cílio|make|maquiagem/i.test(name)) return MEDIA.browsTreatment;
  if (/pele|facial|peeling/i.test(name)) return MEDIA.facialTreatment;
  if (/massagem|pedra|drenagem/i.test(name)) return MEDIA.massageTreatment;
  if (category === 'Unhas') return MEDIA.ritualTreatment;
  return category === 'Massagem' ? MEDIA.massageTreatment : category === 'Estética' ? MEDIA.facialTreatment : MEDIA.hairTreatment;
}

export function specialistPhoto(name: string, _index = 0) {
  const first = name.trim().split(/\s+/)[0].toLowerCase();
  if (['marcos', 'tiago', 'diego', 'renato', 'caio', 'edu', 'gustavo'].includes(first)) return MEDIA.marcos;
  if (first === 'juliana') return MEDIA.juliana;
  if (first === 'renata') return MEDIA.renata;
  return [MEDIA.juliana, MEDIA.renata][hash(name) % 2];
}
export const friendPhoto = (name: string, index = 0) =>
  [MEDIA.camila, MEDIA.beatriz, MEDIA.larissa][(hash(name) + index) % 3];
