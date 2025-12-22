"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, useRef } from "react";
import { useUIStore } from "@/lib/store/ui-store";
import { usePersona } from "@/hooks/usePersona";
import { generateQuantumState } from "@/lib/quantum/generator";
import { collapseOption } from "@/lib/quantum/collapser";
import { emitIntentCaptured, emitTaskCommitted } from "@/lib/events/emitters";
import { Option } from "@/lib/quantum/types";
import { Check, Plus, Share2, Workflow } from "lucide-react";
import { WheelPicker, DateTimeWheelPicker, formatLocalDateTime, normalizeDateTimeValue } from "./common/WheelPicker";

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
  const { persona } = usePersona();

  const PERSONA_WORLDS = {
    DEVELOPER: [
      { id: 1, name: "Root", desc: "Soul, purpose, being", color: "from-rose-500 to-pink-500" },
      { id: 2, name: "Hardware", desc: "Body, mind, heart", color: "from-purple-500 to-indigo-500" },
      { id: 3, name: "Node", desc: "Family, friends, love", color: "from-blue-500 to-cyan-500" },
      { id: 4, name: "Runtime", desc: "Work, responsibilities", color: "from-gray-600 to-gray-800" },
      { id: 5, name: "Feature", desc: "Skills, growth, business", color: "from-emerald-500 to-green-500" },
      { id: 6, name: "Deploy", desc: "Giving back, community", color: "from-teal-500 to-cyan-600" },
      { id: 7, name: "Sandbox", desc: "Joy, creativity, travel", color: "from-yellow-500 to-orange-500" },
      { id: 8, name: "Debugger", desc: "Knowledge, wisdom", color: "from-amber-500 to-yellow-600" },
      { id: 9, name: "Kernel Panic", desc: "The unexpected", color: "from-red-500 to-orange-600" },
    ],
    EXECUTIVE: [
      { id: 1, name: "Foundation", desc: "Soul, purpose, being", color: "from-rose-500 to-pink-500" },
      { id: 2, name: "Capital", desc: "Body, mind, heart", color: "from-purple-500 to-indigo-500" },
      { id: 3, name: "Stakeholders", desc: "Family, friends, love", color: "from-blue-500 to-cyan-500" },
      { id: 4, name: "Pipeline", desc: "Work, responsibilities", color: "from-gray-600 to-gray-800" },
      { id: 5, name: "Growth", desc: "Skills, growth, business", color: "from-emerald-500 to-green-500" },
      { id: 6, name: "Philanthropy", desc: "Giving back, community", color: "from-teal-500 to-cyan-600" },
      { id: 7, name: "Offsite", desc: "Joy, creativity, travel", color: "from-yellow-500 to-orange-500" },
      { id: 8, name: "Briefing", desc: "Knowledge, wisdom", color: "from-amber-500 to-yellow-600" },
      { id: 9, name: "Liability", desc: "The unexpected", color: "from-red-500 to-orange-600" },
    ],
    ZEN: [
      { id: 1, name: "Dharma", desc: "Soul, purpose, being", color: "from-rose-500 to-pink-500" },
      { id: 2, name: "Ananda", desc: "Body, mind, heart", color: "from-purple-500 to-indigo-500" },
      { id: 3, name: "Sangha", desc: "Family, friends, love", color: "from-blue-500 to-cyan-500" },
      { id: 4, name: "Karma", desc: "Work, responsibilities", color: "from-gray-600 to-gray-800" },
      { id: 5, name: "Sadhana", desc: "Skills, growth, business", color: "from-emerald-500 to-green-500" },
      { id: 6, name: "Seva", desc: "Giving back, community", color: "from-teal-500 to-cyan-600" },
      { id: 7, name: "Lila", desc: "Joy, creativity, travel", color: "from-yellow-500 to-orange-500" },
      { id: 8, name: "Jnana", desc: "Knowledge, wisdom", color: "from-amber-500 to-yellow-600" },
      { id: 9, name: "Shunya", desc: "The unexpected", color: "from-red-500 to-orange-600" },
    ],
    CURRENT: [
      { id: 1, name: "Core", desc: "Soul, purpose, being", color: "from-rose-500 to-pink-500" },
      { id: 2, name: "Self", desc: "Body, mind, heart", color: "from-purple-500 to-indigo-500" },
      { id: 3, name: "Circle", desc: "Family, friends, love", color: "from-blue-500 to-cyan-500" },
      { id: 4, name: "Grind", desc: "Work, responsibilities", color: "from-gray-600 to-gray-800" },
      { id: 5, name: "Level Up", desc: "Skills, growth, business", color: "from-emerald-500 to-green-500" },
      { id: 6, name: "Impact", desc: "Giving back, community", color: "from-teal-500 to-cyan-600" },
      { id: 7, name: "Play", desc: "Joy, creativity, travel", color: "from-yellow-500 to-orange-500" },
      { id: 8, name: "Insight", desc: "Knowledge, wisdom", color: "from-amber-500 to-yellow-600" },
      { id: 9, name: "Chaos", desc: "The unexpected", color: "from-red-500 to-orange-600" },
    ]
  }[persona] || [
      { id: 1, name: "Core", desc: "Soul, purpose, being", color: "from-rose-500 to-pink-500" },
      { id: 2, name: "Self", desc: "Body, mind, heart", color: "from-purple-500 to-indigo-500" },
      { id: 3, name: "Circle", desc: "Family, friends, love", color: "from-blue-500 to-cyan-500" },
      { id: 4, name: "Grind", desc: "Work, responsibilities", color: "from-gray-600 to-gray-800" },
      { id: 5, name: "Level Up", desc: "Skills, growth, business", color: "from-emerald-500 to-green-500" },
      { id: 6, name: "Impact", desc: "Giving back, community", color: "from-teal-500 to-cyan-600" },
      { id: 7, name: "Play", desc: "Joy, creativity, travel", color: "from-yellow-500 to-orange-500" },
      { id: 8, name: "Insight", desc: "Knowledge, wisdom", color: "from-amber-500 to-yellow-600" },
      { id: 9, name: "Chaos", desc: "The unexpected", color: "from-red-500 to-orange-600" },
    ];

  const UI_LABELS = {
    DEVELOPER: { state: "Status", due: "Deadline", order: "Priority", notes: "Logs", completed: "Diff" },
    EXECUTIVE: { state: "Phase", due: "Target", order: "Priority", notes: "Brief", completed: "Yield" },
    ZEN: { state: "State", due: "Season", order: "Natural Order", notes: "Reflection", completed: "Realized" },
    CURRENT: { state: "State", due: "Due", order: "Order", notes: "Notes", completed: "Completed" }
  }[persona] || {
    state: "State", due: "Due", order: "Order", notes: "Notes", completed: "Completed"
  };
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
  const [editorMode, setEditorMode] = useState<"CAPTURE" | "DETAILS" | "GRAPH">("CAPTURE");

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

  const fetchGoals = async () => {
    setIsLoadingGoals(true);
    try {
      const res = await fetch(`/api/cogos/goals`);
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
    fetchGoals();
  }, []);

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

    let initialDueDate = task.time?.due_date ? normalizeDateTimeValue(task.time.due_date) : "";
    if (!task.id && !initialDueDate) {
      const now = new Date();
      const daysUntilSunday = 7 - now.getDay();
      const sunday = new Date(now);
      sunday.setDate(now.getDate() + daysUntilSunday);
      sunday.setHours(9, 0, 0, 0); // Default to 9 AM
      initialDueDate = formatLocalDateTime(sunday);
    }
    setDueDate(initialDueDate);

    setTimeOfDay(task.time?.time_of_day ?? "ANYTIME");
    setNotes(task.notes ?? "");
    setDurationMin(Number(task.duration_min ?? 15) || 15);

    setLf(task.lf ?? (task.id ? "" : 9));
    setStep(task.step ?? 1);
    setProgress(task.progress ?? 0);

    if (!task.id) {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      const defaultGoal = `Q${quarter} ${now.getFullYear()}`;
      setGoal(task.goal ?? defaultGoal);
      const monthName = now.toLocaleDateString('en-US', { month: 'long' });
      const defaultProject = `${monthName} ${now.getFullYear()}`;
      setProject(task.project ?? defaultProject);
    } else {
      setGoal(task.goal ?? "");
      setProject(task.project ?? "");
    }

    setSuggested([]);
    setSelectedIdx(new Set());
    setPriority(task.priority ?? "medium");
    setEditorMode("CAPTURE");
  }, [task]);

  const [quantumOptions, setQuantumOptions] = useState<Option[]>([]);

  useEffect(() => {
    if (!title.trim()) {
      setQuantumOptions([]);
      return;
    }
    const timer = setTimeout(() => {
      const { optionSet, atom } = generateQuantumState(title, "user-session-temp");
      setQuantumOptions(optionSet.options);

      if (atom.signals?.due_date) {
        const normalized = normalizeDateTimeValue(atom.signals.due_date);
        if (normalized) {
          setDueDate(normalized);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [title]);

  function applyQuantumOption(opt: Option) {
    setDurationMin(opt.duration_min);
  }

  const detectedWorld = useMemo(() => classifyTask(title), [title]);

  async function save() {
    if (!task) return;
    setSaving(true);
    try {
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

      let res;
      if (task.id) {
        res = await fetch("/api/cogos/task/update", {
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
      } else {
        const { atom, optionSet } = generateQuantumState(title, "user-session-id");
        emitIntentCaptured(atom).catch(console.error);
        const bestOption = optionSet.options.find(o => Math.abs(o.duration_min - durationMin) < 5) || optionSet.options[0];
        const finalDuration = durationMin !== 15 ? durationMin : bestOption.duration_min;
        const finalLf = typeof lf === "number" ? lf : (bestOption.task_def.lf_id || 9);
        const { charges } = collapseOption(bestOption);
        emitTaskCommitted("temp-id", bestOption.id, charges).catch(console.error);

        res = await fetch("/api/cogos/task/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: title || "New Task",
            raw_text: title || "New Task",
            status,
            due_date: dueDate,
            time_of_day: timeOfDay,
            notes,
            duration_min: finalDuration,
            lf: finalLf,
            priority,
            step,
            progress,
            goal: goal.trim() || undefined,
            project: project.trim() || undefined,
          }),
        });
      }

      if (res && !res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error || "Failed to save task");
      } else {
        await props.onChanged();
        props.onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  async function suggestBreakdown() {
    setDecomposing(true);
    try {
      const res = await fetch("/api/cogos/task/decompose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, notes, duration_min: durationMin, model: "gpt-4o-mini" }),
      });
      const j = await res.json();
      if (res.ok && j.ok) {
        setSuggested(j.subtasks || []);
        setSelectedIdx(new Set((j.subtasks || []).map((_: any, i: number) => i)));
      }
    } finally {
      setDecomposing(false);
    }
  }

  async function createSelectedSubtasks() {
    if (!task || !suggested.length) return;
    const items = [...selectedIdx.values()].map((i) => ({
      title: suggested[i].title,
      duration_min: suggested[i].duration_min ?? 15,
      notes: suggested[i].rationale ?? "",
    }));
    await fetch("/api/cogos/task/createMany", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ parent_task_id: task.id, due_date: dueDate, time_of_day: timeOfDay, items }),
    });
    await props.onChanged();
    setSuggested([]);
    setSelectedIdx(new Set());
  }

  async function deleteTask() {
    if (!task?.id || !confirm("Are you sure?")) return;
    setDeleting(true);
    try {
      await fetch("/api/cogos/task/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: task.id }),
      });
      await props.onChanged();
      props.onClose();
    } finally {
      setDeleting(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
    else if (e.key === "Enter" && editorMode === "CAPTURE" && title.trim()) save();
    if (e.key === "Escape") props.onClose();
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
          onMouseDown={props.onClose}
        >
          <motion.div
            ref={modalRef}
            className={`w-full bg-[#1c1c1e] text-white shadow-2xl rounded-[2rem] border border-white/10 flex flex-col overflow-hidden transition-all duration-500 ease-in-out ${editorMode === "CAPTURE" ? "max-w-xl h-auto" : "max-w-2xl h-[90vh] md:h-auto md:max-h-[90vh]"}`}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ transformOrigin: getTransformOrigin() }}
            initial={{ scale: 0, opacity: 0, filter: "blur(20px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 0, opacity: 0, filter: "blur(20px)" }}
            onKeyDown={handleKeyDown}
          >
            {/* Header / Capture Input */}
            <div className={`flex flex-col flex-shrink-0 transition-all duration-300 ${editorMode === "CAPTURE" ? "p-8 space-y-6" : "p-6 bg-white/3 border-b border-white/10"}`}>
              <div className="flex items-center gap-4">
                <input
                  autoFocus
                  className="flex-1 bg-transparent text-2xl lg:text-3xl font-medium outline-none placeholder:text-white/10"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Intent..."
                />
                {editorMode === "CAPTURE" && title.trim() && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={save}
                    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all flex-shrink-0"
                  >
                    <Check size={20} strokeWidth={3} />
                  </motion.button>
                )}
              </div>

              <div className={`flex items-center justify-between ${editorMode === "CAPTURE" ? "mt-6" : "mt-4"}`}>
                <div className="flex bg-white/10 rounded-full p-1 border border-white/5 backdrop-blur-md relative">
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute bg-white rounded-full shadow-lg"
                    initial={false}
                    animate={{
                      left: editorMode === "CAPTURE" ? 4 : editorMode === "DETAILS" ? 44 : 84,
                      width: 36, height: 28, top: 4
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                  <button type="button" onClick={() => setEditorMode("CAPTURE")} className={`z-10 w-9 h-7 flex items-center justify-center text-lg font-black transition-colors ${editorMode === "CAPTURE" ? "text-black" : "text-white/40"}`}>-</button>
                  <button type="button" onClick={() => setEditorMode("DETAILS")} className={`z-10 w-9 h-7 flex items-center justify-center text-lg font-black transition-colors ${editorMode === "DETAILS" ? "text-black" : "text-white/40"}`}>=</button>
                  <button type="button" onClick={() => setEditorMode("GRAPH")} className={`z-10 w-9 h-7 flex items-center justify-center transition-colors ${editorMode === "GRAPH" ? "text-black" : "text-white/40"}`}><Workflow size={14} /></button>
                </div>

                {editorMode === "CAPTURE" && quantumOptions.length > 0 && (
                  <div className="flex gap-2">
                    {quantumOptions.map(opt => (
                      <button key={opt.id} onClick={() => applyQuantumOption(opt)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${durationMin === opt.duration_min ? "bg-white text-black border-white" : "bg-white/5 text-white/40 border-white/10"}`}>{opt.duration_min}m</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            {editorMode !== "CAPTURE" && (
              <div className="flex-1 overflow-y-auto min-h-0 bg-black/20 p-6 lg:p-8 space-y-8">
                <AnimatePresence mode="wait">
                  {editorMode === "GRAPH" ? (
                    <motion.div key="graph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <TaskGraph
                        title={title}
                        lf={lf}
                        goal={goal}
                        project={project}
                        allTasks={props.allTasks}
                        currentTaskId={task?.id}
                        personaWorlds={PERSONA_WORLDS}
                      />
                    </motion.div>
                  ) : (
                    <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-8">
                      {/* Wheel Pickers for Goal and Project */}
                      <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-2">
                          <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] px-1 flex justify-between">
                            <span>Goal</span>
                            <button onClick={() => setShowGoalInput(!showGoalInput)} className="text-[8px] opacity-40 hover:opacity-100">{showGoalInput ? "Picker" : "Custom"}</button>
                          </label>
                          {showGoalInput ? (
                            <input className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm font-bold outline-none" value={goal} onChange={(e) => setGoal(e.target.value)} />
                          ) : (
                            <WheelPicker items={availableGoals.map(g => g.title)} value={goal} onChange={(v) => setGoal(v as string)} />
                          )}
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] px-1 flex justify-between">
                            <span>Project</span>
                            <button onClick={() => setShowProjectInput(!showProjectInput)} className="text-[8px] opacity-40 hover:opacity-100">{showProjectInput ? "Picker" : "Custom"}</button>
                          </label>
                          {showProjectInput ? (
                            <input className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm font-bold outline-none" value={project} onChange={(e) => setProject(e.target.value)} />
                          ) : (
                            <WheelPicker items={availableProjects.map(p => p.title)} value={project} onChange={(v) => setProject(v as string)} />
                          )}
                        </div>
                      </div>

                      {/* Date Time Wheel Picker */}
                      <DateTimeWheelPicker value={dueDate} onChange={setDueDate} />

                      {/* Status and World */}
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">{UI_LABELS.state}</label>
                          <div className="flex flex-wrap gap-2">
                            {["intake", "doing", "done"].map((option) => (
                              <button key={option} onClick={() => setStatus(option)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${status === option ? "bg-white text-black border-white" : "bg-white/5 text-white/40 border-white/5"}`}>{option.toUpperCase()}</button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">{UI_LABELS.order}</label>
                          <div className="flex gap-2">
                            {["low", "high"].map((p) => (
                              <button key={p} onClick={() => setPriority(p as any)} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${priority === p ? 'bg-red-500/20 border-red-500/40 text-red-200' : 'bg-white/5 border-white/5 text-white/40'}`}>{p.toUpperCase()}</button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* World & Step Selection (Restored) */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Focus World</label>
                          <WheelPicker
                            items={PERSONA_WORLDS.map(w => w.name)}
                            value={PERSONA_WORLDS.find(w => w.id === lf)?.name || ""}
                            onChange={(v) => {
                              const w = PERSONA_WORLDS.find(world => world.name === v);
                              if (w) setLf(w.id);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Current Step</label>
                          <WheelPicker
                            items={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                            value={step}
                            onChange={(v) => setStep(v as number)}
                          />
                        </div>
                      </div>

                      {/* Notes & Progress */}
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Notes</label>
                          <textarea className="w-full rounded-2xl bg-white/3 border border-white/5 px-4 py-4 text-sm text-white/70 outline-none focus:border-white/20 transition" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Strategy notes..." />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Progress: {progress}%</label>
                          <input type="range" min="0" max="100" step="5" value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-white" />
                        </div>
                      </div>

                      {/* Al Breakdown */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Task Breakdown</label>
                          <button onClick={suggestBreakdown} disabled={decomposing} className="text-[10px] font-black bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-white/60 transition-colors uppercase tracking-widest">{decomposing ? "DECOMPOSING..." : "SUGGEST STEPS"}</button>
                        </div>
                        {suggested.length > 0 && (
                          <div className="grid gap-2">
                            {suggested.map((s, i) => (
                              <div key={i} onClick={() => {
                                const n = new Set(selectedIdx);
                                if (n.has(i)) n.delete(i); else n.add(i);
                                setSelectedIdx(n);
                              }} className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedIdx.has(i) ? 'bg-white/10 border-white/20' : 'bg-white/3 border-white/5 opacity-50'}`}>
                                <div className="text-sm font-bold">{s.title}</div>
                                <div className="text-[10px] opacity-40 mt-1">{s.rationale}</div>
                              </div>
                            ))}
                            <button onClick={createSelectedSubtasks} className="w-full py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl mt-2 active:scale-95 transition-transform">Commit {selectedIdx.size} Subtasks</button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Footer Actions */}
            {editorMode !== "CAPTURE" && (
              <div className="p-6 bg-white/3 border-t border-white/10 flex items-center justify-between flex-shrink-0">
                {task.id && <button onClick={deleteTask} className="text-[10px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-colors">DELETE</button>}
                <div className="flex gap-4 items-center">
                  <button onClick={props.onClose} className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors">CANCEL</button>
                  <button onClick={save} disabled={saving} className="bg-white text-black px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">
                    {saving ? "SAVING..." : task.id ? "SAVE CHANGES" : "CREATE TASK"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TaskGraph({ title, lf, goal, project, allTasks, currentTaskId, personaWorlds }: any) {
  const world = personaWorlds.find((w: any) => w.id === lf);

  return (
    <div className="h-[450px] w-full flex flex-col items-center justify-between p-12 bg-black/10 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
      {/* Background Flow Line */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <path d="M 50% 10% L 50% 90%" stroke="white" strokeWidth="2" fill="none" strokeDasharray="8 4" />
        </svg>
      </div>

      {/* Layer 1: Life Focus (The Source) */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`z-10 px-6 py-3 rounded-full bg-gradient-to-br ${world?.color || 'from-gray-500 to-gray-700'} border border-white/20 shadow-2xl flex flex-col items-center`}
      >
        <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/60 mb-1">Focus World</span>
        <span className="text-xs font-black text-white uppercase">{world?.name || "The Void"}</span>
      </motion.div>

      {/* Connection arrow */}
      <div className="h-4 flex items-center justify-center -my-2 z-0">
        <div className="w-0.5 h-full bg-white/10" />
      </div>

      {/* Layer 2: Goal (The Objective) */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="z-10 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 shadow-xl flex flex-col items-center min-w-[160px]"
      >
        <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Active Goal</span>
        <span className="text-[11px] font-black uppercase tracking-tight text-white/80 text-center">{goal || "Unguided"}</span>
      </motion.div>

      {/* Connection arrow */}
      <div className="h-4 flex items-center justify-center -my-2 z-0">
        <div className="w-0.5 h-full bg-white/10" />
      </div>

      {/* Layer 3: Project (The Container) */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="z-10 px-8 py-4 rounded-2xl bg-white/10 border border-white/20 shadow-lg flex flex-col items-center min-w-[180px]"
      >
        <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Current Project</span>
        <span className="text-[11px] font-black uppercase tracking-tight text-white/90 text-center">{project || "Standalone"}</span>
      </motion.div>

      {/* Connection arrow */}
      <div className="h-4 flex items-center justify-center -my-2 z-0">
        <div className="w-0.5 h-full bg-white/10" />
      </div>

      {/* Layer 4: Task (The Action) - Root Node */}
      <motion.div
        layoutId="center-node"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        className="z-20 w-36 h-36 rounded-full bg-white text-black flex flex-col items-center justify-center text-center p-6 shadow-[0_0_60px_rgba(255,255,255,0.4)]"
      >
        <span className="text-[7px] font-black uppercase tracking-[0.3em] text-black/40 mb-2">Primary Intent</span>
        <span className="text-xs font-black uppercase tracking-tighter leading-tight">{title || "Untitled Intent"}</span>
      </motion.div>
    </div>
  );
}
