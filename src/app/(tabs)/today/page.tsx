"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Plus,
  Target,
  Trash2,
  Calendar,
  Clock,
  PartyPopper,
  Check,
} from "lucide-react";
import { usePlatformStore } from "@/lib/store/platform-store";
import { TaskRecord } from "@/components/TaskEditorModal";
import SwipeToCreate from "@/components/SwipeToCreate";
import { scoreSingleTask } from "@/lib/actions/scoring";
import { CircularDatePicker } from "@/ui/CircularDatePicker";
import { motion, AnimatePresence, useMotionValue, PanInfo } from "framer-motion";
import { useUIStore } from "@/lib/store/ui-store";
import ViewSelector, { TaskViewMode } from "@/components/today/ViewSelector";
import SingleLineTaskView from "@/components/today/SingleLineTaskView";
import { computeRange } from "@/lib/utils/date";


let hasResetOnReload = false;

export default function TodayPage() {
  const { data: session } = useSession();
  const signedIn = Boolean(session?.user?.email);

  const selectedDate = usePlatformStore(s => s.selectedDate);
  const viewMode = usePlatformStore(s => s.viewMode);
  const lfFilter = usePlatformStore(s => s.lfFilter);
  const taskViewMode = usePlatformStore(s => s.taskViewMode);
  const tasks = usePlatformStore(s => s.tasks);
  const refreshTasks = usePlatformStore(s => s.refreshTasks);
  const isLoadingTasks = usePlatformStore(s => s.isLoadingTasks);
  const setSelectedDate = usePlatformStore(s => s.setSelectedDate);
  const setViewMode = usePlatformStore(s => s.setViewMode);

  const dateObj = useMemo(() => new Date(selectedDate), [selectedDate]);
  const { setClickOrigin, openTaskEditor } = useUIStore();
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Reset to today/DAY ONLY on initial mount/reload
  useEffect(() => {
    if (!hasResetOnReload) {
      setSelectedDate(new Date());
      setViewMode("DAY");
      hasResetOnReload = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dateRange = useMemo(() => computeRange(viewMode, dateObj), [viewMode, dateObj]);
  
  const dateRangeKey = useMemo(() => `${dateRange.start}-${dateRange.end}`, [dateRange.start, dateRange.end]);
  const lastRefreshedKey = useRef<string>("");

  useEffect(() => {
    console.log('useEffect triggered', { signedIn, dateRangeKey, lastRefreshed: lastRefreshedKey.current });
    if (signedIn && dateRangeKey !== lastRefreshedKey.current) {
      console.log('Calling refreshTasks with', dateRange);
      lastRefreshedKey.current = dateRangeKey;
      refreshTasks(dateRange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, dateRangeKey]);

  const handleSave = useCallback(async () => {
    const state = usePlatformStore.getState();
    const dateObj = new Date(state.selectedDate);
    const range = computeRange(state.viewMode, dateObj);
    await state.refreshTasks(range);
  }, []);

  const openEditor = useCallback((task?: TaskRecord, e?: React.MouseEvent | MouseEvent | null) => {
    if (e) {
      setClickOrigin({ x: e.clientX, y: e.clientY });
    } else {
      setClickOrigin(null);
    }

    // For new tasks, default to the currently selected date
    const record = task || {
      time: { due_date: selectedDate.slice(0, 10) }
    };
    openTaskEditor(record);
  }, [selectedDate, setClickOrigin, openTaskEditor]);

  const markDone = useCallback(
    async (task: TaskRecord): Promise<{ status: string; progress: number } | null> => {
      if (!task?.id) return null;
      const nextStatus = task.status === "done" ? "in_progress" : "done";
      const payload: Record<string, string | number> = { id: task.id, status: nextStatus };
      payload.progress = nextStatus === "done" ? 100 : task.progress ?? 0;
      const res = await fetch("/api/cogos/task/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await handleSave();
        return { status: nextStatus, progress: payload.progress as number };
      }
      return null;
    },
    [handleSave]
  );

  const handleBatchDelete = async () => {
    if (selectedTaskIds.size === 0 || isBatchProcessing) return;
    if (!confirm(`Are you sure you want to delete ${selectedTaskIds.size} tasks?`)) return;

    setIsBatchProcessing(true);
    try {
      const ids = Array.from(selectedTaskIds);
      // We'll loop for now as there's no deleteMany API yet, or I can create it.
      // Actually let's just loop to be safe and quick for now.
      await Promise.all(ids.map(id =>
        fetch("/api/cogos/task/delete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id }),
        })
      ));
      setSelectedTaskIds(new Set());
      await refreshTasks(dateRange);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchDone = async () => {
    if (selectedTaskIds.size === 0 || isBatchProcessing) return;
    setIsBatchProcessing(true);
    try {
      const ids = Array.from(selectedTaskIds);
      await Promise.all(ids.map(id =>
        fetch("/api/cogos/task/update", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id, status: "done", progress: 100 }),
        })
      ));
      setSelectedTaskIds(new Set());
      await refreshTasks(dateRange);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleScore = async (task: TaskRecord) => {
    if (!task.id) return;
    const result = await scoreSingleTask({
      id: task.id,
      title: task.title || "Untitled",
      status: task.status,
      duration_min: task.duration_min,
      lf: task.lf
    });
    alert(`🎯 SCORED: ${result.sps.toFixed(2)} SPS`);
  };

  const handleStepChange = async (taskId: string, step: number) => {
    try {
      const res = await fetch("/api/cogos/task/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: taskId, step }),
      });
      if (res.ok) {
        await refreshTasks(dateRange);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch("/api/cogos/task/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });
      if (res.ok) {
        await refreshTasks(dateRange);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTasks = useMemo(() => {
    let res = tasks;
    if (lfFilter !== null) {
      res = res.filter((t) => t.lf === lfFilter);
    }
    return res.sort((a: any, b: any) => {
      const ta = a.time?.start_at ? new Date(a.time.start_at).getTime() : 0;
      const tb = b.time?.start_at ? new Date(b.time.start_at).getTime() : 0;
      if (ta && tb) return ta - tb;
      if (ta) return -1;
      if (tb) return 1;
      return 0;
    });
  }, [tasks, lfFilter]);

  return (
    <SwipeToCreate onTrigger={() => openEditor()}>
      <div className="min-h-screen pb-32 pt-12 relative text-[var(--text-primary)] transition-colors duration-500">
        <div className="px-4 flex flex-col gap-4 relative mt-4">
          {taskViewMode === 'single-line' ? (
            <SingleLineTaskView
              tasks={filteredTasks}
              selectedIds={selectedTaskIds}
              onSelectionChange={setSelectedTaskIds}
              onTaskClick={(task, e) => openEditor(task, e)}
              onStepChange={handleStepChange}
              onStatusToggle={async (task) => { await markDone(task); }}
              onDelete={handleDeleteTask}
            />
          ) : (
            <>
              <div className="absolute left-8 top-0 bottom-0 w-px bg-[var(--glass-border)]" />
              <AnimatePresence>
                {filteredTasks.map((task, i) => (
                  <TodayTaskRow
                    key={task.id ?? `task-${i}`}
                    task={task}
                    index={i}
                    isSelected={task.id ? selectedTaskIds.has(task.id) : false}
                    onToggleSelection={(id) => {
                      const next = new Set(selectedTaskIds);
                      if (next.has(id)) next.delete(id); else next.add(id);
                      setSelectedTaskIds(next);
                    }}
                    markDone={markDone}
                    handleScore={handleScore}
                    openEditor={openEditor}
                  />
                ))}
              </AnimatePresence>
            </>
          )}

          {isLoadingTasks && <div className="py-10 text-center text-[var(--text-secondary)] text-sm animate-pulse">Loading thoughts...</div>}
          {!isLoadingTasks && filteredTasks.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--glass-bg)] mx-auto mb-4 flex items-center justify-center"><PartyPopper className="text-[var(--text-secondary)]" /></div>
              <p className="text-[var(--text-secondary)] text-sm">No tasks for this period.</p>
              <button onClick={(e) => openEditor(undefined, e as any)} className="mt-4 text-[var(--accent-color)] text-sm hover:underline">+ Create one</button>
            </div>
          )}
        </div>

        {/* Batch Action Bar */}
        <AnimatePresence>
          {selectedTaskIds.size > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] w-[90%] max-w-lg"
            >
              <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4 backdrop-blur-2xl">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Batch Action</span>
                  <span className="text-sm font-bold text-white">{selectedTaskIds.size} Selected</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTaskIds(new Set())}
                    className="px-3 py-2 rounded-xl text-[10px] font-bold text-white/40 hover:text-white transition-colors"
                  >
                    CLEAR
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    disabled={isBatchProcessing}
                    className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-20"
                  >
                    Delete
                  </button>
                  <button
                    onClick={handleBatchDone}
                    disabled={isBatchProcessing}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-20"
                  >
                    Mark Done
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Suspense fallback={null}><TaskEditorLauncher openEditor={openEditor} /></Suspense>
      </div>
    </SwipeToCreate >
  );
}

type TodayTaskRowProps = {
  task: TaskRecord;
  index: number;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  markDone: (task: TaskRecord) => Promise<{ status: string; progress: number } | null>;
  handleScore: (task: TaskRecord) => void;
  openEditor: (task: TaskRecord, e: MouseEvent | React.MouseEvent) => void;
};

function TodayTaskRow({ task, index, isSelected, onToggleSelection, markDone, handleScore, openEditor }: TodayTaskRowProps) {
  const isDone = task.status === "done";
  const dragX = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragLockRef = useRef(false);
  const resetTimerRef = useRef<number | null>(null);
  const dragThreshold = 140;
  const startTime = task.time?.start_at ? new Date(task.time.start_at) : null;
  const [savedProgress, setSavedProgress] = useState(task.progress ?? 0);
  const [draftProgress, setDraftProgress] = useState(savedProgress);
  const [progressUpdating, setProgressUpdating] = useState(false);

  useEffect(() => {
    const initial = task.progress ?? 0;
    setSavedProgress(initial);
    setDraftProgress(initial);
  }, [task.progress]);

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    setIsDragging(false);
    dragX.set(0);
    dragLockRef.current = true;
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => { dragLockRef.current = false; resetTimerRef.current = null; }, 220);
    if (info.offset.x > dragThreshold && !isDone) markDone(task);
  };

  const triggerMarkDone = async () => {
    const result = await markDone(task);
    if (!result) return;
    setSavedProgress(result.status === "done" ? 100 : result.progress ?? 0);
    setDraftProgress(result.status === "done" ? 100 : result.progress ?? 0);
  };

  const confirmProgress = async () => {
    if (progressUpdating || draftProgress === savedProgress) return;
    setProgressUpdating(true);
    try {
      const res = await fetch("/api/cogos/task/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: task.id, progress: draftProgress, status: draftProgress === 100 ? "done" : task.status }),
      });
      if (res.ok) {
        setSavedProgress(draftProgress);
        if (draftProgress === 100 && !isDone) await markDone(task);
      }
    } catch (error) { console.error(error); } finally { setProgressUpdating(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ delay: index * 0.05 }}
      drag="x"
      dragConstraints={{ left: 0, right: 150 }}
      dragElastic={0.25}
      dragMomentum={false}
      style={{ x: dragX }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      className="relative pl-8 group cursor-pointer"
      onClick={(e) => {
        if (dragLockRef.current || isDragging || (e.target as HTMLElement).closest('.selection-area')) return;
        openEditor(task, e);
      }}
    >
      {/* Multi-select Indicator */}
      <div
        className="selection-area absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center justify-center gap-1 z-10"
        onClick={(e) => { e.stopPropagation(); if (task.id) onToggleSelection(task.id); }}
      >
        <div className={`w-4 h-4 rounded-md border transition-all flex items-center justify-center ${isSelected
          ? "bg-white border-white text-black"
          : "border-white/10 group-hover:border-white/30"
          }`}>
          {isSelected && <Check size={10} strokeWidth={4} />}
        </div>
        <div className={`w-1 h-1 rounded-full border transition-all ${isDone ? "bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-[var(--text-primary)] border-[var(--text-secondary)] group-hover:border-[var(--text-primary)]"}`} />
      </div>

      <div className={`glass-card rounded-2xl p-4 flex items-start gap-4 transition-all ${isDone ? "opacity-60 grayscale" : ""} ${isSelected ? "border-white/30 bg-white/5 shadow-xl" : ""}`}>
        <div className="flex-shrink-0 pt-1">
          {startTime ? (
            <div className="text-center">
              <div className="text-xs font-bold text-[var(--text-primary)]">{startTime.getHours()}:{startTime.getMinutes().toString().padStart(2, "0")}</div>
              <div className="text-[10px] text-[var(--text-secondary)] uppercase font-medium">{startTime.getHours() >= 12 ? "PM" : "AM"}</div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--glass-bg)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]/30" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-base font-semibold leading-tight truncate ${isDone ? "line-through text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}>{task.title || "Untitled Task"}</h3>
          </div>
          {(task.notes || task.duration_min) && (
            <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
              {task.duration_min && <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[var(--text-secondary)]/40" />{task.duration_min} min</span>}
              {task.notes && <span className="truncate max-w-[150px]">{task.notes}</span>}
            </div>
          )}
          <div className="flex flex-col gap-2 mt-4 text-[var(--text-secondary)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {task.lf && <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black bg-[var(--glass-bg)] text-[var(--text-secondary)] border border-[var(--glass-border)]">LF{task.lf}</span>}
                <label className="flex items-center gap-2 rounded-full border border-[var(--glass-border)] px-3 py-1 transition-colors bg-[var(--glass-bg)] hover:border-[var(--text-primary)] text-[var(--text-secondary)]" onClick={(e) => { e.stopPropagation(); triggerMarkDone(); }} role="button">
                  <input type="checkbox" checked={isDone} onChange={(e) => { e.stopPropagation(); triggerMarkDone(); }} className="sr-only" />
                  <span className={`h-8 w-8 flex items-center justify-center rounded-full border transition ${isDone ? "bg-emerald-500 border-emerald-500 text-white" : "bg-transparent border-[var(--glass-border)] text-[var(--text-secondary)]"}`}><Check size={14} /></span>
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] transition ${isDone ? "text-emerald-400" : "text-[var(--text-secondary)]"}`}>{isDone ? "Done" : "Mark done"}</span>
                </label>
              </div>
              <button className="px-3 py-1 rounded-full bg-black/5 hover:bg-black/10 flex items-center gap-1 text-[11px] font-bold text-[var(--text-primary)] transition-colors" type="button" onClick={(e) => { e.stopPropagation(); handleScore(task); }}><Target size={14} className="text-blue-600" />Score</button>
            </div>
            <div className="flex items-center gap-3" onPointerDownCapture={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col text-[10px] uppercase tracking-[0.3em]"><span className="text-[var(--text-secondary)]">Progress</span><span className="text-[var(--text-primary)] font-semibold text-sm">{draftProgress}%</span></div>
              <input type="range" min={0} max={100} value={draftProgress} onChange={(e) => { e.stopPropagation(); setDraftProgress(Number(e.target.value)); }} className="flex-1 accent-[var(--accent-color)] h-2 rounded-lg" onMouseDown={(e) => e.stopPropagation()} />
              <div className="flex gap-1">
                <button type="button" onClick={(e) => { e.stopPropagation(); confirmProgress(); }} disabled={progressUpdating || draftProgress === savedProgress} className="h-6 w-6 rounded-full text-white flex items-center justify-center text-[12px] shadow-sm" style={{ backgroundColor: progressUpdating || draftProgress === savedProgress ? "rgba(16,185,129,0.4)" : "#16a34a" }}><Check size={12} /></button>
                <button type="button" onClick={(e) => { e.stopPropagation(); setDraftProgress(savedProgress); }} disabled={progressUpdating || draftProgress === savedProgress} className="h-6 w-6 rounded-full text-white flex items-center justify-center text-[12px] shadow-sm" style={{ backgroundColor: progressUpdating || draftProgress === savedProgress ? "rgba(239,68,68,0.4)" : "#dc2626" }}>✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TaskEditorLauncher({ openEditor }: { openEditor: (task?: TaskRecord) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("openTask") === "1") {
      openEditor();
      router.replace("/today", { scroll: false });
    }
  }, [openEditor, router, searchParams]);
  return null;
}
