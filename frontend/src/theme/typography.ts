import type { FontSizeLevel } from '../store/accessibility-store';
import { FONT_SCALES } from './font-scale';

const BASE = {
  h1: { fontSize: 32, fontWeight: 'bold' as const },
  h2: { fontSize: 22, fontWeight: 'bold' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body1: { fontSize: 15, fontWeight: '500' as const },
  body2: { fontSize: 14, fontWeight: 'normal' as const },
  caption: { fontSize: 12, fontWeight: 'normal' as const },
};

export const getScaledTypography = (level: FontSizeLevel) => {
  const scale = FONT_SCALES[level];
  const scaled: Record<string, { fontSize: number; fontWeight: any }> = {};
  for (const [key, val] of Object.entries(BASE)) {
    scaled[key] = { ...val, fontSize: Math.round(val.fontSize * scale) };
  }
  return scaled;
};

export const typography = BASE;
