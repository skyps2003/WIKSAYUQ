export function calculateGestationalWeeks(fum?: string | null, date: Date = new Date()) {
  if (!fum) return null;

  const fur = new Date(fum);
  if (Number.isNaN(fur.getTime()) || date < fur) return null;

  const diffDays = Math.floor((date.getTime() - fur.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

export function getTrimesterKey(weeks: number) {
  if (weeks <= 13) return 'trimestre_1';
  if (weeks <= 27) return 'trimestre_2';
  return 'trimestre_3';
}
