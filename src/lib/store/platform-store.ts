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
    showAccomplishments: boolean;

    // Actions
    setSelectedDate: (date: Date) => void;
    setViewMode: (mode: ViewMode) => void;
    setLfFilter: (filter: number | null) => void;
    setTaskViewMode: (mode: "compact" | "single-line") => void;
    setTasks: (tasks: TaskRecord[]) => void;
    setShowAccomplishments: (show: boolean) => void;
    refreshTasks: (range?: { start: string; end: string }) => Promise<void>;
}

let pendingTaskRefreshKey: string | null = null;
let pendingTaskRefreshPromise: Promise<void> | null = null;

export const usePlatformStore = create<PlatformState>()(
    persist(
        (set) => ({
            selectedDate: new Date().toISOString(),
            viewMode: "DAY",
            lfFilter: null,
            taskViewMode: "compact",
            tasks: [],
            isLoadingTasks: false,
            showAccomplishments: false,

            setSelectedDate: (date) => set({ selectedDate: date.toISOString() }),
            setViewMode: (mode) => set({ viewMode: mode }),
            setLfFilter: (filter) => set({ lfFilter: filter }),
            setTaskViewMode: (mode) => set({ taskViewMode: mode }),
            setTasks: (tasks) => set({ tasks }),
            setShowAccomplishments: (show) => set({ showAccomplishments: show }),
            refreshTasks: async (range?: { start: string; end: string }) => {
                const state = usePlatformStore.getState();
                const { selectedDate, viewMode } = state;
                let targetRange = range;
                if (!targetRange) {
                    const { computeRange } = await import("@/lib/utils/date");
                    targetRange = computeRange(viewMode, new Date(selectedDate));
                }

                const { start, end } = targetRange;
                const rangeKey = `${start}-${end}`;
                if (pendingTaskRefreshPromise && pendingTaskRefreshKey === rangeKey) {
                    // reuse the existing request for the same range while it is still inflight
                    return pendingTaskRefreshPromise;
                }

                if (state.isLoadingTasks) {
                    return pendingTaskRefreshPromise ?? Promise.resolve();
                }

                pendingTaskRefreshKey = rangeKey;
                set({ isLoadingTasks: true });
                pendingTaskRefreshPromise = (async () => {
                    try {
                        const qs = new URLSearchParams({ start, end });
                        const res = await fetch(`/api/cogos/task/list?${qs}`);
                        const j = await res.json();
                        if (j.tasks) set({ tasks: j.tasks });
                    } catch (e) {
                        console.error("refreshTasks failed", e);
                    } finally {
                        set({ isLoadingTasks: false });
                        pendingTaskRefreshPromise = null;
                        pendingTaskRefreshKey = null;
                    }
                })();
                return pendingTaskRefreshPromise;
            }
        }),
        {
            name: 'platform-state',
            partialize: (state) => ({
                selectedDate: state.selectedDate,
                viewMode: state.viewMode,
                lfFilter: state.lfFilter,
                taskViewMode: state.taskViewMode,
            }),
        }
    )
);
