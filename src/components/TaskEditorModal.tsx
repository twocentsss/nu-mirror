"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export type TaskRecord = {
  id?: string;
  title?: string;
  raw_text?: string;
  status?: string;
  parent_task_id?: string;
  time?: { due_date?: string; time_of_day?: string; start_at?: string; end_at?: string };
  notes?: string;
  duration_min?: number;
  lf?: number;
  priority?: "low" | "medium" | "high";
};

type SuggestedSubtask = {
  title: string;
  duration_min?: number;
  rationale?: string;
};

export default function TaskEditorModal(props: {
  open: boolean;
  task: TaskRecord | null;
  allTasks: TaskRecord[];
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const task = props.task;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("intake");
  const [dueDate, setDueDate] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("ANYTIME");
  const [notes, setNotes] = useState("");
  const [durationMin, setDurationMin] = useState<number>(15);
  const [lf, setLf] = useState<number | "">("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");

  const [decomposing, setDecomposing] = useState(false);
  const [suggested, setSuggested] = useState<SuggestedSubtask[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!task) return;
    setTitle(task.title ?? "");
    setStatus(task.status ?? "intake");
    setDueDate(task.time?.due_date?.slice(0, 10) ?? "");
    setTimeOfDay(task.time?.time_of_day ?? "ANYTIME");
    setNotes(task.notes ?? "");
    setDurationMin(Number(task.duration_min ?? 15) || 15);
    setLf(task.lf ?? "");

    setSuggested([]);
    setSelectedIdx(new Set());
    setQ1("");
    setQ2("");
    setQ3("");
    setPriority(task.priority ?? "medium");
  }, [task]);

  const subtasks = useMemo(() => {
    if (!task?.id) return [];
    return props.allTasks.filter((t) => t.parent_task_id === task.id);
  }, [props.allTasks, task?.id]);

  if (!props.open || !task) return null;

  async function save() {
    if (!task) return;
    setSaving(true);
    try {
      if (task.id) {
        // UPDATE existing
        const res = await fetch("/api/cogos/task/update", {
          method: "POST",
          headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          title,
          status,
          due_date: dueDate,
          time_of_day: timeOfDay,
          notes,
          duration_min: durationMin,
          lf: lf === "" ? undefined : Number(lf),
          priority,
        }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          alert(j.error ?? "Failed to save");
          return;
        }
      } else {
        // CREATE new
        const res = await fetch("/api/cogos/task/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title || "New Task",
          raw_text: title || notes || "New Task",
          status,
          due_date: dueDate,
          time_of_day: timeOfDay,
          notes,
          duration_min: durationMin,
          lf: lf === "" ? undefined : Number(lf),
          priority,
        }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          alert(j.error ?? "Failed to create");
          return;
        }
      }

      await props.onChanged();
      props.onClose();
    } finally {
      setSaving(false);
    }
  }

  async function suggestBreakdown() {
    setDecomposing(true);
    try {
      const answers: Record<string, string> = {};
      if (q1.trim()) answers["Goal / outcome"] = q1.trim();
      if (q2.trim()) answers["Constraints / constraints"] = q2.trim();
      if (q3.trim()) answers["Context / stakeholders"] = q3.trim();

      const res = await fetch("/api/cogos/task/decompose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          notes,
          duration_min: durationMin,
          answers,
          model: "gpt-4.1-mini",
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        alert(j.error ?? "Decompose failed");
        return;
      }
      const list = (j.subtasks ?? []) as SuggestedSubtask[];
      setSuggested(list);
      setSelectedIdx(new Set(list.map((_, i) => i)));
    } finally {
      setDecomposing(false);
    }
  }

  async function createSelectedSubtasks() {
    if (!task) return;
    if (!suggested.length) return;
    const indices = [...selectedIdx.values()];
    if (!indices.length) return;

    const items = indices.map((i) => ({
      title: suggested[i].title,
      duration_min: suggested[i].duration_min ?? 15,
      notes: suggested[i].rationale ?? "",
    }));

    const res = await fetch("/api/cogos/task/createMany", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        parent_task_id: task.id,
        due_date: dueDate,
        time_of_day: timeOfDay,
        items,
      }),
    });

    const j = await res.json();
    if (!res.ok || !j.ok) {
      alert(j.error ?? "Failed to create subtasks");
      return;
    }

    await props.onChanged();
    setSuggested([]);
    setSelectedIdx(new Set());
  }

  async function deleteTask() {
    if (!task?.id) return;
    if (!confirm("Are you sure you want to delete this task?")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/cogos/task/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: task.id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Failed to delete");
        return;
      }
      await props.onChanged();
      props.onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AnimatePresence>
      {props.open && task && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onMouseDown={props.onClose}
        >
          <motion.div
            className="w-full sm:max-w-xl sm:rounded-2xl rounded-t-3xl border border-white/10 bg-[#121212] text-white shadow-[0_0_100px_rgba(0,0,0,0.8)] h-[90vh] sm:h-[85vh] flex flex-col"
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 25 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
              <div className="text-lg font-semibold text-[var(--text-primary)]">{task.id ? "Edit task" : "Create task"}</div>
              <button className="rounded-full border border-[var(--glass-border)] px-3 py-1 text-sm hover:bg-[var(--glass-border)] transition text-[var(--text-secondary)]" onClick={props.onClose}>
                Close
              </button>
            </div>

        <div className="overflow-y-auto p-4 flex-1">
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-[0.4em] text-white/60">Title</label>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300 transition"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.4em] text-white/60">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {["intake", "defined", "planned", "doing", "blocked", "done"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setStatus(option)}
                        className={`flex-1 min-w-[80px] rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                          status === option
                            ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                            : "border-white/10 text-white/60"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.4em] text-white/60">Due date</label>
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.4em] text-white/60">Time of day</label>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  >
                    {["ANYTIME", "MORNING", "AFTERNOON", "EVENING"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.4em] text-white/60">Duration</label>
                  <input
                    type="range"
                    min={5}
                    max={180}
                    value={durationMin}
                    onChange={(e) => setDurationMin(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                  <div className="text-[12px] text-white/70">
                    {durationMin} min
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.4em] text-white/60">Life focus</label>
                  <input
                    type="range"
                    min={1}
                    max={9}
                    value={lf === "" ? 1 : lf}
                    onChange={(e) => setLf(Number(e.target.value))}
                    className="w-full accent-purple-400"
                  />
                  <div className="text-[12px] text-white/70">
                    LF {lf === "" ? 1 : lf}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.4em] text-white/60">Priority</label>
                <div className="flex gap-2">
                  {["low", "medium", "high"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPriority(level as "low" | "medium" | "high")}
                      className={`flex-1 rounded-2xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                        priority === level
                          ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white"
                          : "border border-white/15 bg-white/5 text-white/70"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-cyan-300"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes"
              />

            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]/50 p-3">
              <div className="text-sm font-semibold text-[var(--text-primary)]">Subtasks ({subtasks.length})</div>
              {subtasks.length === 0 ? (
                <div className="mt-2 text-xs text-[var(--text-secondary)] opacity-70">No subtasks yet.</div>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {subtasks.map((t) => (
                    <li key={t.id} className="text-[var(--text-secondary)]">• {t.title}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]/50 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-[var(--text-primary)]">AI breakdown</div>
                <button
                  className="rounded-full bg-[var(--accent-color)] px-3 py-1 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition"
                  disabled={decomposing}
                  onClick={suggestBreakdown}
                >
                  {decomposing ? "Thinking..." : "Suggest breakdown"}
                </button>
              </div>

              <div className="mt-2 grid gap-2">
                <input className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-sm"
                  value={q1} onChange={(e) => setQ1(e.target.value)} placeholder="Goal/outcome (optional)" />
                <input className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-sm"
                  value={q2} onChange={(e) => setQ2(e.target.value)} placeholder="Constraints (optional)" />
                <input className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-sm"
                  value={q3} onChange={(e) => setQ3(e.target.value)} placeholder="Context/stakeholders (optional)" />
              </div>

              {suggested.length > 0 && (
                <div className="mt-3 space-y-2">
                  {suggested.map((s, i) => {
                    const checked = selectedIdx.has(i);
                    return (
                      <label key={i} className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = new Set(selectedIdx);
                            if (next.has(i)) next.delete(i);
                            else next.add(i);
                            setSelectedIdx(next);
                          }}
                          className="mt-1"
                        />
                        <div>
                          <div className="text-sm font-semibold">{s.title}</div>
                          <div className="text-xs text-white/60">
                            {s.duration_min ? `${s.duration_min} min` : ""} {s.rationale ? `— ${s.rationale}` : ""}
                          </div>
                        </div>
                      </label>
                    );
                  })}

                  <button
                    className="w-full rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
                    onClick={createSelectedSubtasks}
                    disabled={selectedIdx.size === 0}
                  >
                    Create selected subtasks
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 space-y-3">
              <button
                className="w-full rounded-full bg-white px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
                disabled={saving || deleting}
                onClick={save}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>

              {task.id && (
                <button
                  className="w-full rounded-full border border-red-500/50 text-red-400 px-3 py-2 text-sm font-semibold hover:bg-red-500/10 disabled:opacity-50"
                  disabled={saving || deleting}
                  onClick={deleteTask}
                >
                  {deleting ? "Deleting…" : "Delete task"}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
    </AnimatePresence>
  );
}
