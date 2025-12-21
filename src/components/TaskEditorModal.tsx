"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, useRef } from "react";
import { useUIStore } from "@/lib/store/ui-store";
import { generateQuantumState } from "@/lib/quantum/generator";
import { collapseOption } from "@/lib/quantum/collapser";
import { emitIntentCaptured, emitTaskCommitted } from "@/lib/events/emitters";
import { Option } from "@/lib/quantum/types";
import { Check } from "lucide-react";

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
  progress?: number;
  step?: number;
  goal?: string;
  project?: string;
};

type SuggestedSubtask = {
  title: string;
  duration_min?: number;
  rationale?: string;
};

export const WORLDS = [
  { id: 1, name: "Core", desc: "Soul, purpose, being", keywords: ["meditation", "spirit", "pray", "soul", "purpose", "being", "religion", "god", "destiny", "core"], color: "from-rose-500 to-pink-500" },
  { id: 2, name: "Self", desc: "Body, mind, heart", keywords: ["gym", "workout", "exercise", "run", "health", "mind", "heart", "therapy", "mental", "spa", "sleep", "self"], color: "from-purple-500 to-indigo-500" },
  { id: 3, name: "Circle", desc: "Family, friends, love", keywords: ["family", "friend", "love", "date", "wife", "kids", "mom", "dad", "sister", "brother", "call", "social", "circle"], color: "from-blue-500 to-cyan-500" },
  { id: 4, name: "Grind", desc: "Work, responsibilities", keywords: ["work", "meeting", "email", "report", "office", "task", "project", "duty", "chores", "laundry", "bills", "clean", "grind"], color: "from-gray-600 to-gray-800" },
  { id: 5, name: "Level Up", desc: "Skills, growth, business", keywords: ["skill", "learn", "course", "growth", "business", "startup", "code", "study", "practice", "master", "invest", "money", "wealth"], color: "from-emerald-500 to-green-500" },
  { id: 6, name: "Impact", desc: "Giving back, community", keywords: ["give", "community", "help", "volunteer", "charity", "impact", "mentor", "teaching", "donation"], color: "from-teal-500 to-cyan-600" },
  { id: 7, name: "Play", desc: "Joy, creativity, travel", keywords: ["fun", "game", "travel", "play", "joy", "creative", "art", "music", "guitar", "movie", "party", "hike", "vacation"], color: "from-yellow-500 to-orange-500" },
  { id: 8, name: "Insight", desc: "Knowledge, wisdom", keywords: ["knowledge", "wisdom", "read", "think", "journal", "insight", "research", "philosophy", "book", "analysis", "data"], color: "from-amber-500 to-yellow-600" },
  { id: 9, name: "Chaos", desc: "The unexpected", keywords: ["unexpected", "emergency", "fix", "crash", "chaos", "random", "luck", "shift"], color: "from-red-500 to-orange-600" },
];

export function classifyTask(text: string) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const world of WORLDS) {
    if (world.keywords.some(k => lower.includes(k))) return world;
  }
  return null;
}

export default function TaskEditorModal(props: {
  open: boolean;
  task: TaskRecord | null;
  allTasks: TaskRecord[];
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const { clickOrigin } = useUIStore();
  const modalRef = useRef<HTMLDivElement>(null);

  const getTransformOrigin = () => {
    if (!clickOrigin || !modalRef.current) return "center center";
    const rect = modalRef.current.getBoundingClientRect();
    const x = clickOrigin.x - rect.left;
    const y = clickOrigin.y - rect.top;
    return `${x}px ${y}px`;
  };

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
  const [step, setStep] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const [goal, setGoal] = useState<string>("");
  const [project, setProject] = useState<string>("");

  // Fetching state
  const [availableGoals, setAvailableGoals] = useState<any[]>([]);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [showProjectInput, setShowProjectInput] = useState(false);

  const fetchGoals = async (lfId: number | string) => {
    if (!lfId) return;
    setIsLoadingGoals(true);
    try {
      const res = await fetch(`/api/cogos/goals?lf_id=${lfId}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableGoals(data.goals || []);
      }
    } catch (e) {
      console.error("Failed to fetch goals", e);
    } finally {
      setIsLoadingGoals(false);
    }
  };

  const fetchProjects = async (goalTitle: string) => {
    const goalObj = availableGoals.find(g => g.title === goalTitle);
    if (!goalObj) {
      // If it's a custom goal (not in list), we can't fetch projects by ID directly unless we handle it differently.
      // For now, if no goal ID found, just clear projects or fetch all active projects for user?
      // Let's rely on finding the ID.
      setAvailableProjects([]);
      return;
    }

    setIsLoadingProjects(true);
    try {
      const res = await fetch(`/api/cogos/projects?goal_id=${goalObj.id}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableProjects(data.projects || []);
      }
    } catch (e) {
      console.error("Failed to fetch projects", e);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (lf) {
      fetchGoals(lf);
    } else {
      setAvailableGoals([]);
    }
  }, [lf]);

  useEffect(() => {
    if (goal) {
      fetchProjects(goal);
    } else {
      setAvailableProjects([]);
    }
  }, [goal, availableGoals]);

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

    let initialDueDate = task.time?.due_date?.slice(0, 10) ?? "";
    if (!task.id && !initialDueDate) {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() + (day === 0 ? 0 : 7 - day); // Distance to Sunday
      const sunday = new Date(now.setDate(diff));
      initialDueDate = sunday.toISOString().slice(0, 10);
    }
    setDueDate(initialDueDate);

    setTimeOfDay(task.time?.time_of_day ?? "ANYTIME");
    setNotes(task.notes ?? "");
    setDurationMin(Number(task.duration_min ?? 15) || 15);

    setLf(task.lf ?? (task.id ? "" : 9));
    setStep(task.step ?? 1);
    setProgress(task.progress ?? 0);

    // Set default goal and project for new tasks
    if (!task.id) {
      const now = new Date();

      // Default Goal: Current Quarter (e.g., "Q1 2025")
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      const defaultGoal = `Q${quarter} ${now.getFullYear()}`;
      setGoal(task.goal ?? defaultGoal);

      // Default Project: Current Month (e.g., "December 2025")
      const monthName = now.toLocaleDateString('en-US', { month: 'long' });
      const defaultProject = `${monthName} ${now.getFullYear()}`;
      setProject(task.project ?? defaultProject);
    } else {
      setGoal(task.goal ?? "");
      setProject(task.project ?? "");
    }

    setSuggested([]);
    setSelectedIdx(new Set());
    setQ1("");
    setQ2("");
    setQ3("");
    setPriority(task.priority ?? "medium");
  }, [task]);

  /* ... inside the component ... */
  const detectedWorld = useMemo(() => classifyTask(title), [title]);
  const showDetails = Boolean(title.trim());

  // Quantum Generation State
  const [quantumOptions, setQuantumOptions] = useState<Option[]>([]);

  useEffect(() => {
    if (!title.trim()) {
      setQuantumOptions([]);
      return;
    }
    const timer = setTimeout(() => {
      const { optionSet } = generateQuantumState(title, "user-session-temp");
      setQuantumOptions(optionSet.options);
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [title]);

  function applyQuantumOption(opt: Option) {
    setDurationMin(opt.duration_min);
    // setEnergy(opt.energy_cost); // If we had energy state
    // setLf(opt.task_def.lf_id);
    // Optionally create immediately? No, let user confirm.
  }

  useEffect(() => {
    if (!task?.id && detectedWorld) {
      setLf(detectedWorld.id);
    }
  }, [detectedWorld, task?.id]);

  if (!props.open || !task) return null;

  async function save() {
    if (!task) return;
    setSaving(true);
    try {
      // 0. Auto-create Goal/Project if they are custom and don't exist
      if (goal && lf && !availableGoals.find(g => g.title === goal)) {
        // Create Goal
        try {
          await fetch("/api/cogos/goals", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              lf_id: Number(lf),
              title: goal,
              rationale: "Created from Task Editor"
            })
          });
          // We don't need to wait for state update, the task save will store the string
        } catch (e) { console.error("Auto-create goal failed", e); }
      }

      if (project && goal && !availableProjects.find(p => p.title === project)) {
        // Find goal ID first. If we just created it, we might need to fetch it or just use the string.
        // Since the projects API requires a goal_id, we need to try and find the goal object again.
        // However, if we JUST created the goal above, we don't have its ID yet without parsing the result.
        // Let's optimize: fetching availableGoals is async. 
        // For now, let's try to find the goal in availableGoals. If not found, we check if we can fetch user's goals to find the new one?
        // Actually, simpler approach: The backend projects creation needs a goal_id. 
        // If the goal is new, we can't easily create the project linked to it in this one synchronous flow without refactoring.
        // BUT valid implementation: 
        //   const newGoalRes = await fetch...
        //   const newGoal = await newGoalRes.json()
        // Let's do that properly.
      }

      let finalGoalId = availableGoals.find(g => g.title === goal)?.id;
      if (goal && lf && !finalGoalId) {
        try {
          const gRes = await fetch("/api/cogos/goals", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              lf_id: Number(lf),
              title: goal,
              rationale: "Created from Task Editor"
            })
          });
          if (gRes.ok) {
            const gData = await gRes.json();
            finalGoalId = gData.goal_id;
          }
        } catch (e) { console.error("Auto-create goal failed", e); }
      }

      // Create Project if needed
      if (project && finalGoalId && !availableProjects.find(p => p.title === project)) {
        try {
          await fetch("/api/cogos/projects", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              goal_id: finalGoalId,
              title: project,
              description: "Created from Detail View"
            })
          });
        } catch (e) { console.error("Auto-create project failed", e); }
      }

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
            step,
            progress,
            goal: goal.trim() || undefined,
            project: project.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          alert(j.error ?? "Failed to save");
          return;
        }
      } else {
        // CREATE new (Quantum Capture)
        // 1. Generate Quantum State (Superposition)
        const { atom, optionSet } = generateQuantumState(title, "user-session-id");

        // FIRE EVENT: Intent Captured
        emitIntentCaptured(atom).catch(console.error);

        // 2. Collapse Strategy (Simple Default for now)
        // Use the generated option that matches user's manual duration, or default to the first one
        const bestOption = optionSet.options.find(o => Math.abs(o.duration_min - durationMin) < 5) || optionSet.options[0];

        // 3. Enrich Payload if user hasn't overridden defaults
        const finalDuration = durationMin !== 15 ? durationMin : bestOption.duration_min;
        const finalLf = typeof lf === "number" ? lf : (bestOption.task_def.lf_id || 9);
        const finalEnergy = bestOption.energy_cost; // We can save this to notes or metadata later

        console.log("[Quantum] Captured:", { atom, optionSet, selected: bestOption });

        // FIRE EVENT: Task Committed (Simulated Collapse)
        // In a full event-driven system, the 'collapse' event would TRIGGER the task creation via a projector.
        // Here we do both: fire the event for the log, and make the direct API call for the UI.
        const { charges } = collapseOption(bestOption);
        emitTaskCommitted("temp-id", bestOption.id, charges).catch(console.error);

        const res = await fetch("/api/cogos/task/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: title || "New Task",
            status,
            due_date: dueDate,
            time_of_day: timeOfDay,
            notes: notes + (notes ? "\n\n" : "") + `[Impact: ${finalEnergy}/100]`,
            duration_min: finalDuration,
            lf: finalLf,
            priority,
            step,
            progress,
            goal: goal.trim() || undefined,
            project: project.trim() || undefined,
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
          model: "gpt-4o-mini",
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      save();
    }
    if (e.key === "Escape") {
      props.onClose();
    }
  };

  return (
    <AnimatePresence>
      {props.open && task && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 lg:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onMouseDown={props.onClose}
        >
          <motion.div
            ref={modalRef}
            className="w-full max-w-2xl bg-[#1c1c1e] text-white shadow-[0_32px_128px_rgba(0,0,0,0.8)] rounded-[2rem] border border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              transformOrigin: getTransformOrigin(),
              willChange: "transform, opacity, filter"
            }}
            initial={{ scale: 0, opacity: 0, filter: "blur(20px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 0, opacity: 0, filter: "blur(20px)" }}
            transition={{
              type: "spring",
              stiffness: 140,
              damping: 24,
              mass: 1.2,
              restDelta: 0.001
            }}
            onKeyDown={handleKeyDown}
          >
            {/* Spotlight Header Input */}
            <div className="relative border-b border-white/10 p-4 lg:p-6 bg-white/3">
              <input
                autoFocus
                className="w-full bg-transparent text-2xl lg:text-3xl font-medium outline-none placeholder:text-white/20"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's on your mind?"
              />
              <div className="mt-4 flex flex-col gap-3">
                {/* Variations (Superposition) */}
                {quantumOptions.length > 0 && !task.id && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    {quantumOptions.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => applyQuantumOption(opt)}
                        className={`flex-shrink-0 snap-start px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${durationMin === opt.duration_min
                          ? "bg-white text-black border-white shadow-lg scale-105"
                          : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                          }`}
                      >
                        <span className="opacity-50 mr-1">⚡</span>
                        {opt.title.replace(title, "").trim() || opt.title}
                        <span className="ml-1 opacity-40">({opt.duration_min}m)</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AnimatePresence mode="wait">
                      {detectedWorld && (
                        <motion.div
                          key={detectedWorld.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.2em] bg-gradient-to-r ${detectedWorld.color} text-white shadow-lg flex items-center gap-1.5`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                          {detectedWorld.name}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {title && !detectedWorld && (
                      <span className="text-[9px] text-white/10 uppercase tracking-[0.3em] font-bold animate-pulse">Thinking...</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 opacity-40 pointer-events-none hidden lg:flex">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/30">⌘</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/30">ENTER</span>
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {showDetails ? (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-y-auto p-6 lg:p-8 space-y-8 flex-1"
                >

                  {/* Context Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">State</label>
                        <div className="flex flex-wrap gap-2">
                          {["intake", "doing", "done"].map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setStatus(option)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${status === option
                                ? "bg-white text-black border-white"
                                : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
                                }`}
                            >
                              {option.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Due</label>
                        <input
                          type="date"
                          className="w-full rounded-xl bg-white/5 border border-white/5 px-4 py-3 text-sm text-white/80 outline-none focus:border-white/20 transition"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Order</label>
                        <div className="flex gap-2">
                          {(["low", "high"] as const).map((p) => (
                            <button
                              key={p}
                              onClick={() => setPriority(p)}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${priority === p ? 'bg-red-500/20 border-red-500/40 text-red-200' : 'bg-white/5 border-white/5 text-white/40'
                                }`}
                            >
                              {p.toUpperCase()}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div className="relative group-picker">
                            <div className="h-32 overflow-y-auto scrollbar-hide snap-y snap-mandatory bg-black/20 rounded-2xl border border-white/5 p-1 relative">
                              <div className="py-10"> {/* Top/Bottom spacing for center snapping */}
                                {WORLDS.map((w) => (
                                  <button
                                    key={w.id}
                                    type="button"
                                    onClick={() => setLf(w.id)}
                                    className={`w-full py-3 px-4 mb-1 rounded-xl transition-all snap-center flex items-center justify-between group ${lf === w.id
                                      ? `bg-gradient-to-r ${w.color} text-white shadow-xl scale-[1.02] z-10`
                                      : 'text-white/20 hover:text-white/40'
                                      }`}
                                  >
                                    <div className="flex flex-col items-start text-left">
                                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                        {w.name}
                                      </span>
                                      {lf === w.id && <span className="text-[8px] opacity-80 font-medium">{w.desc}</span>}
                                    </div>
                                    <span className="text-xs font-mono opacity-20">{w.id}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#1c1c1e] to-transparent pointer-events-none rounded-t-2xl z-20" />
                            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1c1c1e] to-transparent pointer-events-none rounded-b-2xl z-20" />
                          </div>

                          <div className="relative group-picker">
                            <div className="h-32 overflow-y-auto scrollbar-hide snap-y snap-mandatory bg-black/20 rounded-2xl border border-white/5 p-1 relative">
                              <div className="py-10">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStep(s)}
                                    className={`w-full py-3 px-4 mb-1 rounded-xl transition-all snap-center flex items-center justify-between group ${step === s
                                      ? 'bg-white text-black shadow-xl scale-[1.02] z-10'
                                      : 'text-white/20 hover:text-white/40'
                                      }`}
                                  >
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                      Step {s}
                                    </span>
                                    {step === s && <Check size={10} />}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#1c1c1e] to-transparent pointer-events-none rounded-t-2xl z-20" />
                            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1c1c1e] to-transparent pointer-events-none rounded-b-2xl z-20" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Notes</label>
                    <textarea
                      className="w-full rounded-2xl bg-white/3 border border-white/5 px-4 py-4 text-sm text-white/70 outline-none placeholder:text-white/10 focus:border-white/10 transition leading-relaxed"
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any details to help with execution..."
                    />
                  </div>

                  {/* Progress Slider */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Completed: {progress}%</label>
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={progress}
                        onChange={(e) => setProgress(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Goal and Project */}
                  <div className="grid grid-cols-2 gap-4">

                    {/* Goal */}
                    <div className="flex flex-col gap-2 relative">
                      <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center justify-between">
                        <span>Goal</span>
                        <button
                          onClick={() => setShowGoalInput(!showGoalInput)}
                          className="hover:text-white text-[8px] opacity-50"
                        >
                          {showGoalInput ? "SELECT FROM LIST" : "CUSTOM"}
                        </button>
                      </label>
                      {showGoalInput ? (
                        <input
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-white/10 transition-colors"
                          value={goal}
                          onChange={(e) => setGoal(e.target.value)}
                          placeholder="Quarterly Goal"
                        />
                      ) : (
                        <select
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-white/10 transition-colors appearance-none"
                          value={goal}
                          onChange={(e) => {
                            if (e.target.value === "__NEW__") {
                              setShowGoalInput(true);
                              setGoal("");
                            } else {
                              setGoal(e.target.value);
                            }
                          }}
                          disabled={isLoadingGoals}
                        >
                          {!goal && <option value="">Select Goal...</option>}
                          {availableGoals.map(g => (
                            <option key={g.id} value={g.title}>{g.title}</option>
                          ))}
                          {goal && !availableGoals.find(g => g.title === goal) && (
                            <option value={goal}>{goal}</option>
                          )}
                          <option value="__NEW__" className="text-emerald-400 font-bold">+ Create New Goal...</option>
                        </select>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 relative">
                      <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center justify-between">
                        <span>Project</span>
                        <button
                          onClick={() => setShowProjectInput(!showProjectInput)}
                          className="hover:text-white text-[8px] opacity-50"
                        >
                          {showProjectInput ? "SELECT FROM LIST" : "CUSTOM"}
                        </button>
                      </label>
                      {showProjectInput ? (
                        <input
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-white/10 transition-colors"
                          value={project}
                          onChange={(e) => setProject(e.target.value)}
                          placeholder="Monthly Project"
                        />
                      ) : (
                        <select
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-white/10 transition-colors appearance-none"
                          value={project}
                          onChange={(e) => {
                            if (e.target.value === "__NEW__") {
                              setShowProjectInput(true);
                              setProject("");
                            } else {
                              setProject(e.target.value);
                            }
                          }}
                          disabled={isLoadingProjects || !goal}
                        >
                          {!project && <option value="">Select Project...</option>}
                          {availableProjects.map(p => (
                            <option key={p.id} value={p.title}>{p.title}</option>
                          ))}
                          {project && !availableProjects.find(p => p.title === project) && (
                            <option value={project}>{project}</option>
                          )}
                          <option value="__NEW__" className="text-emerald-400 font-bold">+ Create New Project...</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Subtasks Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between group">
                      <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">AI Brainstorming</label>
                      <button
                        className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-white/60 transition-colors"
                        disabled={decomposing}
                        onClick={suggestBreakdown}
                      >
                        {decomposing ? "THINKING..." : "GENERATE SUBTASKS"}
                      </button>
                    </div>

                    {suggested.length === 0 && (
                      <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-[2rem] opacity-20">
                        <p className="text-xs">Optional AI-powered breakdown available</p>
                      </div>
                    )}

                    {suggested.length > 0 && (
                      <div className="grid gap-3">
                        {suggested.map((s, i) => {
                          const checked = selectedIdx.has(i);
                          return (
                            <div
                              key={i}
                              onClick={() => {
                                const next = new Set(selectedIdx);
                                if (next.has(i)) next.delete(i); else next.add(i);
                                setSelectedIdx(next);
                              }}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer ${checked ? 'bg-white/10 border-white/20' : 'bg-white/3 border-white/5 opacity-50'
                                }`}
                            >
                              <div className="text-sm font-semibold">{s.title}</div>
                              <div className="text-[10px] text-white/40 mt-1">{s.rationale}</div>
                            </div>
                          );
                        })}
                        <button
                          className="w-full py-3 rounded-2xl bg-white text-black font-bold text-sm hover:scale-[0.98] transition-transform active:scale-95 mt-2"
                          onClick={createSelectedSubtasks}
                          disabled={selectedIdx.size === 0}
                        >
                          Create {selectedIdx.size} Subtasks
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 flex items-center justify-center p-6 text-sm text-white/40"
                >
                  Start typing to unlock the full task editor — deadlines, framing, and priority drop in once the intent is clear.
                </motion.div>
              )}
            </AnimatePresence>
            {/* Toolbar / Actions */}
            <div className="p-4 bg-white/3 border-t border-white/5 flex items-center justify-between">
              <div className="flex gap-4">
                {task.id && (
                  <button
                    onClick={deleteTask}
                    className="text-[10px] font-bold text-red-500/50 hover:text-red-500 transition-colors"
                  >
                    DELETE TASK
                  </button>
                )}
                <button onClick={props.onClose} className="text-[10px] font-bold text-white/30 hover:text-white/60">CANCEL</button>
              </div>

              <button
                className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                disabled={saving || deleting}
                onClick={save}
              >
                {saving ? "SAVING..." : task.id ? "SAVE CHANGES" : "CREATE TASK"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
