import type { Review, Salon } from './data';

export type ExperienceReview = Review & {
  code: string;
  salonId: string;
  createdAt: number;
};

/** Preserve the established seed rating until a verified demo review is added. */
export function salonRating(salon: Salon, reviews: ExperienceReview[]) {
  const added = reviews.filter((review) => review.salonId === salon.id);
  if (!added.length) return salon.rating;
  return +((salon.rating * salon.reviews.length + added.reduce((sum, review) => sum + review.rating, 0))
    / (salon.reviews.length + added.length)).toFixed(2);
}

export function salonReviews(salon: Salon, reviews: ExperienceReview[]): Review[] {
  return [
    ...reviews.filter((review) => review.salonId === salon.id).sort((a, b) => b.createdAt - a.createdAt),
    ...salon.reviews,
  ];
}
