import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DockPosition = 'top' | 'bottom' | 'left' | 'right';

export interface DockState {
    // Visibility state for each dock
    visibility: {
        top: boolean;
        bottom: boolean;
        left: boolean;
        right: boolean;
    };

    // Actions
    toggleDock: (position: DockPosition) => void;
    setDockVisible: (position: DockPosition, visible: boolean) => void;
    showDock: (position: DockPosition) => void;
    hideDock: (position: DockPosition) => void;
}

export const useDockStore = create<DockState>()(
    persist(
        (set) => ({
            visibility: {
                top: true,
                bottom: true,
                left: false,
                right: false,
            },

            toggleDock: (position) =>
                set((state) => ({
                    visibility: {
                        ...state.visibility,
                        [position]: !state.visibility[position],
                    },
                })),

            setDockVisible: (position, visible) =>
                set((state) => ({
                    visibility: {
                        ...state.visibility,
                        [position]: visible,
                    },
                })),

            showDock: (position) =>
                set((state) => ({
                    visibility: {
                        ...state.visibility,
                        [position]: true,
                    },
                })),

            hideDock: (position) =>
                set((state) => ({
                    visibility: {
                        ...state.visibility,
                        [position]: false,
                    },
                })),
        }),
        {
            name: 'dock-state',
        }
    )
);
