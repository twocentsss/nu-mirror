"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Target, SlidersHorizontal, PartyPopper, Settings, Search, Info, Check, Map, Activity, FileText, Fingerprint } from "lucide-react"; // Icons
import AboutModal from "@/components/AboutModal";
import TaskEditorModal, { TaskRecord } from "@/components/TaskEditorModal";
import { WorldGraphView } from "@/components/WorldGraphView";
import { DayWaterfallView } from "@/components/DayWaterfallView";
import { EndOfDayReport } from "@/components/EndOfDayReport";
import { PersonalizationView } from "@/components/PersonalizationView";
import SwipeToCreate from "@/components/SwipeToCreate";
import { scoreSingleTask } from "@/lib/actions/scoring";
import { CircularDatePicker } from "@/ui/CircularDatePicker";
import { motion, AnimatePresence, useMotionValue, PanInfo } from "framer-motion";
import { useUIStore } from "@/lib/store/ui-store";
import ViewSelector, { TaskViewMode } from "@/components/today/ViewSelector";
import SingleLineTaskView from "@/components/today/SingleLineTaskView";

type ViewMode = "DAY" | "WEEK" | "SPRINT" | "MONTH" | "QUARTER";

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  DAY: "Day",
  WEEK: "Week",
  SPRINT: "Sprint",
  MONTH: "Month",
  QUARTER: "Quarter",
};

function formatISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function computeRange(mode: ViewMode, baseDate: Date) {
  const start = new Date(baseDate);
  const end = new Date(baseDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  switch (mode) {
    case "DAY":
      break;
    case "WEEK":
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      end.setDate(start.getDate() + 6);
      break;
    case "SPRINT":
      const currentDay = start.getDay();
      const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      start.setDate(start.getDate() + daysToMonday);
      end.setDate(start.getDate() + 13);
      break;
    case "MONTH":
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      break;
    case "QUARTER":
      const month = start.getMonth();
      const quarterStart = Math.floor(month / 3) * 3;
      start.setMonth(quarterStart);
      start.setDate(1);
      end.setMonth(quarterStart + 3);
      end.setDate(0);
      break;
  }

  return { start: formatISODate(start), end: formatISODate(end) };
}

export default function TodayPage() {
  const { data: session } = useSession();
  const signedIn = Boolean(session?.user?.email);
  const { isNavVisible, setClickOrigin } = useUIStore();

  const [loadingTasks, setLoadingTasks] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("DAY");
  const [lfFilter, setLfFilter] = useState<number | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [showAbout, setShowAbout] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showWaterfall, setShowWaterfall] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [taskViewMode, setTaskViewMode] = useState<TaskViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('today-view-mode') as TaskViewMode) || 'compact';
    }
    return 'compact';
  });

  const dateRange = useMemo(() => computeRange(viewMode, selectedDate), [viewMode, selectedDate]);

  const fetchTasks = useCallback(async (range: { start: string; end: string }) => {
    if (!signedIn) return;
    setLoadingTasks(true);
    try {
      const qs = new URLSearchParams({ start: range.start, end: range.end });
      const res = await fetch(`/api/cogos/task/list?${qs}`);
      const j = await res.json();
      if (j.tasks) setTasks(j.tasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTasks(false);
    }
  }, [signedIn]);

  useEffect(() => {
    fetchTasks(dateRange);
  }, [fetchTasks, dateRange]);

  const handleSave = useCallback(async () => {
    await fetchTasks(dateRange);
    setIsEditorOpen(false);
    setEditingTask(null);
  }, [fetchTasks, dateRange]);

  const openEditor = useCallback((task?: TaskRecord, e?: MouseEvent) => {
    if (e) {
      setClickOrigin({ x: e.clientX, y: e.clientY });
    } else {
      setClickOrigin(null);
    }
    setEditingTask(task ?? {});
    setIsEditorOpen(true);
  }, [setClickOrigin]);

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
    }, [handleSave]);

  const handleScore = async (task: TaskRecord) => {
    const result = await scoreSingleTask({
      id: task.id || `temp-${Date.now()}`,
      title: task.title || "Untitled",
      status: task.status,
      duration_min: task.duration_min,
      lf: task.lf
    });

    alert(`🎯 SCORED: ${result.sps.toFixed(2)} SPS\n\nAccount: ${result.accountCode}\nBPS: ${result.bps.toFixed(2)} (Base)\n\n(See Console for Journal Entry)`);
  };

  const handleStepChange = useCallback(async (taskId: string, step: number) => {
    try {
      const res = await fetch("/api/cogos/task/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: taskId, step }),
      });
      if (res.ok) {
        await fetchTasks(dateRange);
      }
    } catch (e) {
      console.error(e);
    }
  }, [fetchTasks, dateRange]);

  const handleViewChange = useCallback((view: TaskViewMode) => {
    setTaskViewMode(view);
    localStorage.setItem('today-view-mode', view);
  }, []);

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

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(selectedDate);

  return (
    <SwipeToCreate onTrigger={() => openEditor()}>
      <div className="min-h-screen pb-32 relative text-[var(--text-primary)] transition-colors duration-500">

        <motion.div
          initial={false}
          animate={{ y: isNavVisible ? 0 : -200, opacity: isNavVisible ? 1 : 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="sticky top-0 z-50 pt-4 px-4 pb-4 bg-transparent pointer-events-none"
        >
          <div className="glass-panel rounded-3xl p-4 flex flex-col gap-4 pointer-events-auto shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setSelectedDate(newDate);
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--glass-bg)] text-[var(--text-secondary)]"
                    >
                      ←
                    </button>
                    <label className="text-2xl font-bold tracking-tight text-[var(--text-primary)] cursor-pointer flex items-center gap-1 hover:opacity-80 transition">
                      {dayName}, {selectedDate.getDate()}
                      <input
                        type="date"
                        className="opacity-0 absolute w-0 h-0"
                        value={selectedDate.toISOString().slice(0, 10)}
                        onChange={(e) => {
                          if (e.target.valueAsDate) setSelectedDate(e.target.valueAsDate);
                        }}
                      />
                    </label>
                    <button
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setSelectedDate(newDate);
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--glass-bg)] text-[var(--text-secondary)]"
                    >
                      →
                    </button>
                  </div>
                  <p className="text-[var(--text-secondary)] text-xs font-medium uppercase tracking-wider ml-8">
                    {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="bg-[var(--glass-bg)] rounded-full px-3 py-1 flex items-center gap-2 border border-[var(--glass-border)]">
                  <PartyPopper size={14} className="text-[var(--accent-color)]" />
                  <span className="text-xs font-bold text-[var(--text-secondary)]">{completedCount}/{totalTasks}</span>
                </div>

                <div className="flex bg-[var(--glass-bg)] rounded-full border border-[var(--glass-border)] p-1 gap-1">
                  <button onClick={() => setShowPersonalization(true)} className="p-1.5 rounded-full hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title="Nu Flow Protocol">
                    <Fingerprint size={16} />
                  </button>
                  <button onClick={() => alert("Search")} className="p-1.5 rounded-full hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <Search size={16} />
                  </button>
                  <button onClick={() => alert("Settings")} className="p-1.5 rounded-full hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <Settings size={16} />
                  </button>
                  <button onClick={() => setShowGraph(true)} className="p-1.5 rounded-full hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title="Mental Map">
                    <Map size={16} />
                  </button>
                  <button onClick={() => setShowWaterfall(true)} className="p-1.5 rounded-full hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title="Day Waterfall">
                    <Activity size={16} />
                  </button>
                  <button onClick={() => setShowReport(true)} className="p-1.5 rounded-full hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title="End of Day Report">
                    <FileText size={16} />
                  </button>
                  <button onClick={() => setShowAbout(true)} className="p-1.5 rounded-full hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <Info size={16} />
                  </button>
                </div>

                <button
                  className="h-9 w-9 rounded-full bg-black hover:opacity-90 flex items-center justify-center shadow-lg transition-all text-white"
                  onClick={(e) => openEditor(undefined, e)}
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="-mx-2">
              <CircularDatePicker
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>

            <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
              <div className="flex bg-[var(--glass-bg)] rounded-full p-1 border border-[var(--glass-border)]">
                {(["DAY", "WEEK", "SPRINT", "MONTH", "QUARTER"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${viewMode === mode
                      ? "bg-black text-white shadow-md"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5"
                      }`}
                  >
                    {VIEW_MODE_LABELS[mode]}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <ViewSelector view={taskViewMode} onChange={handleViewChange} />
                <button
                  onClick={() => setLfFilter(lfFilter === null ? 1 : null)}
                  className={`h-8 px-3 rounded-full border text-[10px] font-bold transition-all flex items-center gap-1 ${lfFilter !== null
                    ? "bg-[var(--accent-color)]/20 border-[var(--accent-color)]/50 text-[var(--accent-color)]"
                    : "bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg)]/80"
                    }`}
                >
                  <SlidersHorizontal size={12} />
                  {lfFilter ? `LF${lfFilter}` : "Filter"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {lfFilter !== null && (
          <div className="px-4 mb-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
              <button
                onClick={() => setLfFilter(null)}
                className="px-3 py-1 rounded-full bg-[var(--glass-bg)] text-[var(--text-secondary)] text-xs font-bold whitespace-nowrap"
              >
                Clear
              </button>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lf => (
                <button
                  key={lf}
                  onClick={() => setLfFilter(lf)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${lfFilter === lf
                    ? "bg-[var(--accent-color)] text-white shadow-lg"
                    : "bg-[var(--glass-bg)] text-[var(--text-secondary)]"
                    }`}
                >
                  LF {lf}
                </button>
              ))}
            </div>
          </div>
        )}

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

          {loadingTasks && <div className="py-10 text-center text-[var(--text-secondary)] text-sm animate-pulse">Loading thoughts...</div>}
          {!loadingTasks && filteredTasks.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--glass-bg)] mx-auto mb-4 flex items-center justify-center"><PartyPopper className="text-[var(--text-secondary)]" /></div>
              <p className="text-[var(--text-secondary)] text-sm">No tasks for this period.</p>
              <button onClick={(e) => openEditor(undefined, e as any)} className="mt-4 text-[var(--accent-color)] text-sm hover:underline">+ Create one</button>
            </div>
          )}
        </div>

        <Suspense fallback={null}><TaskEditorLauncher openEditor={openEditor} /></Suspense>
        <TaskEditorModal
          task={editingTask}
          allTasks={tasks}
          open={isEditorOpen}
          onClose={() => { setIsEditorOpen(false); setEditingTask(null); }}
          onChanged={handleSave}
        />
        <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
        <AnimatePresence>
          {showGraph && <WorldGraphView key="graph" tasks={tasks} onClose={() => setShowGraph(false)} />}
          {showWaterfall && <DayWaterfallView key="waterfall" tasks={tasks} onClose={() => setShowWaterfall(false)} />}
          {showReport && <EndOfDayReport key="report" tasks={tasks} date={selectedDate} onClose={() => setShowReport(false)} />}
          {showPersonalization && <PersonalizationView key="personalization" onClose={() => setShowPersonalization(false)} />}
        </AnimatePresence>
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
