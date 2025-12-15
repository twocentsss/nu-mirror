"use client";

import { useEffect, useMemo, useState } from "react";

type TaskRecord = {
  id?: string;
  title?: string;
  raw_text?: string;
  status?: string;
  parent_task_id?: string;
  time?: { due_date?: string; time_of_day?: string; start_at?: string; end_at?: string };
  notes?: string;
  duration_min?: number;
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

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("intake");
  const [dueDate, setDueDate] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("ANYTIME");
  const [notes, setNotes] = useState("");
  const [durationMin, setDurationMin] = useState<number>(15);

  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");

  const [decomposing, setDecomposing] = useState(false);
  const [suggested, setSuggested] = useState<Array<{ title: string; duration_min?: number; rationale?: string }>>([]);
  const [selectedIdx, setSelectedIdx] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!task) return;
    setTitle(task.title ?? "");
    setStatus(task.status ?? "intake");
    setDueDate(task.time?.due_date?.slice(0, 10) ?? "");
    setTimeOfDay(task.time?.time_of_day ?? "ANYTIME");
    setNotes((task as any).notes ?? "");
    setDurationMin(Number((task as any).duration_min ?? 15) || 15);

    setSuggested([]);
    setSelectedIdx(new Set());
    setQ1(""); setQ2(""); setQ3("");
  }, [task?.id]);

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
            raw_text: title,
            status,
            due_date: dueDate,
            time_of_day: timeOfDay,
            notes,
            duration_min: durationMin,
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
      const list = (j.subtasks ?? []) as any[];
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center" onMouseDown={props.onClose}>
      <div
        className="mx-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b0d17] text-white shadow-xl max-h-[90vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="text-lg font-semibold">{task.id ? "Edit task" : "Create task"}</div>
          <button className="rounded-full border border-white/20 px-3 py-1 text-sm" onClick={props.onClose}>
            Close
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          <div className="space-y-3">
            <input
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {["intake", "defined", "decomposed", "planned", "doing", "blocked", "done", "canceled"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <input
                type="date"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
              >
                {["ANYTIME", "MORNING", "AFTERNOON", "EVENING"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <input
                type="number"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value || 0))}
                min={1}
              />
            </div>

            <textarea
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes"
            />

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-sm font-semibold">Subtasks ({subtasks.length})</div>
              {subtasks.length === 0 ? (
                <div className="mt-2 text-xs text-white/50">No subtasks yet.</div>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {subtasks.map((t) => (
                    <li key={t.id} className="text-white/80">• {t.title}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">AI breakdown</div>
                <button
                  className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-black disabled:opacity-50"
                  disabled={decomposing}
                  onClick={suggestBreakdown}
                >
                  {decomposing ? "Thinking…" : "Suggest breakdown"}
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
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            className="w-full rounded-full bg-white px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
            disabled={saving}
            onClick={save}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
