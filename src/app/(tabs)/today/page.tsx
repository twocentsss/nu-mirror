"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import TaskEditorModal from "@/components/TaskEditorModal";
import { MoreHorizontal, Plus, ChevronDown, ChevronUp, Check, PartyPopper } from "lucide-react";
import { CircularDatePicker } from "@/ui/CircularDatePicker";

type ViewMode = "DAY" | "WEEK" | "SPRINT" | "MONTH" | "QUARTER";
type TimeSlot = "ANYTIME" | "MORNING" | "AFTERNOON" | "EVENING";

type TaskRecord = {
  id?: string;
  _row?: number;
  episode_id?: string;
  parent_task_id?: string;
  title?: string;
  raw_text?: string;
  status?: string;
  notes?: string;
  duration_min?: number;
  lf?: number;
  priority?: { moscow?: string; weight?: number };
  time?: {
    due_date?: string;
    time_of_day?: string;
    start_at?: string;
    end_at?: string;
  };
};

// Colors for sections based on screenshot
const SLOT_STYLES: Record<TimeSlot, string> = {
  ANYTIME: "bg-gray-50 text-gray-600",
  MORNING: "bg-orange-50 text-orange-700",
  AFTERNOON: "bg-blue-50 text-blue-700",
  EVENING: "bg-purple-50 text-purple-700",
};

const SLOT_LABELS: Record<TimeSlot, string> = {
  ANYTIME: "Anytime",
  MORNING: "Morning",
  AFTERNOON: "Day",
  EVENING: "Evening",
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
      // Single day
      break;
    case "WEEK":
      // Start of week (Sunday) to end of week (Saturday)
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      end.setDate(start.getDate() + 6);
      break;
    case "SPRINT":
      // 2-week sprint starting from Monday
      const currentDay = start.getDay();
      const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      start.setDate(start.getDate() + daysToMonday);
      end.setDate(start.getDate() + 13); // 14 days total
      break;
    case "MONTH":
      // First to last day of month
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0); // Last day of current month
      break;
    case "QUARTER":
      // Quarter: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
      const month = start.getMonth();
      const quarterStart = Math.floor(month / 3) * 3;
      start.setMonth(quarterStart);
      start.setDate(1);
      end.setMonth(quarterStart + 3);
      end.setDate(0); // Last day of quarter
      break;
  }

  return { start: formatISODate(start), end: formatISODate(end) };
}

function laneFromTask(task: TaskRecord): TimeSlot {
  const slot = (task.time?.time_of_day ?? "").toUpperCase();
  if (slot === "MORNING") return "MORNING";
  if (slot === "AFTERNOON" || slot === "DAY") return "AFTERNOON";
  if (slot === "EVENING" || slot === "NIGHT" || slot === "EVENING") return "EVENING";
  if (slot === "ANYTIME") return "ANYTIME";

  if (task.time?.start_at) {
    const hour = new Date(task.time.start_at).getHours();
    if (hour < 12) return "MORNING";
    if (hour < 17) return "AFTERNOON";
    return "EVENING";
  }
  return "ANYTIME";
}

function timeRangeLabel(task: TaskRecord) {
  const start = task.time?.start_at;
  const end = task.time?.end_at;
  if (!start && !end) return "";

  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (start && end) {
    return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`;
  }
  if (start) {
    return formatter.format(new Date(start));
  }
  return "";
}

function getWeekDays(centerDate: Date) {
  const days = [];
  // Show 3 days before and 3 days after
  for (let i = -3; i <= 3; i++) {
    const d = new Date(centerDate);
    d.setDate(centerDate.getDate() + i);
    days.push(d);
  }
  return days;
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

  // Section collapse state
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const dateRange = useMemo(() => computeRange(viewMode, selectedDate), [viewMode, selectedDate]);

  const fetchTasks = useCallback(async (range: { start: string; end: string }) => {
    if (!signedIn) return;
    setLoadingTasks(true);
    try {
      const qs = new URLSearchParams({ start: range.start, end: range.end });
      const res = await fetch(`/api/cogos/task/list?${qs}`);
      if (!res.ok) throw new Error("Failed to list tasks");
      const j = await res.json();
      setTasks(j.tasks || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoadingTasks(false);
    }
  }, [signedIn]);

  useEffect(() => {
    fetchTasks(dateRange);
  }, [dateRange, fetchTasks]);

  function openEditor(task?: TaskRecord) {
    setEditingTask(task ?? {
      time: { due_date: formatISODate(selectedDate), time_of_day: "ANYTIME" }
    });
    setEditorOpen(true);
  }

  const filteredTasks = useMemo(() => {
    if (lfFilter === null) return tasks;
    return tasks.filter((t) => t.lf === lfFilter);
  }, [tasks, lfFilter]);

  const laneAssignments = useMemo(() => {
    const lanes: Record<TimeSlot, TaskRecord[]> = {
      ANYTIME: [],
      MORNING: [],
      AFTERNOON: [],
      EVENING: [],
    };
    for (const t of filteredTasks) {
      const l = laneFromTask(t);
      lanes[l].push(t);
    }
    return lanes;
  }, [filteredTasks]);

  const toggleSection = (lane: string) => {
    setCollapsed(prev => ({ ...prev, [lane]: !prev[lane] }));
  };

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(selectedDate);
  const fullDate = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(selectedDate);

  const totalTasks = tasks.length;
  // Placeholder check for completed status
  const completedCount = tasks.filter(t => (t.status || "").toLowerCase() === 'done').length;

  return (
    <div className="min-h-screen bg-white text-black pb-32">
      {/* Top Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-4 pt-4 pb-2 border-b border-transparent transition-all">
        <div className="flex items-center justify-between mb-2">
          {/* Left: Confetti Count */}
          <div className="bg-white border rounded-full px-3 py-1 flex items-center gap-2 shadow-sm">
            <PartyPopper size={16} className="text-black" />
            <span className="text-sm font-semibold">{completedCount} / {totalTasks}</span>
          </div>

          {/* Right: Actions */}
          <div className="flex gap-2">
            <button className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
              <MoreHorizontal size={20} />
            </button>
            <button
              className="h-10 w-10 rounded-full bg-white border flex items-center justify-center shadow-sm hover:shadow-md transition"
              onClick={() => openEditor()}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Date Title */}
        <div className="text-center mt-2">
          <h1 className="font-serif text-4xl leading-tight">{dayName}</h1>
          <p className="text-gray-500 text-sm mt-1">{fullDate}</p>
        </div>

        {/* Circular Date Picker */}
        <CircularDatePicker
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* View Mode Selector */}
        <div className="flex justify-center gap-2 mt-4 px-4">
          {(["DAY", "WEEK", "SPRINT", "MONTH", "QUARTER"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${viewMode === mode
                ? "bg-black text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              {VIEW_MODE_LABELS[mode]}
            </button>
          ))}
        </div>

        {/* LF Filter */}
        <div className="flex justify-center gap-1 mt-2 px-4 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setLfFilter(null)}
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
              lfFilter === null ? "bg-black text-white" : "bg-gray-100 text-gray-500"
            }`}
          >
            ALL
          </button>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lf) => (
            <button
              key={lf}
              onClick={() => setLfFilter(lf === lfFilter ? null : lf)}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                lfFilter === lf ? "bg-black text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              LF{lf}
            </button>
          ))}
        </div>
      </div>

      <TaskEditorModal
        open={editorOpen}
        task={editingTask as any}
        allTasks={tasks as any}
        onClose={() => setEditorOpen(false)}
        onChanged={async () => {
          await fetchTasks(dateRange);
        }}
      />

      <div className="px-4 mt-4 space-y-6">
        {(Object.keys(SLOT_LABELS) as TimeSlot[]).map((lane) => {
          const isCollapsed = collapsed[lane];
          const count = laneAssignments[lane].length;
          const label = SLOT_LABELS[lane];
          const style = SLOT_STYLES[lane];

          return (
            <div key={lane}>
              {/* Section Header */}
              <div
                className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer select-none transition active:scale-[0.98] ${style}`}
                onClick={() => toggleSection(lane)}
              >
                <div className="flex items-center gap-3">
                  {lane === 'MORNING' && <span className="text-xl">☀️</span>}
                  {lane === 'AFTERNOON' && <span className="text-xl">🌤️</span>}
                  {lane === 'EVENING' && <span className="text-xl">🌙</span>}
                  {lane === 'ANYTIME' && <span className="text-xl">🕰️</span>}

                  <span className="text-xs font-bold uppercase tracking-wider opacity-90">{label} ({count})</span>
                </div>

                <div className="flex items-center text-current opacity-60">
                  {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </div>
              </div>

              {/* Section Content */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100 mt-2 space-y-2'}`}>
                {lane === 'ANYTIME' && count === 0 && (
                  <div className="border-2 border-dashed border-gray-100 rounded-2xl p-4 flex items-center justify-between text-gray-400">
                    <span className="text-sm font-medium">Anytime today works</span>
                    <button onClick={(e) => { e.stopPropagation(); openEditor({ time: { due_date: formatISODate(selectedDate), time_of_day: 'ANYTIME' } } as any); }} className="h-8 w-8 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100"><Plus size={16} /></button>
                  </div>
                )}

                {laneAssignments[lane].map(task => (
                  <div
                    key={task.id}
                    className="bg-white border border-gray-100 rounded-2xl p-4 flex items-start justify-between shadow-sm active:scale-[0.99] transition hover:shadow-md cursor-pointer"
                    onClick={() => openEditor(task)}
                  >
                    <div className="flex gap-3 items-start">
                      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-200'}`}>
                        {task.status === 'done' && <Check size={12} className="text-white bg-transparent" />}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[15px] font-medium leading-tight ${task.status === 'done' ? 'line-through text-gray-300' : 'text-gray-900'}`}>{task.title || "Untitled Task"}</span>
                          {task.lf && (
                            <span className="text-[10px] font-bold bg-black/5 text-black/60 px-1.5 py-0.5 rounded-md">LF{task.lf}</span>
                          )}
                        </div>
                        {task.notes && <span className="text-xs text-gray-400 line-clamp-1">{task.notes}</span>}
                        {task.time?.start_at && <span className="text-xs font-medium text-gray-400 mt-0.5">{timeRangeLabel(task)}</span>}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Always show + button for non-empty sections or non-anytime empty sections to act as 'Add to this slot' */}
                {!(lane === 'ANYTIME' && count === 0) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditor({ time: { due_date: formatISODate(selectedDate), time_of_day: lane } } as any); }}
                    className="w-full py-2 flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-xl transition"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
