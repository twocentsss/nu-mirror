"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import TaskEditorModal from "@/components/TaskEditorModal";
import { Plus, SlidersHorizontal, PartyPopper } from "lucide-react";
import { CircularDatePicker } from "@/ui/CircularDatePicker";
import { motion, AnimatePresence } from "framer-motion";

type ViewMode = "DAY" | "WEEK" | "SPRINT" | "MONTH" | "QUARTER";

type TaskRecord = {
  id?: string;
  title?: string;
  status?: string;
  notes?: string;
  duration_min?: number;
  lf?: number;
  time?: {
    due_date?: string;
    time_of_day?: string;
    start_at?: string;
    end_at?: string;
  };
};

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

  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("DAY");
  const [lfFilter, setLfFilter] = useState<number | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);

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

  async function handleSave() {
    await fetchTasks(dateRange);
    setEditorOpen(false);
    setEditingTask(null);
  }

  function openEditor(task?: TaskRecord) {
    setEditingTask(task ?? {});
    setEditorOpen(true);
  }

  const filteredTasks = useMemo(() => {
    let res = tasks;
    if (lfFilter !== null) {
      res = res.filter((t) => t.lf === lfFilter);
    }
    return res.sort((a, b) => {
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
  const fullDate = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(selectedDate);

  return (
    <div className="min-h-screen pb-32 relative text-[var(--text-primary)] transition-colors duration-500">

      {/* Dynamic Header "Island" */}
      <div className="sticky top-0 z-20 pt-4 px-4 pb-4">
        <div className="glass-panel rounded-3xl p-4 flex flex-col gap-4">

          {/* Top Row: Date & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Date Navigator */}
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
              <button
                className="h-9 w-9 rounded-full bg-[var(--accent-color)] hover:opacity-90 flex items-center justify-center shadow-lg transition-all text-white"
                onClick={() => openEditor()}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Middle: Circular Date Picker */}
          <div className="-mx-2">
            <CircularDatePicker
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>

          {/* Bottom: View Controls & Filters */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
            <div className="flex bg-[var(--glass-bg)] rounded-full p-1 border border-[var(--glass-border)]">
              {(["DAY", "WEEK", "SPRINT"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${viewMode === mode
                    ? "bg-[var(--text-primary)] text-[var(--bg-gradient)] shadow-lg"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  style={viewMode === mode ? { filter: 'invert(1) grayscale(1)' } : {}}
                >
                  {VIEW_MODE_LABELS[mode]}
                </button>
              ))}
            </div>

            {/* Quick Filter LF */}
            <div className="flex gap-1">
              <button
                onClick={() => setLfFilter(lfFilter === null ? 1 : null)}
                className={`h-8 px-3 rounded-full border text-[10px] font-bold transition-all flex items-center gap-1 ${lfFilter !== null
                  ? "bg-[var(--accent-color)]/20 border-[var(--accent-color)]/50 text-[var(--accent-color)]"
                  : "bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg)]/80"
                  }`}
              >
                <SlidersHorizontal size={12} />
                {lfFilter ? `LF ${lfFilter}` : "Filter"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LF Filter Bar */}
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

      {/* Main Content: Glass Timeline */}
      <div className="px-4 flex flex-col gap-4 relative mt-2">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-[var(--glass-border)]" />

        <AnimatePresence>
          {filteredTasks.map((task, i) => {
            const isDone = task.status === "done";

            return (
              <motion.div
                key={task.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="relative pl-8 group"
                onClick={() => openEditor(task)}
              >
                {/* Timeline Dot */}
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-8 flex justify-center`}>
                  <div className={`w-3 h-3 rounded-full border-2 transition-all ${isDone
                    ? "bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                    : "bg-[var(--text-primary)] border-[var(--text-secondary)] group-hover:border-[var(--text-primary)]"
                    }`} />
                </div>

                {/* Glass Card */}
                <div className={`glass-card rounded-2xl p-4 flex items-start gap-4 cursor-pointer ${isDone ? 'opacity-50 grayscale' : ''}`}>

                  {/* Left: Time or Icon */}
                  <div className="flex-shrink-0 pt-1">
                    {task.time?.start_at ? (
                      <div className="text-center">
                        <div className="text-xs font-bold text-[var(--text-primary)]">{new Date(task.time.start_at).getHours()}:{new Date(task.time.start_at).getMinutes().toString().padStart(2, '0')}</div>
                        <div className="text-[10px] text-[var(--text-secondary)] uppercase font-medium">{new Date(task.time.start_at).getHours() >= 12 ? 'PM' : 'AM'}</div>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--glass-bg)] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]/30" />
                      </div>
                    )}
                  </div>

                  {/* Right: Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-base font-semibold leading-tight truncate ${isDone ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                        {task.title || "Untitled Task"}
                      </h3>
                      {task.lf && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black bg-[var(--glass-bg)] text-[var(--text-secondary)] border border-[var(--glass-border)]">
                          LF{task.lf}
                        </span>
                      )}
                    </div>

                    {(task.notes || task.duration_min) && (
                      <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                        {task.duration_min && (
                          <span className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-[var(--text-secondary)]/40" />
                            {task.duration_min} min
                          </span>
                        )}
                        {task.notes && <span className="truncate max-w-[150px]">{task.notes}</span>}
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loadingTasks && (
          <div className="py-10 text-center text-[var(--text-secondary)] text-sm animate-pulse">
            Loading thoughts...
          </div>
        )}

        {!loadingTasks && filteredTasks.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--glass-bg)] mx-auto mb-4 flex items-center justify-center">
              <PartyPopper className="text-[var(--text-secondary)]" />
            </div>
            <p className="text-[var(--text-secondary)] text-sm">No tasks for this period.</p>
            <button onClick={() => openEditor()} className="mt-4 text-[var(--accent-color)] text-sm hover:underline">
              + Create one
            </button>
          </div>
        )}
      </div>

      <TaskEditorModal
        task={editingTask}
        allTasks={tasks}
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingTask(null);
        }}
        onChanged={handleSave}
      />
    </div>
  );
}
