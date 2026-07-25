import { create } from 'zustand';

export type FontSizeLevel = 'pequena' | 'normal' | 'grande';

interface AccessibilityState {
  fontSize: FontSizeLevel;
  setFontSize: (size: FontSizeLevel) => void;
}

export const useAccessibilityStore = create<AccessibilityState>((set) => ({
  fontSize: 'normal',
  setFontSize: (fontSize) => set({ fontSize }),
}));
