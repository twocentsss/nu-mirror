"use client";

import React, { useState, useMemo, useEffect, useRef, Suspense } from "react";
import {
  Coffee,
  CheckCircle2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Zap,
  Target,
  Search,
  Settings,
  Map,
  Activity,
  FileText,
  HelpCircle,
  Info,
  Fingerprint,
  PartyPopper,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { format, startOfDay, addDays, subDays } from "date-fns";
import { usePlatformStore } from "@/lib/store/platform-store";
import TimelineView from "@/components/today/TimelineView";
import { CircularDatePicker } from "@/ui/CircularDatePicker";
import { WORLDS, TaskRecord } from "@/components/TaskEditorModal";
import { CustomSelect } from "@/ui/CustomSelect";
import SingleLineTaskView from "@/components/today/SingleLineTaskView";
import ViewSelector, { TaskViewMode } from "@/components/today/ViewSelector";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SwipeToCreate from "@/components/SwipeToCreate";
import TaskEditorModal from "@/components/TaskEditorModal";
import { usePersona } from "@/hooks/usePersona";

// --- HELPERS ---
const VIEW_MODES = ["DAY", "WEEK", "SPRINT"] as const;

export default function TodayPage() {
  const { persona } = usePersona();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<typeof VIEW_MODES[number]>("DAY");
  const [taskViewMode, setTaskViewMode] = useState<TaskViewMode>("compact");
  const [showFilters, setShowFilters] = useState(false);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Filters State
  const [lfFilter, setLfFilter] = useState<number | null>(null);
  const [goalFilter, setGoalFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortKey, setSortKey] = useState<"lf" | "title">("lf");
  const [batchStatus, setBatchStatus] = useState<"intake" | "doing" | "done">("intake");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | undefined>(undefined);
  const [clickOrigin, setClickOrigin] = useState<{ x: number, y: number } | undefined>(undefined);

  const { showAccomplishments } = usePlatformStore();

  const labels = useMemo(() => {
    const sets: any = {
      DEVELOPER: { title: "System Cycle", new: "Sprint Item", empty: "Buffer Clear", done: "MERGED", doing: "DEV" },
      CREATIVE: { title: "Daily Beats", new: "New Sketch", empty: "Canvas Empty", done: "RENDERED", doing: "DRAFT" },
      CORP: { title: "Agenda", new: "Action Item", empty: "Out of Office", done: "SIGNED", doing: "IN REVIEW" },
    };
    return sets[persona] || sets.CORP;
  }, [persona]);

  const dateObj = startOfDay(selectedDate);
  const dayName = format(dateObj, "EEEE");

  const dynamicGreeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // Mock Loading
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoadingTasks(true);
      try {
        const res = await fetch("/api/cogos/task/list");
        if (res.ok) {
          const data = await res.json();
          setTasks(data.tasks || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingTasks(false);
      }
    };
    fetchTasks();
  }, []);

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  const openEditor = (task?: TaskRecord, e?: React.MouseEvent | MouseEvent) => {
    if (e) setClickOrigin({ x: e.clientX, y: e.clientY });
    setEditingTask(task);
    setEditorOpen(true);
  };

  const markDone = async (task: TaskRecord) => {
    const newStatus = task.status === "done" ? "doing" : "done";
    const res = await fetch("/api/cogos/task/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: task.id, status: newStatus, progress: newStatus === "done" ? 100 : 0 }),
    });
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, progress: newStatus === "done" ? 100 : 0 } : t));
      return { status: newStatus, progress: newStatus === "done" ? 100 : 0 };
    }
    return null;
  };

  const handleScore = (task: TaskRecord) => {
    console.log("Scoring task:", task);
  };

  const handleStepChange = async (taskId: string, step: number) => {
    const res = await fetch("/api/cogos/task/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: taskId, step }),
    });
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, step } : t));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const res = await fetch("/api/cogos/task/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: taskId }),
    });
    if (res.ok) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const handleBatchStatusUpdate = async () => {
    if (selectedTaskIds.size === 0) return;
    setIsBatchProcessing(true);
    try {
      await Promise.all(Array.from(selectedTaskIds).map(id =>
        fetch("/api/cogos/task/update", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id, status: batchStatus })
        })
      ));
      setTasks(prev => prev.map(t => t.id && selectedTaskIds.has(t.id) ? { ...t, status: batchStatus } : t));
      setSelectedTaskIds(new Set());
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchDone = async () => {
    if (selectedTaskIds.size === 0) return;
    setIsBatchProcessing(true);
    try {
      await Promise.all(Array.from(selectedTaskIds).map(id =>
        fetch("/api/cogos/task/update", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id, status: "done", progress: 100 })
        })
      ));
      setTasks(prev => prev.map(t => t.id && selectedTaskIds.has(t.id) ? { ...t, status: "done", progress: 100 } : t));
      setSelectedTaskIds(new Set());
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedTaskIds.size === 0) return;
    setIsBatchProcessing(true);
    try {
      await Promise.all(Array.from(selectedTaskIds).map(id =>
        fetch("/api/cogos/task/delete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id })
        })
      ));
      setTasks(prev => prev.filter(t => !t.id || !selectedTaskIds.has(t.id)));
      setSelectedTaskIds(new Set());
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id!).filter(Boolean)));
    }
  };

  const uniqueGoals = useMemo(() => Array.from(new Set(tasks.map(t => t.goal).filter(Boolean))), [tasks]);
  const uniqueProjects = useMemo(() => Array.from(new Set(tasks.map(t => t.project).filter(Boolean))), [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (showAccomplishments && t.status !== 'done') return false;
      if (!showAccomplishments && t.status === 'done') return false;
      if (lfFilter !== null && t.lf !== lfFilter) return false;
      if (goalFilter !== "all" && t.goal !== goalFilter) return false;
      if (projectFilter !== "all" && t.project !== projectFilter) return false;
      return true;
    }).sort((a, b) => {
      if (sortKey === 'lf') {
        const al = a.lf ?? 99;
        const bl = b.lf ?? 99;
        return al - bl;
      }
      return (a.title ?? "").localeCompare(b.title ?? "");
    });
  }, [tasks, showAccomplishments, lfFilter, goalFilter, projectFilter, sortKey]);

  return (
    <SwipeToCreate onTrigger={() => openEditor()}>
      <div className="relative text-[var(--text-primary)] transition-colors duration-500 flex flex-col">

        {/* PANEL 1: THE CONTEXT (Identity & Time) */}
        <section className="snap-start h-screen flex flex-col justify-center px-12 relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-color)]/5 to-transparent pointer-events-none" />

          <div className="w-full max-w-5xl space-y-12 py-12">
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between">
              <div className="flex bg-black/5 backdrop-blur-md rounded-full border border-white/5 p-1 gap-1 items-center shadow-lg">
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
                  <button
                    key={it.id}
                    onClick={(e) => { setClickOrigin({ x: e.clientX, y: e.clientY }); openEditor(undefined, e); }}
                    className={`p-2 rounded-full hover:bg-white/10 text-[var(--text-secondary)] ${it.color} hover:shadow-sm transition-all duration-300`}
                    title={it.title}
                  >
                    {it.icon}
                  </button>
                ))}
              </div>

              <button
                onClick={() => usePlatformStore.setState({ showAccomplishments: !showAccomplishments })}
                className={`rounded-full px-5 py-2 flex items-center gap-2 border shadow-lg transition-all hover:scale-105 active:scale-95 ${showAccomplishments ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/5 border-white/10 text-[var(--text-secondary)]'}`}
              >
                <Target size={14} />
                <span className="text-xs font-black uppercase tracking-widest">{showAccomplishments ? 'Done' : 'Goal'}</span>
              </button>
            </div>

            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold tracking-tight text-[var(--text-primary)]"
              >
                {dynamicGreeting}
              </motion.h1>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <button onClick={handlePrevDay} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] transition-all">
                    <ChevronLeft size={24} />
                  </button>
                  <div className="relative group">
                    <h2 className="text-5xl font-greeting font-bold tracking-tight text-[var(--text-primary)] cursor-pointer transition-all flex items-center gap-3">
                      {dayName}, {dateObj.getDate()}
                      <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full" value={dateObj.toISOString().slice(0, 10)} onChange={(e) => { const d = e.target.valueAsDate; if (d) setSelectedDate(d); }} />
                    </h2>
                  </div>
                  <button onClick={handleNextDay} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] transition-all">
                    <ChevronRight size={24} />
                  </button>
                </div>
                <p className="text-[var(--text-secondary)] text-sm font-black uppercase tracking-[0.4em] ml-12 mt-2 opacity-40">
                  {dateObj.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="w-full scale-110 py-4">
              <CircularDatePicker selectedDate={dateObj} onDateChange={setSelectedDate} />
            </div>
          </div>
        </section>

        {/* PANEL 2: THE PERSPECTIVE (Modes & Filters) */}
        <section className="snap-start h-screen flex flex-col justify-center px-12 shrink-0 overflow-hidden relative">
          <div className="w-full max-w-5xl bg-[#0a0a0a] rounded-[40px] p-10 border border-white/5 shadow-2xl space-y-8 backdrop-blur-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-color)]/5 blur-3xl rounded-full -mr-16 -mt-16" />

            <div className="flex flex-col gap-6 items-center">
              <div className="flex bg-white/5 rounded-full p-1.5 border border-white/5 shadow-inner w-full justify-between">
                {VIEW_MODES.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex-1 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === mode
                      ? "bg-white text-black shadow-xl scale-[1.02]"
                      : "text-white/40 hover:text-white"
                      }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="w-full flex items-center justify-between bg-white/2 pt-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-black">Current Focus</span>
                  <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    {labels.title}
                    <span className="ml-3 text-sm font-medium text-white/20">{filteredTasks.length} items</span>
                  </h2>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${showFilters ? "bg-white text-black" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"}`}
                >
                  <SlidersHorizontal size={20} />
                </button>
              </div>
            </div>

            {/* Integrated Filters (Inline) */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-white/5 rounded-3xl p-6 border border-white/5"
                >
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center gap-4">
                      {taskViewMode === 'timeline' && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/20">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] font-black text-red-400 tabular-nums">
                            {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={handleSelectAll}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0 ? "bg-white text-black border-white shadow-xl" : "border-white/10 text-white/40 hover:border-white/40 hover:text-white"}`}
                      >
                        {selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0 ? "Reset" : "Select All"}
                      </button>
                      <ViewSelector view={taskViewMode} onChange={setTaskViewMode} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <CustomSelect
                        value={lfFilter ?? "all"}
                        onChange={(val) => setLfFilter(val === "all" ? null : Number(val))}
                        options={[
                          { value: "all", label: "Focus: All" },
                          ...WORLDS.map((w: { id: number; name: string }) => ({ value: w.id, label: w.name }))
                        ]}
                        icon={<Target size={14} />}
                        className="w-full h-12 bg-black/40 rounded-2xl border-white/5"
                      />
                      <CustomSelect
                        value={goalFilter}
                        onChange={setGoalFilter}
                        options={[
                          { value: "all", label: "Goal: All" },
                          ...uniqueGoals.map(g => ({ value: g || "standalone", label: (g as string) || "Standalone" }))
                        ]}
                        className="w-full h-12 bg-black/40 rounded-2xl border-white/5"
                      />
                      <CustomSelect
                        value={projectFilter}
                        onChange={setProjectFilter}
                        options={[
                          { value: "all", label: "Project: All" },
                          ...uniqueProjects.map(p => ({ value: p || "standalone", label: (p as string) || "Standalone" }))
                        ]}
                        className="w-full h-12 bg-black/40 rounded-2xl border-white/5"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-black">Sort Arrangement</span>
                      <div className="flex gap-2 bg-black/40 rounded-full p-1 border border-white/5">
                        {(["lf", "title"] as const).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSortKey(key)}
                            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${sortKey === key ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"}`}
                          >
                            {key === "lf" ? "Domain" : "Alpha"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* PANEL 3: THE EXECUTION (List) */}
        <section className="snap-start h-screen pt-24 px-12 relative overflow-y-auto no-scrollbar shrink-0">
          <div className="w-full max-w-5xl pb-64">
            {/* Batch Status Bar (Floating) */}
            <AnimatePresence>
              {selectedTaskIds.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 30, scale: 0.9 }}
                  className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-2xl"
                >
                  <div className="bg-white text-black rounded-[28px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-5 flex items-center justify-between gap-6 overflow-hidden">
                    <div className="flex flex-col whitespace-nowrap">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Selection</span>
                      <span className="text-xl font-black">{selectedTaskIds.size}</span>
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                      <select
                        className="rounded-xl bg-black/5 text-black border border-black/10 px-4 py-2 text-xs font-bold"
                        value={batchStatus}
                        onChange={(e) => setBatchStatus(e.target.value as "intake" | "doing" | "done")}
                      >
                        {["intake", "doing", "done"].map((status) => (
                          <option key={status} value={status}>{status.toUpperCase()}</option>
                        ))}
                      </select>

                      <button
                        onClick={handleBatchStatusUpdate}
                        disabled={isBatchProcessing}
                        className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-black text-white hover:scale-105 active:scale-95 transition disabled:opacity-30"
                      >
                        Update
                      </button>

                      <button
                        onClick={handleBatchDone}
                        disabled={isBatchProcessing}
                        className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-600 text-white hover:scale-105 transition shadow-lg shadow-emerald-500/20 disabled:opacity-30"
                      >
                        Done
                      </button>

                      <button
                        onClick={handleBatchDelete}
                        disabled={isBatchProcessing}
                        className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-red-600 text-white hover:scale-105 transition disabled:opacity-30"
                      >
                        Kill
                      </button>
                    </div>

                    <button onClick={() => setSelectedTaskIds(new Set())} className="p-3 bg-black/5 rounded-full hover:bg-black/10 transition">
                      <Plus className="rotate-45" size={18} />
                    </button>
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
                  const localISOTime = format(time, "yyyy-MM-dd'T'HH:mm");
                  openEditor({
                    time: { due_date: localISOTime, time_of_day },
                    duration_min: duration
                  });
                }}
              />
            ) : (
              <div className="flex flex-col gap-3 relative">
                <div className="absolute left-10 top-0 bottom-0 w-px bg-white/5" />
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

            {isLoadingTasks && <div className="py-20 text-center text-white/20 text-lg font-bold tracking-widest animate-pulse h-[300px] flex items-center justify-center">SYNCHRONIZING...</div>}
            {!isLoadingTasks && filteredTasks.length === 0 && (
              <div className="py-40 text-center flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white/5 mx-auto flex items-center justify-center overflow-hidden border border-white/5 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-color)]/20 to-transparent" />
                  <PartyPopper className="text-white/40 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" size={40} />
                </div>
                <div className="space-y-2">
                  <p className="text-white font-bold text-xl">{labels.empty}</p>
                  <p className="text-white/40 text-sm max-w-[200px] mx-auto">No pending obligations detected for this cycle.</p>
                </div>
                <button onClick={(e) => openEditor(undefined, e as any)} className="px-8 py-3 rounded-full bg-white text-black font-black uppercase tracking-widest text-[10px] hover:scale-110 active:scale-95 transition-all shadow-xl shadow-white/10">+ {labels.new}</button>
              </div>
            )}
          </div>
        </section>

        <Suspense fallback={null}><TaskEditorLauncher openEditor={openEditor} /></Suspense>

        {/* Editor Modal */}
        {editorOpen && (
          <TaskEditorModal
            open={editorOpen}
            onClose={() => setEditorOpen(false)}
            task={editingTask || null}
            allTasks={tasks}
            onChanged={async () => {
              const res = await fetch("/api/cogos/task/list");
              if (res.ok) {
                const data = await res.json();
                setTasks(data.tasks || []);
              }
            }}
          />
        )}
      </div>
    </SwipeToCreate>
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
  const startTime = task.time?.due_date ? new Date(task.time.due_date) : null;
  const [savedProgress, setSavedProgress] = useState(task.progress ?? 0);
  const [draftProgress, setDraftProgress] = useState(savedProgress);
  const [progressUpdating, setProgressUpdating] = useState(false);

  useEffect(() => {
    const initial = task.progress ?? 0;
    setSavedProgress(initial);
    setDraftProgress(initial);
  }, [task.progress]);

  const handleDragEnd = (_event: unknown, info: any) => {
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

const styles = `
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;
