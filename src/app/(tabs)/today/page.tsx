"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import TopNav from "@/components/TopNav";

type ViewMode = "DAY" | "3DAY" | "WEEK" | "MONTH";
type TimeSlot = "ANYTIME" | "MORNING" | "AFTERNOON" | "EVENING";

type TaskRecord = {
  id?: string;
  title?: string;
  raw_text?: string;
  status?: string;
  priority?: { moscow?: string; weight?: number };
  time?: {
    due_date?: string;
    time_of_day?: string;
    start_at?: string;
    end_at?: string;
  };
};

const VIEW_OPTIONS: { id: ViewMode; label: string }[] = [
  { id: "DAY", label: "Day" },
  { id: "3DAY", label: "3 days" },
  { id: "WEEK", label: "Week" },
  { id: "MONTH", label: "Month" },
];

const SLOT_LABELS: Record<TimeSlot, string> = {
  ANYTIME: "Anytime",
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
};

const PRIORITY_LABELS = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

function formatISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function computeRange(mode: ViewMode, baseDate: Date) {
  const start = new Date(baseDate);
  const end = new Date(baseDate);

  switch (mode) {
    case "3DAY": {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() + 1);
      break;
    }
    case "WEEK": {
      const day = start.getDay();
      const diff = (day + 6) % 7; // convert Sunday start to Monday start
      start.setDate(start.getDate() - diff);
      end.setDate(start.getDate() + 6);
      break;
    }
    case "MONTH": {
      start.setDate(1);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      break;
    }
    default:
      break;
  }

  return { start: formatISODate(start), end: formatISODate(end) };
}

function derivePriority(task: TaskRecord): "HIGH" | "MEDIUM" | "LOW" {
  const moscow = (task.priority?.moscow ?? "").toUpperCase();
  if (moscow === "MUST" || moscow === "HIGH") return "HIGH";
  if (moscow === "COULD" || moscow === "LOW") return "LOW";

  const weight = Number(task.priority?.weight ?? 5);
  if (weight >= 7) return "HIGH";
  if (weight <= 3) return "LOW";
  return "MEDIUM";
}

function laneFromTask(task: TaskRecord): TimeSlot {
  const slot = (task.time?.time_of_day ?? "").toUpperCase();
  if (slot === "MORNING") return "MORNING";
  if (slot === "AFTERNOON" || slot === "DAY") return "AFTERNOON";
  if (slot === "EVENING" || slot === "NIGHT") return "EVENING";
  if (slot === "ANYTIME") return "ANYTIME";

  if (task.time?.start_at) {
    const hour = new Date(task.time.start_at).getHours();
    if (hour < 10) return "MORNING";
    if (hour < 15) return "AFTERNOON";
    if (hour < 21) return "EVENING";
  }
  return "ANYTIME";
}

function timeRangeLabel(task: TaskRecord) {
  const start = task.time?.start_at;
  const end = task.time?.end_at;
  if (!start && !end) return "Anytime";

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
  return "Anytime";
}

function getWeekNumber(date: Date) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function composeIso(dateStr: string, timeStr: string | undefined) {
  if (!timeStr) return undefined;
  return new Date(`${dateStr}T${timeStr}`).toISOString();
}

export default function TodayPage() {
  const { data: session } = useSession();
  const signedIn = Boolean(session?.user?.email);

  const [accountInfo, setAccountInfo] = useState<{ spreadsheetId?: string; fileName?: string } | null>(null);
  const [initBusy, setInitBusy] = useState(false);

  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("DAY");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [dateRange, setDateRange] = useState(() => computeRange("DAY", new Date()));
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [newText, setNewText] = useState("");
  const [slot, setSlot] = useState<TimeSlot>("ANYTIME");
  const [blockDate, setBlockDate] = useState(() => formatISODate(new Date()));
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  useEffect(() => {
    setDateRange(computeRange(viewMode, selectedDate));
    setBlockDate(formatISODate(selectedDate));
  }, [viewMode, selectedDate]);

  const fetchTasks = useCallback(async (range: { start: string; end: string }) => {
    setLoadingTasks(true);
    try {
      const qs = new URLSearchParams();
      if (range.start) qs.set("start", range.start);
      if (range.end) qs.set("end", range.end);
      const res = await fetch(`/api/cogos/task/list?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks ?? []);
      }
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    if (!signedIn) {
      setTasks([]);
      return;
    }
    void fetchTasks(dateRange);
  }, [signedIn, dateRange, fetchTasks]);

  async function initAccount() {
    setInitBusy(true);
    try {
      const res = await fetch("/api/google/account/init", { method: "POST" });
      const data = await res.json();
      if (res.ok) setAccountInfo(data);
    } finally {
      setInitBusy(false);
    }
  }

  async function createTask(rawText: string) {
    const body = {
      raw_text: rawText,
      title: rawText.slice(0, 80),
      due_date: blockDate,
      time_of_day: slot,
      start_at: composeIso(blockDate, startTime),
      end_at: composeIso(blockDate, endTime),
    };
    const res = await fetch("/api/cogos/task/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setNewText("");
      setStartTime("");
      setEndTime("");
      await fetchTasks(dateRange);
    }
  }

  const focusDayKey = formatISODate(selectedDate);
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const dayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [],
  );
  const dayLabel = dayFormatter.format(selectedDate);
  const weekNumber = getWeekNumber(selectedDate);

  const tasksForFocusDay = useMemo(
    () =>
      tasks.filter((task) => {
        const due = task.time?.due_date;
        if (!due) return false;
        return due.slice(0, 10) === focusDayKey;
      }),
    [tasks, focusDayKey],
  );

  const priorityBuckets = useMemo(() => {
    const buckets: Record<"HIGH" | "MEDIUM" | "LOW", TaskRecord[]> = {
      HIGH: [],
      MEDIUM: [],
      LOW: [],
    };
    tasksForFocusDay.forEach((task) => {
      buckets[derivePriority(task)].push(task);
    });
    return buckets;
  }, [tasksForFocusDay]);

  const laneAssignments = useMemo(() => {
    const lanes: Record<TimeSlot, TaskRecord[]> = {
      ANYTIME: [],
      MORNING: [],
      AFTERNOON: [],
      EVENING: [],
    };
    tasksForFocusDay.forEach((task) => {
      lanes[laneFromTask(task)].push(task);
    });
    return lanes;
  }, [tasksForFocusDay]);

  return (
    <div className="min-h-screen bg-[#05060c] text-white">
      <TopNav />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/40">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">Today</p>
              <p className="text-2xl font-semibold">{dayLabel}</p>
            </div>
            <div className="hidden text-sm text-white/60 sm:flex sm:flex-col">
              <span>Week {weekNumber}</span>
              <span>{timezone}</span>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {VIEW_OPTIONS.map((mode) => (
                <button
                  key={mode.id}
                  className={[
                    "rounded-full px-3 py-1 text-sm transition",
                    viewMode === mode.id ? "bg-white text-black" : "border border-white/20 text-white/70 hover:border-white/50",
                  ].join(" ")}
                  onClick={() => setViewMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
              <button
                className="rounded-full border border-white/30 px-3 py-1 text-sm text-white/80 transition hover:border-white"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </button>
              <input
                type="date"
                value={formatISODate(selectedDate)}
                onChange={(event) => {
                  const value = event.target.value;
                  if (!value) return;
                  setSelectedDate(new Date(`${value}T00:00:00`));
                }}
                className="rounded-full border border-white/20 bg-transparent px-3 py-1 text-sm text-white outline-none focus:border-white/60"
              />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Account Spreadsheet</p>
                  <p className="text-sm text-white/60">
                    {accountInfo?.spreadsheetId ? "Connected" : "Not initialized"}
                  </p>
                </div>
                <button
                  disabled={initBusy}
                  onClick={initAccount}
                  className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-60"
                >
                  {initBusy ? "Initializing…" : "Init"}
                </button>
              </div>
              {accountInfo?.spreadsheetId && (
                <div className="mt-3 text-xs text-white/60">
                  ID: <span className="font-mono text-white/80">{accountInfo.spreadsheetId}</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold">Add a block</p>
              <textarea
                className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 p-2 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
                rows={3}
                placeholder="Describe what you want to do…"
                value={newText}
                onChange={(event) => setNewText(event.target.value)}
              />
              <div className="mt-3 space-y-2 text-sm text-white/70">
                <div className="flex flex-wrap gap-2">
                  <label className="text-xs uppercase tracking-wide text-white/50">Date</label>
                  <input
                    type="date"
                    value={blockDate}
                    onChange={(event) => setBlockDate(event.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-transparent px-2 py-1 focus:border-white/60 focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="text-xs uppercase tracking-wide text-white/50">Slot</label>
                  <select
                    value={slot}
                    onChange={(event) => setSlot(event.target.value as TimeSlot)}
                    className="w-full rounded-lg border border-white/20 bg-transparent px-2 py-1 focus:border-white/60 focus:outline-none"
                  >
                    {Object.entries(SLOT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs uppercase tracking-wide text-white/50">Start</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-transparent px-2 py-1 focus:border-white/60 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs uppercase tracking-wide text-white/50">End</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-transparent px-2 py-1 focus:border-white/60 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <button
                disabled={!newText.trim()}
                onClick={() => createTask(newText.trim())}
                className="mt-3 w-full rounded-full bg-white/90 px-3 py-2 text-center text-sm font-semibold text-black transition hover:bg-white disabled:opacity-50"
              >
                Schedule block
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Priority buckets</p>
                <span className="text-xs text-white/50">{tasksForFocusDay.length} items</span>
              </div>
              <div className="mt-3 space-y-3">
                {(Object.keys(PRIORITY_LABELS) as Array<keyof typeof PRIORITY_LABELS>).map((bucket) => (
                  <div key={bucket} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">
                        {PRIORITY_LABELS[bucket]} <span className="text-white/50">({priorityBuckets[bucket].length})</span>
                      </span>
                    </div>
                    {priorityBuckets[bucket].length === 0 ? (
                      <p className="mt-2 text-xs text-white/50">No tasks yet.</p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-xs text-white/80">
                        {priorityBuckets[bucket].slice(0, 4).map((task) => (
                          <li key={task.id} className="truncate">
                            {task.title ?? "Untitled"}
                          </li>
                        ))}
                        {priorityBuckets[bucket].length > 4 && (
                          <li className="text-white/50">+{priorityBuckets[bucket].length - 4} more</li>
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">Focus board</p>
                <p className="text-sm text-white/60">
                  Showing tasks scheduled between {dateRange.start} and {dateRange.end}
                </p>
              </div>
              <button
                onClick={() => fetchTasks(dateRange)}
                className="rounded-full border border-white/30 px-3 py-1 text-sm text-white/80 transition hover:border-white"
              >
                Refresh
              </button>
            </div>

            {loadingTasks ? (
              <div className="py-10 text-center text-sm text-white/60">Loading schedule…</div>
            ) : tasksForFocusDay.length === 0 ? (
              <div className="py-10 text-center text-sm text-white/60">No blocks scheduled for this day.</div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {(Object.keys(SLOT_LABELS) as TimeSlot[]).map((lane) => (
                  <div key={lane} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{SLOT_LABELS[lane]}</p>
                      <span className="text-xs text-white/50">{laneAssignments[lane].length}</span>
                    </div>
                    <div className="mt-3 space-y-3">
                      {laneAssignments[lane].length === 0 ? (
                        <p className="text-xs text-white/50">No items</p>
                      ) : (
                        laneAssignments[lane].map((task) => (
                          <div key={task.id} className="rounded-xl border border-white/10 bg-white/10 p-3">
                            <div className="text-xs uppercase tracking-wide text-white/60">
                              {timeRangeLabel(task)}
                            </div>
                            <div className="text-sm font-semibold">{task.title ?? "Untitled block"}</div>
                            <div className="text-xs text-white/60">{task.raw_text ?? "—"}</div>
                            <div className="mt-2 text-[11px] uppercase tracking-wide text-white/40">
                              {task.status ?? "intake"}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
