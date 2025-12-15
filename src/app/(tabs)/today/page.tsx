"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import TopNav from "@/components/TopNav";

type ViewMode = "DAY" | "3DAY" | "WEEK" | "MONTH";
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
  duration_minutes?: number;
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

const STATUS_OPTIONS = ["intake", "defined", "decomposed", "planned", "doing", "blocked", "done", "canceled"] as const;

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
      const diff = (day + 6) % 7;
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

function timeToHHMM(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
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

  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const openTask = useMemo(() => tasks.find((t) => t.id === openTaskId) ?? null, [tasks, openTaskId]);
  const childTasks = useMemo(() => {
    if (!openTask?.id) return [];
    return tasks.filter((t) => t.parent_task_id === openTask.id);
  }, [tasks, openTask?.id]);

  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState<(typeof STATUS_OPTIONS)[number]>("intake");
  const [editDueDate, setEditDueDate] = useState("");
  const [editSlot, setEditSlot] = useState<TimeSlot>("ANYTIME");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editDuration, setEditDuration] = useState<number>(15);
  const [editNotes, setEditNotes] = useState("");

  const [answers, setAnswers] = useState<{ done: string; constraints: string; deadline: string; duration: string }>({
    done: "",
    constraints: "",
    deadline: "",
    duration: "",
  });
  const [suggested, setSuggested] = useState<Array<{ title: string }>>([]);
  const [selectedSubtaskIdx, setSelectedSubtaskIdx] = useState<Set<number>>(new Set());
  const [saveBusy, setSaveBusy] = useState(false);
  const [breakdownBusy, setBreakdownBusy] = useState(false);
  const [createSubsBusy, setCreateSubsBusy] = useState(false);

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

  useEffect(() => {
    if (!openTask) return;

    setEditTitle(openTask.title ?? openTask.raw_text ?? "");
    setEditStatus((openTask.status as any) ?? "intake");
    setEditDueDate(openTask.time?.due_date?.slice(0, 10) ?? "");
    setEditSlot((openTask.time?.time_of_day as TimeSlot) ?? "ANYTIME");
    setEditStart(timeToHHMM(openTask.time?.start_at));
    setEditEnd(timeToHHMM(openTask.time?.end_at));
    setEditDuration(Number(openTask.duration_minutes ?? 15));
    setEditNotes(String(openTask.notes ?? ""));
    setSuggested([]);
    setSelectedSubtaskIdx(new Set());
    setAnswers({ done: "", constraints: "", deadline: "", duration: "" });
  }, [openTaskId]);

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

  async function saveTaskEdits() {
    if (!openTask?.id) return;

    setSaveBusy(true);
    try {
      const patch = {
        id: openTask.id,
        _row: openTask._row,
        title: editTitle,
        status: editStatus,
        due_date: editDueDate || undefined,
        time_of_day: editSlot,
        start_at: editStart ? composeIso(editDueDate || formatISODate(new Date()), editStart) : undefined,
        end_at: editEnd ? composeIso(editDueDate || formatISODate(new Date()), editEnd) : undefined,
        notes: editNotes,
        duration_minutes: Number.isFinite(editDuration) ? editDuration : undefined,
      };

      const res = await fetch("/api/cogos/task/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (res.ok) await fetchTasks(dateRange);
    } finally {
      setSaveBusy(false);
    }
  }

  async function suggestBreakdown() {
    if (!openTask?.id) return;

    setBreakdownBusy(true);
    try {
      const res = await fetch("/api/cogos/task/decompose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: openTask.title ?? openTask.raw_text ?? "",
          answers,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const subs = (data.subtasks ?? []).slice(0, 12);
      setSuggested(subs);
      const all = new Set<number>();
      subs.forEach((_, idx) => all.add(idx));
      setSelectedSubtaskIdx(all);
    } finally {
      setBreakdownBusy(false);
    }
  }

  async function createSelectedSubtasks() {
    if (!openTask?.id) return;
    if (suggested.length === 0 || selectedSubtaskIdx.size === 0) return;

    setCreateSubsBusy(true);
    try {
      const toCreate = suggested
        .map((item, idx) => ({ item, idx }))
        .filter(({ idx }) => selectedSubtaskIdx.has(idx))
        .map(({ item }) => ({
          raw_text: item.title,
          title: item.title,
          due_date: editDueDate || openTask.time?.due_date?.slice(0, 10),
          time_of_day: "ANYTIME",
        }));

      if (toCreate.length > 0) {
        await fetch("/api/cogos/task/createMany", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            parent_task_id: openTask.id,
            subtasks: toCreate,
          }),
        });
      }

      await fetch("/api/cogos/task/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: openTask.id, _row: openTask._row, status: "decomposed" }),
      });

      await fetchTasks(dateRange);
    } finally {
      setCreateSubsBusy(false);
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

      {openTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0d16] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="text-sm text-white/70">
                Editing <span className="font-mono text-white/90">{openTask.id}</span>
              </div>
              <button
                className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/80 hover:border-white/50"
                onClick={() => setOpenTaskId(null)}
              >
                Close
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div>
                <label className="text-xs uppercase tracking-wide text-white/50">Title</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/60"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/60"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-[#0b0d16]">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Duration (min)</label>
                  <input
                    type="number"
                    min={0}
                    value={editDuration}
                    onChange={(e) => setEditDuration(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/60"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/60"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Slot</label>
                  <select
                    value={editSlot}
                    onChange={(e) => setEditSlot(e.target.value as TimeSlot)}
                    className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/60"
                  >
                    {Object.entries(SLOT_LABELS).map(([k, v]) => (
                      <option key={k} value={k} className="bg-[#0b0d16]">
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">Start</label>
                  <input
                    type="time"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/60"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-white/50">End</label>
                  <input
                    type="time"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/60"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-white/50">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/60"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Subtasks</div>
                  <button
                    onClick={suggestBreakdown}
                    disabled={breakdownBusy}
                    className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/80 hover:border-white/50 disabled:opacity-50"
                  >
                    {breakdownBusy ? "Suggesting…" : "Suggest breakdown"}
                  </button>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input
                    placeholder="Done looks like…"
                    value={answers.done}
                    onChange={(e) => setAnswers((a) => ({ ...a, done: e.target.value }))}
                    className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/60"
                  />
                  <input
                    placeholder="Constraints…"
                    value={answers.constraints}
                    onChange={(e) => setAnswers((a) => ({ ...a, constraints: e.target.value }))}
                    className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/60"
                  />
                  <input
                    placeholder="Deadline…"
                    value={answers.deadline}
                    onChange={(e) => setAnswers((a) => ({ ...a, deadline: e.target.value }))}
                    className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/60"
                  />
                  <input
                    placeholder="Target duration per subtask…"
                    value={answers.duration}
                    onChange={(e) => setAnswers((a) => ({ ...a, duration: e.target.value }))}
                    className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/60"
                  />
                </div>

                {suggested.length > 0 && (
                  <>
                    <div className="mt-3 space-y-2">
                      {suggested.map((s, idx) => {
                        const checked = selectedSubtaskIdx.has(idx);
                        return (
                          <label key={idx} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSelectedSubtaskIdx((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(idx)) next.delete(idx);
                                  else next.add(idx);
                                  return next;
                                })
                              }
                            />
                            <span className="text-white/90">{s.title}</span>
                          </label>
                        );
                      })}
                    </div>
                    <button
                      onClick={createSelectedSubtasks}
                      disabled={createSubsBusy}
                      className="mt-3 w-full rounded-full bg-white/90 px-3 py-2 text-center text-sm font-semibold text-black transition hover:bg-white disabled:opacity-50"
                    >
                      {createSubsBusy ? "Creating…" : "Create selected subtasks"}
                    </button>
                  </>
                )}

                {childTasks.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs uppercase tracking-wide text-white/50">Existing subtasks</div>
                    <div className="mt-2 space-y-2">
                      {childTasks.map((t) => (
                        <div key={t.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
                          <div className="font-semibold">{t.title ?? "Untitled"}</div>
                          <div className="text-xs text-white/60">{t.status ?? "intake"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveTaskEdits}
                  disabled={saveBusy}
                  className="flex-1 rounded-full bg-white/90 px-3 py-2 text-center text-sm font-semibold text-black transition hover:bg-white disabled:opacity-50"
                >
                  {saveBusy ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => setOpenTaskId(null)}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 hover:border-white/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                          <button
                            key={task.id}
                            onClick={() => setOpenTaskId(task.id ?? null)}
                            className="w-full text-left rounded-xl border border-white/10 bg-white/10 p-3 hover:border-white/30"
                          >
                            <div className="text-xs uppercase tracking-wide text-white/60">{timeRangeLabel(task)}</div>
                            <div className="text-sm font-semibold">{task.title ?? "Untitled block"}</div>
                            <div className="text-xs text-white/60">{task.raw_text ?? "—"}</div>
                            <div className="mt-2 text-[11px] uppercase tracking-wide text-white/40">
                              {task.status ?? "intake"}
                            </div>
                          </button>
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
