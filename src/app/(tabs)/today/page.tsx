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
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Settings,
  Search,
  Fingerprint,
  Info,
  HelpCircle,
  Map,
  Activity,
  FileText,
  BarChart2,
  Cpu,
  BookOpen,
  Image as ImageIcon,
  Zap
} from "lucide-react";
import { DockActionId } from "@/ui/DockPad";
import { usePlatformStore, ViewMode } from "@/lib/store/platform-store";
import { TaskRecord, WORLDS } from "@/components/TaskEditorModal";
import SwipeToCreate from "@/components/SwipeToCreate";
import { scoreSingleTask } from "@/lib/actions/scoring";
import { CircularDatePicker } from "@/ui/CircularDatePicker";
import { motion, AnimatePresence, useMotionValue, PanInfo } from "framer-motion";
import { useUIStore } from "@/lib/store/ui-store";
import ViewSelector, { TaskViewMode } from "@/components/today/ViewSelector";
import SingleLineTaskView from "@/components/today/SingleLineTaskView";
import { computeRange } from "@/lib/utils/date";
import { CustomSelect } from "@/ui/CustomSelect";
import { usePersona } from "@/hooks/usePersona";
import { format, addMinutes, startOfDay, parseISO } from 'date-fns';
import TimelineView from "@/components/today/TimelineView";
import { computeNextDueDate } from "@/lib/utils/recurrence";

const PERSONA_LABELS = {
  DEVELOPER: {
    title: "Terminal",
    new: "New Entry",
    batch: "Bulk Action",
    empty: "Backlog empty. System clear.",
    intake: "Buffer",
    doing: "Active",
    done: "Deployed",
    stats: "Efficiency",
  },
  EXECUTIVE: {
    title: "Intelligence",
    new: "New Initiative",
    batch: "Strategy",
    empty: "Schedule clear. Growth opportunity.",
    intake: "Pending",
    doing: "Executing",
    done: "Outcome",
    stats: "ROI",
  },
  ZEN: {
    title: "Presence",
    new: "New Intention",
    batch: "Harmony",
    empty: "Silence. Peace is found here.",
    intake: "Awaiting",
    doing: "Flow",
    done: "Realized",
    stats: "Energy",
  },
  CURRENT: {
    title: "Tasks",
    new: "Create Task",
    batch: "Batch Action",
    empty: "No tasks for this period.",
    intake: "Intake",
    doing: "Doing",
    done: "Done",
    stats: "Score",
  },
  SIMPLE1: {
    title: "Focus",
    new: "New",
    batch: "Manage",
    empty: "Nothing here.",
    intake: "Todo",
    doing: "Doing",
    done: "Done",
    stats: "Stats",
  },
  SIMPLE2: {
    title: "Focus",
    new: "New",
    batch: "Manage",
    empty: "Nothing here.",
    intake: "Todo",
    doing: "Doing",
    done: "Done",
    stats: "Stats",
  },
  SIMPLE3: {
    title: "Focus",
    new: "New",
    batch: "Manage",
    empty: "Nothing here.",
    intake: "Todo",
    doing: "Doing",
    done: "Done",
    stats: "Stats",
  }
};


let hasResetOnReload = false;

export default function TodayPage() {
  const { data: session } = useSession();
  const signedIn = Boolean(session?.user?.email);

  const selectedDate = usePlatformStore(s => s.selectedDate);
  const viewMode = usePlatformStore(s => s.viewMode);
  const lfFilter = usePlatformStore(s => s.lfFilter);
  const setLfFilter = usePlatformStore(s => s.setLfFilter);
  const taskViewMode = usePlatformStore(s => s.taskViewMode);
  const setTaskViewMode = usePlatformStore(s => s.setTaskViewMode);
  const tasks = usePlatformStore(s => s.tasks);
  const refreshTasks = usePlatformStore(s => s.refreshTasks);
  const isLoadingTasks = usePlatformStore(s => s.isLoadingTasks);
  const setSelectedDate = usePlatformStore(s => s.setSelectedDate);
  const setViewMode = usePlatformStore(s => s.setViewMode);
  const showAccomplishments = usePlatformStore(s => s.showAccomplishments);
  const { persona } = usePersona();

  const labels = PERSONA_LABELS[persona];

  const VIEW_MODES: ViewMode[] = ["DAY", "WEEK", "SPRINT", "MONTH", "QUARTER"];

  const dateObj = useMemo(() => new Date(selectedDate), [selectedDate]);
  const { setClickOrigin, openTaskEditor } = useUIStore();
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchStatus, setBatchStatus] = useState<"intake" | "doing" | "done">("done");
  const [batchPreset, setBatchPreset] = useState<"next_day" | "next_week" | "next_sprint" | "next_month">("next_day");
  const [goalFilter, setGoalFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortKey, setSortKey] = useState<"lf" | "title">("lf");
  const [showFilters, setShowFilters] = useState(false);

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
  const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(dateObj);

  const handlePrevDay = () => {
    const d = new Date(dateObj);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(dateObj);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

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

      // Routine Logic: If marking done and is a routine, spawn next instance
      if (task.status !== "done" && task.is_routine && task.recurrence) {
        // Calculate next due date
        // (Use dynamic import or move utility to shared location)
        // For client-side simplicity, we'll fetch a helper or just do simple math, 
        // BUT ideally we use the shared utility.
        // Let's import the utility at the top of the file.
        // For this chunk replacement, assuming computeNextDueDate is imported.

        try {
          // We need to calculate based on 'due_date' or 'today' depending on strictness.
          // Usually routines are based on previous due date.
          const lastOccurrenceDate = task.time?.due_date ? new Date(task.time.due_date) : new Date();
          const completionDate = new Date();
          const nextDate = computeNextDueDate(task.recurrence, lastOccurrenceDate, completionDate, task.completion_policy || 'floating');
          const nextDateStr = nextDate.toISOString().slice(0, 10); // YYYY-MM-DD

          await fetch("/api/cogos/task/create", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              title: task.title,
              status: "intake",
              due_date: nextDateStr,
              time_of_day: task.time?.time_of_day || "ANYTIME",
              duration_min: task.duration_min,
              lf: task.lf,
              goal: task.goal,
              project: task.project,
              is_routine: true,
              recurrence: task.recurrence // Propagate recurrence
            })
          });
        } catch (e) { console.error("Routine spawn failed", e); }
      }

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

  const handleSelectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id).filter((id): id is string => !!id)));
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

  const handleBatchStatusUpdate = async () => {
    if (selectedTaskIds.size === 0 || isBatchProcessing) return;
    setIsBatchProcessing(true);
    try {
      const ids = Array.from(selectedTaskIds);
      await Promise.all(
        ids.map(id => {
          const payload: Record<string, string | number | undefined> = { id, status: batchStatus };
          if (batchStatus === "done") payload.progress = 100;
          return fetch("/api/cogos/task/update", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
        })
      );
      setSelectedTaskIds(new Set());
      await refreshTasks(dateRange);
    } catch (e) {
      console.error(e);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const computePresetDate = (preset: "next_day" | "next_week" | "next_sprint" | "next_month") => {
    const date = new Date();
    switch (preset) {
      case "next_day":
        date.setDate(date.getDate() + 1);
        break;
      case "next_week":
        date.setDate(date.getDate() + 7);
        break;
      case "next_sprint":
        date.setDate(date.getDate() + 14);
        break;
      case "next_month":
        date.setMonth(date.getMonth() + 1);
        break;
    }
    return date.toISOString().slice(0, 10);
  };

  const handleBatchReschedule = async () => {
    if (selectedTaskIds.size === 0 || isBatchProcessing) return;
    setIsBatchProcessing(true);
    try {
      const due_date = computePresetDate(batchPreset);
      const ids = Array.from(selectedTaskIds);
      await Promise.all(ids.map(id =>
        fetch("/api/cogos/task/update", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id, due_date }),
        })
      ));
      setSelectedTaskIds(new Set());
      await refreshTasks(dateRange);
    } catch (e) {
      console.error(e);
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

  const uniqueGoals = useMemo(() => {
    return Array.from(new Set(tasks.map(t => t.goal ?? "unassigned").sort()));
  }, [tasks]);
  const uniqueProjects = useMemo(() => {
    return Array.from(new Set(tasks.map(t => t.project ?? "unassigned").sort()));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let res = tasks;

    // Filter based on accomplishments mode
    if (showAccomplishments) {
      res = res.filter((t) => t.status === "done");
    } else {
      res = res.filter((t) => t.status !== "done");
    }

    if (lfFilter !== null) {
      res = res.filter((t) => t.lf === lfFilter);
    }
    if (goalFilter !== "all") {
      res = res.filter((t) => (t.goal ?? "unassigned") === goalFilter);
    }
    if (projectFilter !== "all") {
      res = res.filter((t) => (t.project ?? "unassigned") === projectFilter);
    }

    return res.sort((a: any, b: any) => {
      if (sortKey === "lf") {
        const al = a.lf ?? 0;
        const bl = b.lf ?? 0;
        if (al === bl) return (a.title ?? "").localeCompare(b.title ?? "");
        return al - bl;
      }
      return (a.title ?? "").localeCompare(b.title ?? "");
    });
  }, [tasks, showAccomplishments, lfFilter, goalFilter, projectFilter, sortKey]);

  return (
    <SwipeToCreate onTrigger={() => openEditor()}>
      <div className="min-h-screen pb-32 pt-12 relative text-[var(--text-primary)] transition-colors duration-500">
        <div className="px-4 flex flex-col gap-4 relative mt-4">
          <AnimatePresence>
            {selectedTaskIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] w-[90%] max-w-3xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-3xl p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-white/40">
                  <span>{selectedTaskIds.size} selected</span>
                  <button onClick={() => setSelectedTaskIds(new Set())} className="text-white/60 hover:text-white transition">CLEAR</button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/70">
                    Update status:
                    <select
                      className="rounded-full bg-white/5 text-white/90 border border-white/10 px-3 py-1 text-xs"
                      value={batchStatus}
                      onChange={(e) => setBatchStatus(e.target.value as "intake" | "doing" | "done")}
                    >
                      {["intake", "doing", "done"].map((status) => (
                        <option key={status} value={status}>{status.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleBatchStatusUpdate}
                    disabled={isBatchProcessing}
                    className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-white/20 bg-white/10 hover:bg-white/20 transition disabled:opacity-30"
                  >
                    Update
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    disabled={isBatchProcessing}
                    className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-red-500 text-red-400 hover:bg-red-500/10 transition disabled:opacity-30"
                  >
                    Delete
                  </button>
                  <button
                    onClick={handleBatchDone}
                    disabled={isBatchProcessing}
                    className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 transition disabled:opacity-30"
                  >
                    Mark Done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Main Navigation Header (Transplanted from DockPad) */}
          <div className="flex flex-col gap-6 items-center px-4 pt-2">
            {/* Date Row */}
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <button onClick={handlePrevDay} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-[var(--text-secondary)]">
                      <ChevronLeft size={20} />
                    </button>
                    <div className="relative">
                      <h2 className="text-3xl font-greeting font-bold tracking-tight text-[var(--text-primary)] cursor-pointer hover:opacity-80 transition flex items-center gap-2">
                        {dayName}, {dateObj.getDate()}
                        <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full" value={dateObj.toISOString().slice(0, 10)} onChange={(e) => { const d = e.target.valueAsDate; if (d) setSelectedDate(d); }} />
                      </h2>
                    </div>
                    <button onClick={handleNextDay} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-[var(--text-secondary)]">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <p className="text-[var(--text-secondary)] text-xs font-medium uppercase tracking-wider ml-8">
                    {dateObj.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => usePlatformStore.setState({ showAccomplishments: !showAccomplishments })} className={`rounded-full px-4 py-1.5 flex items-center gap-2 border shadow-sm transition-all hover:scale-105 active:scale-95 ${showAccomplishments ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600' : 'bg-black/5 border-black/5'}`}>
                  <Target size={14} className={showAccomplishments ? 'text-emerald-600' : 'text-[var(--accent-color)]'} />
                  <span className="text-xs font-bold">{showAccomplishments ? 'Completed' : 'Accomplished'}</span>
                </button>

                <div className="flex bg-black/5 rounded-full border border-black/5 p-1 gap-1 items-center">
                  {[
                    { id: "protocol", icon: <Fingerprint size={16} />, title: persona === 'DEVELOPER' ? "Auth" : "ID", color: "hover:text-blue-400" },
                    { id: "search", icon: <Search size={16} />, title: "Search", color: "hover:text-zinc-400" },
                    { id: "settings", icon: <Settings size={16} />, title: "Settings", color: "hover:text-zinc-400" },
                    { id: "graph", icon: <Map size={16} />, title: "Map", color: "hover:text-emerald-400" },
                    { id: "waterfall", icon: <Activity size={16} />, title: "Flow", color: "hover:text-amber-400" },
                    { id: "report", icon: <FileText size={16} />, title: "Files", color: "hover:text-purple-400" },
                    { id: "howto", icon: <HelpCircle size={16} />, title: "Tips", color: "hover:text-blue-500" },
                    { id: "about", icon: <Info size={16} />, title: "Info", color: "hover:text-zinc-400" },
                  ].map((it: any) => (
                    <button key={it.id} onClick={(e) => { setClickOrigin({ x: e.clientX, y: e.clientY }); openTaskEditor({} as any); /* Placeholder action trigger needed? */ /* Wait, today page handles task editor. We need generic action handler? Reuse from layout props? */ }} className={`p-2 rounded-full hover:bg-[var(--glass-border)] text-[var(--text-secondary)] ${it.color} hover:shadow-sm transition-all duration-300`} title={it.title}>
                      {it.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Circular Date Picker */}
            <div className="w-full max-w-xl scale-90 -my-4">
              <CircularDatePicker selectedDate={dateObj} onDateChange={setSelectedDate} />
            </div>

            {/* View Options */}
            <div className="w-full flex items-center justify-center pb-2">
              <div className="flex bg-black/5 rounded-full p-1 border border-black/5 shadow-sm">
                {VIEW_MODES.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-5 py-2 rounded-full text-[11px] font-bold transition-all ${viewMode === mode
                      ? "bg-black text-white shadow-md scale-105"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Calm Header & Filter Toggle (Moved Below) */}
            <div className="w-full flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                {labels.title}
                <span className="ml-2 text-sm font-normal text-[var(--text-secondary)] opacity-60">{filteredTasks.length}</span>
              </h2>
              <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-full transition-all ${showFilters ? "bg-[var(--text-primary)] text-[var(--app-bg)]" : "bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
                <SlidersHorizontal size={16} />
              </button>
            </div>
          </div>

          {/* Progressive Disclosure: Filters & Controls */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-3 px-4 py-4 bg-[var(--glass-bg)] border-y border-[var(--glass-border)] backdrop-blur-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    {taskViewMode === 'timeline' && (
                      <div className="mr-2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-black text-red-500 tabular-nums">
                          {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={handleSelectAll}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0 ? "bg-[var(--text-primary)] text-[var(--app-bg)] border-[var(--text-primary)]" : "border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"}`}
                    >
                      {selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0 ? "Deselect All" : "Select All"}
                    </button>
                    <ViewSelector view={taskViewMode} onChange={setTaskViewMode} />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <CustomSelect
                      value={lfFilter ?? "all"}
                      onChange={(val) => setLfFilter(val === "all" ? null : Number(val))}
                      options={[
                        { value: "all", label: "All Focus" },
                        ...WORLDS.map(w => ({ value: w.id, label: w.name }))
                      ]}
                      icon={<Target size={12} />}
                      className="w-32 text-xs"
                    />
                    <CustomSelect
                      value={goalFilter}
                      onChange={setGoalFilter}
                      options={[
                        { value: "all", label: "Goal: All" },
                        ...uniqueGoals.map(g => ({ value: g, label: g }))
                      ]}
                      className="w-32 text-xs"
                    />
                    <CustomSelect
                      value={projectFilter}
                      onChange={setProjectFilter}
                      options={[
                        { value: "all", label: "Proj: All" },
                        ...uniqueProjects.map(p => ({ value: p, label: p }))
                      ]}
                      className="w-32 text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--glass-border)]">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Sort Order</span>
                    <div className="flex gap-1 bg-black/5 rounded-full p-1">
                      {(["lf", "title"] as const).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSortKey(key)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${sortKey === key ? "bg-[var(--text-primary)] text-[var(--app-bg)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                        >
                          {key === "lf" ? "Focus" : "Name"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
          ) : taskViewMode === 'timeline' ? (
            <TimelineView
              tasks={filteredTasks}
              baseDate={dateObj}
              onTaskClick={(task, e) => openEditor(task, e)}
              onAddTask={(time, duration) => {
                const hour = time.getHours();
                const time_of_day = hour < 12 ? 'MORNING' : hour < 17 ? 'AFTERNOON' : 'EVENING';

                // Deterministic local timestamp (avoids UTC shift issues)
                const localISOTime = format(time, "yyyy-MM-dd'T'HH:mm");

                openEditor({
                  time: { due_date: localISOTime, time_of_day },
                  duration_min: duration
                });
              }}
            />
          ) : (
            <div className="flex flex-col gap-2 relative">
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
                    labels={labels}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}


          {isLoadingTasks && <div className="py-10 text-center text-[var(--text-secondary)] text-sm animate-pulse">Loading thoughts...</div>}
          {!isLoadingTasks && filteredTasks.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--glass-bg)] mx-auto mb-4 flex items-center justify-center"><PartyPopper className="text-[var(--text-secondary)]" /></div>
              <p className="text-[var(--text-secondary)] text-sm">{labels.empty}</p>
              <button onClick={(e) => openEditor(undefined, e as any)} className="mt-4 text-[var(--accent-color)] text-sm hover:underline">+ {labels.new}</button>
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

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedTaskIds(new Set())}
                    className="px-3 py-2 rounded-xl text-[10px] font-bold text-white/40 hover:text-white transition-colors"
                  >
                    CLEAR
                  </button>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/70">
                    Update status:
                    <select
                      className="rounded-full bg-white/5 text-white/90 border border-white/10 px-3 py-1 text-xs"
                      value={batchStatus}
                      onChange={(e) => setBatchStatus(e.target.value as "intake" | "doing" | "done")}
                    >
                      {["intake", "doing", "done"].map((status) => (
                        <option key={status} value={status}>{status.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleBatchStatusUpdate}
                    disabled={isBatchProcessing}
                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] border border-white/20 bg-white/10 hover:bg-white/20 transition disabled:opacity-30"
                  >
                    Update
                  </button>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/70">
                    Reschedule:
                    <select
                      className="rounded-full bg-white/5 text-white/90 border border-white/10 px-3 py-1 text-xs"
                      value={batchPreset}
                      onChange={(e) => setBatchPreset(e.target.value as "next_day" | "next_week" | "next_sprint" | "next_month")}
                    >
                      <option value="next_day">Next day</option>
                      <option value="next_week">Next week</option>
                      <option value="next_sprint">Next sprint</option>
                      <option value="next_month">Next month</option>
                    </select>
                  </div>
                  <button
                    onClick={handleBatchReschedule}
                    disabled={isBatchProcessing}
                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] border border-white/20 bg-white/10 hover:bg-white/20 transition disabled:opacity-30"
                  >
                    Reschedule
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
  labels: any;
};

function TodayTaskRow({ task, index, isSelected, onToggleSelection, markDone, handleScore, openEditor, labels }: TodayTaskRowProps) {
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

      <div className={`glass-card rounded-2xl p-4 flex items-start gap-4 transition-all relative overflow-hidden ${isDone ? "opacity-60 grayscale" : ""} ${isSelected ? "border-white/30 bg-white/5 shadow-xl" : ""}`}>
        {/* Progress Fill Background */}
        <div
          className="absolute inset-0 bg-black/50 transition-all"
          style={{
            width: `${task.progress ?? 0}%`,
            zIndex: 0
          }}
        />
        {/* Routine Visual: Simplified Content */}
        {task.is_routine ? (
          <div className="relative z-10 flex items-center w-full py-1">
            {/* Simple Line Row */}
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] mr-3 opacity-50"></div>
            <span className={`text-sm font-medium ${isDone ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]"}`}>{task.title}</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-wider text-[var(--text-secondary)] opacity-50">Routine</span>
              <label className="flex items-center justify-center w-6 h-6 rounded-full border border-[var(--glass-border)] cursor-pointer hover:border-white/50 transition-colors" onClick={(e) => { e.stopPropagation(); triggerMarkDone(); }}>
                {isDone && <Check size={10} className="text-emerald-400" />}
                <input type="checkbox" checked={isDone} onChange={(e) => { e.stopPropagation(); triggerMarkDone(); }} className="sr-only" />
              </label>
            </div>
          </div>
        ) : (
          <>
            <div className="relative z-10 flex-shrink-0 pt-1">
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

            <div className="relative z-10 flex-1 min-w-0">
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
                      <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] transition ${isDone ? "text-emerald-400" : "text-[var(--text-secondary)]"}`}>{isDone ? labels.done : labels.doing}</span>
                    </label>
                  </div>
                  <button className="px-3 py-1 rounded-full bg-black/5 hover:bg-black/10 flex items-center gap-1 text-[11px] font-bold text-[var(--text-primary)] transition-colors" type="button" onClick={(e) => { e.stopPropagation(); handleScore(task); }}><Target size={14} className="text-blue-600" />{labels.stats}</button>
                </div>
                <div className="flex items-center gap-3" onPointerDownCapture={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col text-[10px] uppercase tracking-[0.3em]"><span className="text-[var(--text-secondary)]">{labels.stats === 'ROI' ? 'Margin' : 'Progress'}</span><span className="text-[var(--text-primary)] font-semibold text-sm">{draftProgress}%</span></div>
                  <input type="range" min={0} max={100} value={draftProgress} onChange={(e) => { e.stopPropagation(); setDraftProgress(Number(e.target.value)); }} className="flex-1 accent-[var(--accent-color)] h-2 rounded-lg" onMouseDown={(e) => e.stopPropagation()} />
                  <div className="flex gap-1">
                    <button type="button" onClick={(e) => { e.stopPropagation(); confirmProgress(); }} disabled={progressUpdating || draftProgress === savedProgress} className="h-6 w-6 rounded-full text-white flex items-center justify-center text-[12px] shadow-sm" style={{ backgroundColor: progressUpdating || draftProgress === savedProgress ? "rgba(16,185,129,0.4)" : "#16a34a" }}><Check size={12} /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setDraftProgress(savedProgress); }} disabled={progressUpdating || draftProgress === savedProgress} className="h-6 w-6 rounded-full text-white flex items-center justify-center text-[12px] shadow-sm" style={{ backgroundColor: progressUpdating || draftProgress === savedProgress ? "rgba(239,68,68,0.4)" : "#dc2626" }}>✕</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
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
