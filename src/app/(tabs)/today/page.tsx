"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Plus,
  Target,
  SlidersHorizontal,
  PartyPopper,
  Settings,
  Search,
  Info,
  Check,
  Map,
  Activity,
  FileText,
  Fingerprint
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


export default function TodayPage() {
  const { data: session } = useSession();
  const signedIn = Boolean(session?.user?.email);
  const {
    selectedDate, viewMode,
    lfFilter, taskViewMode,
    tasks, refreshTasks, isLoadingTasks,
    setSelectedDate, setViewMode
  } = usePlatformStore();
  const dateObj = new Date(selectedDate);
  const { setClickOrigin, openTaskEditor } = useUIStore();

  // Reset to today/DAY on mount as requested
  useEffect(() => {
    setSelectedDate(new Date());
    setViewMode("DAY");
  }, [setSelectedDate, setViewMode]);

  const dateRange = useMemo(() => computeRange(viewMode, dateObj), [viewMode, dateObj]);

  useEffect(() => {
    if (signedIn) {
      refreshTasks(dateRange);
    }
  }, [signedIn, dateRange, refreshTasks]);

  const handleSave = useCallback(async () => {
    await refreshTasks();
  }, [refreshTasks]);

  const openEditor = useCallback((task?: TaskRecord, e?: MouseEvent) => {
    if (e) {
      setClickOrigin({ x: e.clientX, y: e.clientY });
    } else {
      setClickOrigin(null);
    }
    openTaskEditor(task ?? {});
  }, [setClickOrigin, openTaskEditor]);

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
      <div className="min-h-screen pb-32 pt-2 relative text-[var(--text-primary)] transition-colors duration-500">
        <div className="px-4 flex flex-col gap-4 relative mt-2">
          {taskViewMode === 'single-line' ? (
            <SingleLineTaskView
              tasks={filteredTasks}
              onTaskClick={(task) => openEditor(task)}
              onStepChange={handleStepChange}
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

        <Suspense fallback={null}><TaskEditorLauncher openEditor={openEditor} /></Suspense>
      </div>
    </SwipeToCreate >
  );
}

type TodayTaskRowProps = {
  task: TaskRecord;
  index: number;
  markDone: (task: TaskRecord) => Promise<{ status: string; progress: number } | null>;
  handleScore: (task: TaskRecord) => void;
  openEditor: (task?: TaskRecord, e?: MouseEvent) => void;
};

function TodayTaskRow({ task, index, markDone, handleScore, openEditor }: TodayTaskRowProps) {
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
        if (dragLockRef.current || isDragging) return;
        openEditor(task, e);
      }}
    >
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 flex justify-center">
        <div className={`w-3 h-3 rounded-full border-2 transition-all ${isDone ? "bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-[var(--text-primary)] border-[var(--text-secondary)] group-hover:border-[var(--text-primary)]"}`} />
      </div>

      <div className={`glass-card rounded-2xl p-4 flex items-start gap-4 ${isDone ? "opacity-60 grayscale" : ""}`}>
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
