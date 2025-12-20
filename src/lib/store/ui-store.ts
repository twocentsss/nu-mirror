import { create } from 'zustand';

interface UIState {
    isNavVisible: boolean;
    setNavVisible: (visible: boolean) => void;
    clickOrigin: { x: number; y: number } | null;
    setClickOrigin: (origin: { x: number; y: number } | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isNavVisible: true,
    setNavVisible: (visible) => set({ isNavVisible: visible }),
    clickOrigin: null,
    setClickOrigin: (origin) => set({ clickOrigin: origin }),
}));
