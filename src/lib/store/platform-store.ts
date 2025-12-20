import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TaskRecord } from "@/components/TaskEditorModal";

export type ViewMode = "DAY" | "WEEK" | "SPRINT" | "MONTH" | "QUARTER";

interface PlatformState {
    selectedDate: string; // ISO string for persistence
    viewMode: ViewMode;
    lfFilter: number | null;
    taskViewMode: "compact" | "single-line";
    tasks: TaskRecord[];
    isLoadingTasks: boolean;

    // Actions
    setSelectedDate: (date: Date) => void;
    setViewMode: (mode: ViewMode) => void;
    setLfFilter: (filter: number | null) => void;
    setTaskViewMode: (mode: "compact" | "single-line") => void;
    setTasks: (tasks: TaskRecord[]) => void;
    refreshTasks: (range?: { start: string; end: string }) => Promise<void>;
}

export const usePlatformStore = create<PlatformState>()(
    persist(
        (set) => ({
            selectedDate: new Date().toISOString(),
            viewMode: "DAY",
            lfFilter: null,
            taskViewMode: "compact",
            tasks: [],
            isLoadingTasks: false,

            setSelectedDate: (date) => set({ selectedDate: date.toISOString() }),
            setViewMode: (mode) => set({ viewMode: mode }),
            setLfFilter: (filter) => set({ lfFilter: filter }),
            setTaskViewMode: (mode) => set({ taskViewMode: mode }),
            setTasks: (tasks) => set({ tasks }),
            refreshTasks: async (range?: { start: string; end: string }) => {
                const state = usePlatformStore.getState();
                const { selectedDate, viewMode } = state;

                // If no range provided, compute it from current state
                let targetRange = range;
                if (!targetRange) {
                    const { computeRange } = await import("@/lib/utils/date");
                    targetRange = computeRange(viewMode, new Date(selectedDate));
                }

                set({ isLoadingTasks: true });
                try {
                    const qs = new URLSearchParams({ start: targetRange.start, end: targetRange.end });
                    const res = await fetch(`/api/cogos/task/list?${qs}`);
                    const j = await res.json();
                    if (j.tasks) set({ tasks: j.tasks });
                } catch (e) {
                    console.error("refreshTasks failed", e);
                } finally {
                    set({ isLoadingTasks: false });
                }
            }
        }),
        {
            name: 'platform-state',
        }
    )
);
