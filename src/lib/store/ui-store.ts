import { create } from 'zustand';
import type { TaskRecord } from "@/components/TaskEditorModal";

interface UIState {
    isNavVisible: boolean;
    setNavVisible: (visible: boolean) => void;
    clickOrigin: { x: number; y: number } | null;
    setClickOrigin: (origin: { x: number; y: number } | null) => void;

    // Modals
    showAbout: boolean;
    setShowAbout: (show: boolean) => void;
    showGraph: boolean;
    setShowGraph: (show: boolean) => void;
    showWaterfall: boolean;
    setShowWaterfall: (show: boolean) => void;
    showReport: boolean;
    setShowReport: (show: boolean) => void;
    showPersonalization: boolean;
    setShowPersonalization: (show: boolean) => void;
    showRantModal: boolean;
    setShowRantModal: (show: boolean) => void;

    // Task Editor
    showTaskEditor: boolean;
    editingTask: TaskRecord | null;
    openTaskEditor: (task?: TaskRecord | null) => void;
    closeTaskEditor: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isNavVisible: true,
    setNavVisible: (visible) => set({ isNavVisible: visible }),
    clickOrigin: null,
    setClickOrigin: (origin) => set({ clickOrigin: origin }),

    showAbout: false,
    setShowAbout: (show) => set({ showAbout: show }),
    showGraph: false,
    setShowGraph: (show) => set({ showGraph: show }),
    showWaterfall: false,
    setShowWaterfall: (show) => set({ showWaterfall: show }),
    showReport: false,
    setShowReport: (show) => set({ showReport: show }),
    showPersonalization: false,
    setShowPersonalization: (show) => set({ showPersonalization: show }),
    showRantModal: false,
    setShowRantModal: (show) => set({ showRantModal: show }),

    showTaskEditor: false,
    editingTask: null,
    openTaskEditor: (task = null) => set({ showTaskEditor: true, editingTask: task }),
    closeTaskEditor: () => set({ showTaskEditor: false, editingTask: null }),
}));
