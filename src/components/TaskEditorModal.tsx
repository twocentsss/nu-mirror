"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, useRef } from "react";
import { useUIStore } from "@/lib/store/ui-store";
import { usePersona } from "@/hooks/usePersona";
import { generateQuantumState } from "@/lib/quantum/generator";
import { collapseOption } from "@/lib/quantum/collapser";
import { emitIntentCaptured, emitTaskCommitted } from "@/lib/events/emitters";
import { Option } from "@/lib/quantum/types";
import { Check, Plus, Share2, Workflow, Sparkles, Settings } from "lucide-react";
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
  is_routine?: boolean;
  recurrence?: {
    freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    interval?: number;
    byDay?: ("MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU")[];
    byMonthDay?: number[]; // 1-31, -1 for last day
    bySetPos?: number[];
    count?: number;
    until?: string;
    weekStart?: "MO" | "SU";
  };
  completion_policy?: "floating" | "fixed" | "skip";
};

type SuggestedSubtask = {
  title: string;
  duration_min?: number;
  rationale?: string;
};

type GrammarSlot = {
  type: "actor" | "action" | "object" | "time" | "modality" | "location" | "metric" | "quality";
  value: string;
  confidence: number;
  alternatives: string[];
};

type ParseResult = {
  slots: GrammarSlot[];
  intentType: "create" | "complete" | "schedule" | "delegate" | "learn" | "review";
  complexity: "atomic" | "simple" | "compound" | "complex";
  estimatedSteps: number;
  dependencies: string[];
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

function enhancedGrammarParse(text: string, context?: { lf?: number; goal?: string; project?: string }): ParseResult {
  const tokens = text ? text.split(/\s+/) : [];
  const slots: GrammarSlot[] = [];

  const patterns = {
    actor: /\b(i|we|team|client|user|stakeholder|everyone|anyone|someone|myself)\b/i,
    action: {
      create: /\b(create|make|build|design|write|draft|produce|generate)\b/i,
      complete: /\b(finish|complete|finalize|ship|deliver|submit|close|wrap up|wrap-up|wrapup)\b/i,
      review: /\b(review|check|verify|audit|inspect|test|debug|validate)\b/i,
      learn: /\b(learn|study|understand|research|explore|practice|master)\b/i,
      schedule: /\b(schedule|plan|organize|arrange|prepare|setup|book)\b/i,
      delegate: /\b(delegate|assign|ask|request|outsource|hire|contract)\b/i,
    },
    time: {
      absolute: /\b(\d{1,2}(:\d{2})?\s*(am|pm)|today|tomorrow|tonight|morning|evening|weekend)\b/i,
      relative: /\b(in\s+\d+\s+(min|hour|day|week)|by\s+(next|this)\s+\w+|before\s+\w+|after\s+\w+)\b/i,
      recurring: /\b(every\s+\w+|daily|weekly|monthly|quarterly)\b/i,
    },
    object: /\b(report|spec|doc|feature|flow|design|deck|plan|system|app|api|code|test|meeting|call|budget|routine)\b/i,
    metric: /\b(\d+\s*(min|hour|day|page|word|item|point)|percent|percentage|score|rating)\b/i,
    quality: /\b(excellent|good|better|best|quick|fast|thorough|complete|detailed|professional|clean)\b/i,
    modality: /\b(must|should|could|would|need|have to|ought to|required|optional|can|will)\b/i,
    location: /\b(room|office|zoom|doc|repo|jira|figma|home|gym|store|client|site)\b/i,
  };

  const actorMatch = text.match(patterns.actor);
  if (actorMatch) slots.push({ type: "actor", value: actorMatch[0], confidence: 0.9, alternatives: ["team", "client", "user"] });

  let intentType: ParseResult["intentType"] = "create";
  for (const [intent, pattern] of Object.entries(patterns.action)) {
    const match = text.match(pattern);
    if (match) {
      const alt = Object.keys(patterns.action)
        .filter((k) => k !== intent)
        .map((k) => k);
      slots.push({ type: "action", value: match[0], confidence: 0.85, alternatives: alt });
      intentType = intent as ParseResult["intentType"];
      break;
    }
  }

  for (const pattern of Object.values(patterns.time)) {
    const match = text.match(pattern);
    if (match) slots.push({ type: "time", value: match[0], confidence: 0.8, alternatives: ["today", "tomorrow", "this week"] });
  }

  const objectMatch = text.match(patterns.object);
  if (objectMatch) slots.push({ type: "object", value: objectMatch[0], confidence: 0.75, alternatives: ["spec", "deck", "flow", "routine"] });

  const metricMatch = text.match(patterns.metric);
  if (metricMatch) slots.push({ type: "metric", value: metricMatch[0], confidence: 0.6, alternatives: ["30m", "2h", "3 pages"] });

  const qualityMatch = text.match(patterns.quality);
  if (qualityMatch) slots.push({ type: "quality", value: qualityMatch[0], confidence: 0.6, alternatives: ["quick", "thorough", "clean"] });

  const modalityMatch = text.match(patterns.modality);
  if (modalityMatch) slots.push({ type: "modality", value: modalityMatch[0], confidence: 0.65, alternatives: ["should", "must", "can"] });

  const locationMatch = text.match(patterns.location);
  if (locationMatch) slots.push({ type: "location", value: locationMatch[0], confidence: 0.6, alternatives: ["zoom", "office", "repo"] });

  const wordCount = tokens.length;
  const hasMultipleVerbs = (text.match(/\b(\w+ed|ing)\b/g) || []).length > 1;
  const hasConjunctions = /\b(and|or|but|then|after|before)\b/i.test(text);
  let complexity: ParseResult["complexity"] = "simple";
  if (wordCount > 15 && hasMultipleVerbs && hasConjunctions) complexity = "complex";
  else if (wordCount > 8 || hasConjunctions) complexity = "compound";
  else if (wordCount < 4) complexity = "atomic";

  const stepEstimates = { atomic: 1, simple: 2, compound: 3, complex: 5 } as const;
  let stepAdjustment = 0;
  if (context?.lf === 4) stepAdjustment += 1;
  if (context?.lf === 5) stepAdjustment += 2;
  const estimatedSteps = Math.max(1, stepEstimates[complexity] + stepAdjustment);

  return {
    slots,
    intentType,
    complexity,
    estimatedSteps,
    dependencies: context?.project ? [context.project] : [],
  };
}

function generateSmartSubtasks(
  title: string,
  parseResult: ParseResult,
  context: { lf?: number; goal?: string; project?: string; durationMin?: number; persona?: string }
): SuggestedSubtask[] {
  const { slots, intentType, estimatedSteps } = parseResult;
  const action = slots.find((s) => s.type === "action")?.value || "do";
  const object = slots.find((s) => s.type === "object")?.value || title || "task";
  const time = slots.find((s) => s.type === "time")?.value || "today";

  const templates: Record<ParseResult["intentType"], string[]> = {
    create: [
      `Research ${object}`,
      `Draft ${object}`,
      `Review and refine ${object}`,
      `Finalize ${object}`,
    ],
    complete: [
      `Check remaining work on ${object}`,
      `Finish ${object}`,
      `Verify ${object} is done`,
      `Share ${object}`,
    ],
    review: [
      `Set criteria to review ${object}`,
      `Inspect ${object}`,
      `Document findings on ${object}`,
      `Share feedback for ${object}`,
    ],
    learn: [
      `Define learning outcome for ${object}`,
      `Collect resources about ${object}`,
      `Practice ${object}`,
      `Summarize lessons from ${object}`,
    ],
    schedule: [
      `Define scope for ${object}`,
      `Block time for ${object}`,
      `Invite stakeholders for ${object}`,
      `Confirm schedule for ${object}`,
    ],
    delegate: [
      `Pick owner for ${object}`,
      `Write brief for ${object}`,
      `Hand off ${object}`,
      `Follow up on ${object}`,
    ],
  };

  const subtasks: SuggestedSubtask[] = [];
  const templateList = templates[intentType] || templates.create;
  templateList.forEach((t, idx) => {
    subtasks.push({
      title: t.replace("${object}", object).replace("<object>", object),
      duration_min: Math.max(10, Math.round((context.durationMin || 60) / Math.max(1, estimatedSteps))),
      rationale: `Step ${idx + 1} of ${estimatedSteps} (${intentType})`,
    });
  });

  if (context.persona === "DEVELOPER") {
    subtasks.push({ title: `Write tests for ${object}`, duration_min: 25, rationale: "Quality gate" });
  } else if (context.persona === "EXECUTIVE") {
    subtasks.push({ title: `Align ${object} with strategy`, duration_min: 20, rationale: "Strategic check" });
  }

  if (context.lf === 2) {
    subtasks.unshift({ title: "Prepare mentally/physically", duration_min: 10, rationale: "Self priming" });
  }
  if (context.lf === 3) {
    subtasks.push({ title: `Communicate ${object} to circle`, duration_min: 10, rationale: "Social alignment" });
  }

  return subtasks.slice(0, Math.max(estimatedSteps, 3));
}

function getOpenRouterPrompt(
  mode: "decompose" | "optimize" | "expand" | "clarify",
  parseResult: ParseResult,
  base: { title: string; notes: string; lf?: number; goal?: string; project?: string; durationMin: number; persona?: string }
): string {
  const missingSlots = ["actor", "action", "object", "time", "modality", "location", "metric", "quality"].filter(
    (slot) => !parseResult.slots.find((s) => s.type === slot)
  );

  const ctx = `Task: "${base.title}"\nNotes: "${base.notes || "None"}"\nWorld: ${base.lf || "NA"} Goal: ${base.goal || "None"} Project: ${base.project || "Standalone"}\nTime: ${base.durationMin} minutes\nMissing: ${missingSlots.join(", ") || "None"}\nPersona: ${base.persona || "General"}`;

  const prompts = {
    decompose: `Decompose into 3-6 actionable subtasks with minutes and rationale.\n${ctx}\nReturn JSON: { "subtasks": [{ "title": "", "duration_min": number, "rationale": "" }] }`,
    optimize: `Suggest optimizations (time, quality, risk) for this plan.\n${ctx}\nReturn JSON: { "optimizations": [{ "suggestion": "", "impact": "high|medium|low", "effort": "minutes" }] }`,
    expand: `Expand with strategic angles (stakeholders, learning, long-term impact).\n${ctx}\nReturn JSON: { "expansions": [{ "aspect": "", "consideration": "", "action_item": "" }] }`,
    clarify: `Ask clarifying questions about success criteria, constraints, resources, and stakeholders.\n${ctx}\nReturn JSON: { "questions": ["..."], "assumptions": ["..."] }`,
  };
  return prompts[mode];
}

function estimateComplexityScore(text: string): number {
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length;
  const uniqueWords = new Set(text.toLowerCase().split(/\s+/)).size;
  const hasNumbers = /\d/.test(text);
  const hasSpecialChars = /[@#$%^&*()_+=\[\]{}|;:,.<>?]/.test(text);

  let score = 0;
  if (words > 20) score += 2;
  if (sentences > 3) score += 1;
  if (uniqueWords / Math.max(1, words) > 0.7) score += 1;
  if (hasNumbers) score += 1;
  if (hasSpecialChars) score += 1;
  return Math.min(5, score);
}

function generateSmartTemplate(slots: GrammarSlot[], context: { goal?: string; project?: string; lfLabel?: string }) {
  const action = slots.find((s) => s.type === "action")?.value || "complete";
  const object = slots.find((s) => s.type === "object")?.value || "task";
  const time = slots.find((s) => s.type === "time")?.value || "by EOD";
  const actor = slots.find((s) => s.type === "actor")?.value || "I";
  const quality = slots.find((s) => s.type === "quality")?.value || "";
  const metric = slots.find((s) => s.type === "metric")?.value || "";
  const anchor = context.goal || context.project || context.lfLabel || "Focus";

  return `${actor} will ${action} ${object} ${time} ${quality ? `to ${quality}` : ""} ${metric ? `(${metric})` : ""} [${anchor}]`.replace(/\s+/g, " ").trim();
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
  const [editorMode, setEditorMode] = useState<"CAPTURE" | "DETAILS" | "GRAPH" | "OPENROUTER" | "RULES">("CAPTURE");

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
  const [recurrence, setRecurrence] = useState<any>(null);
  const [isRoutine, setIsRoutine] = useState(false);
  const [completionPolicy, setCompletionPolicy] = useState<"floating" | "fixed" | "skip">("floating");

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
  const [aiEngine, setAiEngine] = useState<"gemini" | "openrouter">("gemini");
  const [ruleSubtasks, setRuleSubtasks] = useState<SuggestedSubtask[]>([]);
  const [aiMode, setAiMode] = useState<"decompose" | "optimize" | "expand" | "clarify">("decompose");

  const worldLookup = useMemo(() => PERSONA_WORLDS.find(w => w.id === lf), [PERSONA_WORLDS, lf]);

  const parseResult = useMemo(
    () =>
      enhancedGrammarParse(`${title || ""} ${notes || ""}`.trim(), {
        lf: typeof lf === "number" ? lf : undefined,
        goal,
        project,
      }),
    [title, notes, lf, goal, project]
  );

  const grammarHints = useMemo(() => {
    const missingSlots = ["Actor", "Action", "Object", "Time", "Modality", "Location"].filter(
      (slot) => !parseResult.slots.find((s) => s.type.toUpperCase() === slot.toUpperCase())
    );

    const template = generateSmartTemplate(parseResult.slots, {
      goal,
      project,
      lfLabel: worldLookup?.name,
    });

    const suggestions: string[] = [];
    if (missingSlots.includes("Action")) suggestions.push("Add a verb: ship / design / complete / learn.");
    if (missingSlots.includes("Object")) suggestions.push("Add an object: spec / deck / flow / routine.");
    if (missingSlots.includes("Time")) suggestions.push("Add timing: today 4pm / tomorrow AM / before demo.");
    if (missingSlots.includes("Actor")) suggestions.push("Add actor: I / team / client.");

    return { missing: missingSlots, suggestions, template, complexityScore: estimateComplexityScore(title || "") };
  }, [parseResult, goal, project, worldLookup, title]);

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
    setRecurrence(task.recurrence ?? null);
    setIsRoutine(task.is_routine ?? false);
    setCompletionPolicy(task.completion_policy ?? "floating");
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
            recurrence: recurrence,
            is_routine: isRoutine,
            completion_policy: completionPolicy,
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
            recurrence: recurrence,
            is_routine: isRoutine,
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

  async function enhancedSuggestBreakdown() {
    setDecomposing(true);
    try {
      const parseCtxLf = typeof lf === "number" ? lf : undefined;
      const parseResultForCall = enhancedGrammarParse(title || "", { lf: parseCtxLf, goal, project });
      const smartSubtasks = generateSmartSubtasks(title || "Task", parseResultForCall, {
        lf: parseCtxLf,
        goal,
        project,
        durationMin,
        persona,
      });

      let merged: SuggestedSubtask[] = [...smartSubtasks];

      const prompt = getOpenRouterPrompt(aiMode, parseResultForCall, {
        title: title || "Task",
        notes: notes || "",
        lf: parseCtxLf,
        goal,
        project,
        durationMin,
        persona,
      });

      const res = await fetch("/api/cogos/task/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: aiEngine === "gemini" ? "gemini-1.5-pro" : "gpt-4o-mini",
          context: { title, notes, lf: parseCtxLf, goal, project, durationMin },
        }),
      });
      const j = await res.json().catch(() => ({}));

      if (res.ok && j) {
        if (aiMode === "decompose" && Array.isArray(j.subtasks)) {
          const combined = [...smartSubtasks, ...j.subtasks];
          const seen = new Set<string>();
          merged = combined.filter((s) => {
            const key = (s.title || "").toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }).slice(0, 8);
        } else if (aiMode === "optimize" && Array.isArray(j.optimizations)) {
          merged = j.optimizations.map((opt: any) => ({
            title: opt.suggestion || "Optimization",
            duration_min: parseInt(opt.effort, 10) || 15,
            rationale: `Impact: ${opt.impact || "?"}`,
          }));
        } else if (aiMode === "expand" && Array.isArray(j.expansions)) {
          merged = j.expansions.map((e: any) => ({
            title: e.action_item || e.aspect || "Expansion",
            duration_min: 15,
            rationale: e.consideration || "",
          }));
        } else if (aiMode === "clarify" && Array.isArray(j.questions)) {
          merged = j.questions.map((q: string, idx: number) => ({
            title: `Clarify: ${q}`,
            duration_min: 10,
            rationale: (j.assumptions && j.assumptions[idx]) || "Answer then proceed",
          }));
        }
      }

      setSuggested(merged);
      setSelectedIdx(new Set(merged.map((_, i) => i)));
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

  function generateRuleSubtasks() {
    const parseCtxLf = typeof lf === "number" ? lf : undefined;
    const ruleSuggestions = generateSmartSubtasks(title || "Task", parseResult, {
      lf: parseCtxLf,
      goal,
      project,
      durationMin,
      persona,
    });
    setRuleSubtasks(ruleSuggestions);
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
                      left: ["CAPTURE", "DETAILS", "GRAPH", "OPENROUTER", "RULES"].indexOf(editorMode) * 40 + 4,
                      width: 36, height: 28, top: 4
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                  <button type="button" onClick={() => setEditorMode("CAPTURE")} className={`z-10 w-10 h-8 flex items-center justify-center text-lg font-black transition-colors ${editorMode === "CAPTURE" ? "text-black" : "text-white/40"}`}>-</button>
                  <button type="button" onClick={() => setEditorMode("DETAILS")} className={`z-10 w-10 h-8 flex items-center justify-center text-lg font-black transition-colors ${editorMode === "DETAILS" ? "text-black" : "text-white/40"}`}>=</button>
                  <button type="button" onClick={() => setEditorMode("GRAPH")} className={`z-10 w-10 h-8 flex items-center justify-center transition-colors ${editorMode === "GRAPH" ? "text-black" : "text-white/40"}`}><Workflow size={14} /></button>
                  <button type="button" onClick={() => { setAiEngine("openrouter"); setEditorMode("OPENROUTER"); }} className={`z-10 w-10 h-8 flex items-center justify-center transition-colors ${editorMode === "OPENROUTER" ? "text-black" : "text-white/40"}`}><Sparkles size={14} /></button>
                  <button type="button" onClick={() => setEditorMode("RULES")} className={`z-10 w-10 h-8 flex items-center justify-center transition-colors ${editorMode === "RULES" ? "text-black" : "text-white/40"}`}><Settings size={14} /></button>
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
                  {editorMode === "GRAPH" && (
                    <GraphPanel
                      title={title}
                      lf={lf}
                      goal={goal}
                      project={project}
                      allTasks={props.allTasks}
                      currentTaskId={task?.id}
                      personaWorlds={PERSONA_WORLDS}
                    />
                  )}

                  {editorMode === "DETAILS" && (
                    <DetailsPanel
                      goal={goal}
                      setGoal={setGoal}
                      project={project}
                      setProject={setProject}
                      showGoalInput={showGoalInput}
                      setShowGoalInput={setShowGoalInput}
                      showProjectInput={showProjectInput}
                      setShowProjectInput={setShowProjectInput}
                      availableGoals={availableGoals}
                      availableProjects={availableProjects}
                      isLoadingGoals={isLoadingGoals}
                      isLoadingProjects={isLoadingProjects}
                      dueDate={dueDate}
                      setDueDate={setDueDate}
                      UI_LABELS={UI_LABELS}
                      status={status}
                      setStatus={setStatus}
                      priority={priority}
                      setPriority={setPriority}
                      lf={lf}
                      setLf={setLf}
                      step={step}
                      setStep={setStep}
                      notes={notes}
                      setNotes={setNotes}
                      progress={progress}
                      setProgress={setProgress}
                      personaWorlds={PERSONA_WORLDS}
                      recurrence={recurrence}
                      setRecurrence={setRecurrence}
                      setIsRoutine={setIsRoutine}
                      completionPolicy={completionPolicy}
                      setCompletionPolicy={setCompletionPolicy}
                    />
                  )}

                  {editorMode === "OPENROUTER" && (
                    <OpenRouterPanel
                      aiEngine={aiEngine}
                      setAiEngine={setAiEngine}
                      parseResult={parseResult}
                      grammarHints={grammarHints}
                      aiMode={aiMode}
                      setAiMode={setAiMode}
                      enhancedSuggestBreakdown={enhancedSuggestBreakdown}
                      decomposing={decomposing}
                      suggested={suggested}
                      selectedIdx={selectedIdx}
                      setSelectedIdx={setSelectedIdx}
                      createSelectedSubtasks={createSelectedSubtasks}
                    />
                  )}

                  {editorMode === "RULES" && (
                    <RulesPanel
                      worldLookup={worldLookup}
                      goal={goal}
                      project={project}
                      grammarHints={grammarHints}
                      parseResult={parseResult}
                      generateRuleSubtasks={generateRuleSubtasks}
                      ruleSubtasks={ruleSubtasks}
                      setTitle={setTitle}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}            {/* Footer Actions */}
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

function GraphPanel({ title, lf, goal, project, allTasks, currentTaskId, personaWorlds }: any) {
  return (
    <motion.div key="graph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <TaskGraph
        title={title}
        lf={lf}
        goal={goal}
        project={project}
        allTasks={allTasks}
        currentTaskId={currentTaskId}
        personaWorlds={personaWorlds}
      />
    </motion.div>
  );
}

function DetailsPanel({
  goal,
  setGoal,
  project,
  setProject,
  showGoalInput,
  setShowGoalInput,
  showProjectInput,
  setShowProjectInput,
  availableGoals,
  availableProjects,
  isLoadingGoals,
  isLoadingProjects,
  dueDate,
  setDueDate,
  UI_LABELS,
  status,
  setStatus,
  priority,
  setPriority,
  lf,
  setLf,
  step,
  setStep,
  notes,
  setNotes,
  progress,
  setProgress,
  personaWorlds,
  recurrence,
  setRecurrence,
  setIsRoutine,
  completionPolicy,
  setCompletionPolicy,
}: any) {
  return (
    <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-8">
      <div className="flex gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] px-1 flex justify-between">
            <span>Goal</span>
            {isLoadingGoals ? <span className="text-white/40">Loading...</span> : <button onClick={() => setShowGoalInput(!showGoalInput)} className="text-white/30">+ Custom</button>}
          </label>
          {showGoalInput ? (
            <input className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/80 outline-none focus:border-white/20 transition" placeholder="New goal title" value={goal} onChange={(e: any) => setGoal(e.target.value)} />
          ) : (
            <WheelPicker items={availableGoals.map((g: any) => g.title)} value={goal} onChange={(v) => setGoal(v as string)} />
          )}
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] px-1 flex justify-between">
            <span>Project</span>
            {isLoadingProjects ? <span className="text-white/40">Loading...</span> : <button onClick={() => setShowProjectInput(!showProjectInput)} className="text-white/30">+ Custom</button>}
          </label>
          {showProjectInput ? (
            <input className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/80 outline-none focus:border-white/20 transition" placeholder="New project title" value={project} onChange={(e: any) => setProject(e.target.value)} />
          ) : isLoadingProjects ? (
            <div className="text-white/40 text-sm">Loading...</div>
          ) : (
            <WheelPicker items={availableProjects.map((p: any) => p.title)} value={project} onChange={(v) => setProject(v as string)} />
          )}
        </div>
      </div>

      <DateTimeWheelPicker value={dueDate} onChange={setDueDate} />

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

      <div className="space-y-4">
        <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Recurrence</label>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "NONE", value: "none" },
            { label: "DAILY", value: "DAILY" },
            { label: "WEEKLY", value: "WEEKLY" },
            { label: "MONTHLY", value: "MONTHLY" },
            { label: "CUSTOM", value: "CUSTOM" }
          ].map((opt) => {
            const isActive = opt.value === "none" ? !recurrence : (opt.value === "CUSTOM" && recurrence?.interval && recurrence.interval > 1) || recurrence?.freq === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  if (opt.value === "none") { setRecurrence(null); setIsRoutine(false); }
                  else if (opt.value === "CUSTOM") {
                    // Expand custom Logic - for now, default to Weekly if not set, or stay as is
                    if (!recurrence) { setRecurrence({ freq: 'WEEKLY', interval: 1 }); setIsRoutine(true); }
                  }
                  else {
                    setRecurrence({ freq: opt.value as any, interval: 1 });
                    setIsRoutine(true);
                  }
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${isActive ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/40'}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {/* Custom Recurrence Editor */}
        {recurrence && (
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-white/40">Repeat every</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={recurrence.interval || 1}
                  onChange={(e) => setRecurrence({ ...recurrence, interval: parseInt(e.target.value) || 1 })}
                  className="w-12 bg-transparent border-b border-white/20 text-center text-sm font-bold outline-none focus:border-white"
                />
                <span className="text-xs text-white/60">
                  {recurrence.freq === 'DAILY' ? 'days' :
                    recurrence.freq === 'WEEKLY' ? 'weeks' :
                      recurrence.freq === 'MONTHLY' ? 'months' : 'years'}
                </span>
              </div>
            </div>

            {recurrence.freq === 'WEEKLY' && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-white/40">On days</span>
                <div className="flex justify-between gap-1">
                  {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map(day => {
                    const isSelected = recurrence.byDay?.includes(day as any);
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          const current = recurrence.byDay || [];
                          const next = isSelected ? current.filter((d: any) => d !== day) : [...current, day];
                          setRecurrence({ ...recurrence, byDay: next.length ? next : undefined });
                        }}
                        className={`w-8 h-8 rounded-full text-[10px] font-bold border transition ${isSelected ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/30'}`}
                      >
                        {day.charAt(0)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {recurrence.freq === 'MONTHLY' && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-white/40">Monthly on</span>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setRecurrence({ ...recurrence, byMonthDay: [new Date().getDate()], byDay: undefined, bySetPos: undefined })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border text-left transition ${recurrence.byMonthDay ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/40'}`}
                  >
                    Monthly on the {new Date().getDate()}th
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const dayName = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][today.getDay()];
                      const pos = Math.ceil(today.getDate() / 7);
                      setRecurrence({ ...recurrence, byMonthDay: undefined, byDay: [dayName as any], bySetPos: [pos] });
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border text-left transition ${recurrence.bySetPos ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/40'}`}
                  >
                    Monthly on the {Math.ceil(new Date().getDate() / 7)}{['st', 'nd', 'rd', 'th'][Math.min(3, Math.ceil(new Date().getDate() / 7) - 1)]} {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]}
                  </button>
                </div>
              </div>
            )}

            {/* Completion Policy */}
            <div className="pt-2 border-t border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-2">Completion Logic</span>
              <div className="flex gap-2">
                {['floating', 'fixed'].map(policy => (
                  <button
                    key={policy}
                    onClick={() => setCompletionPolicy(policy as any)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition ${completionPolicy === policy ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/30'}`}
                  >
                    {policy === 'floating' ? 'Floating' : 'Fixed'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Focus World</label>
          <WheelPicker
            items={personaWorlds.map((w: any) => w.name)}
            value={personaWorlds.find((w: any) => w.id === lf)?.name || ""}
            onChange={(v) => {
              const w = personaWorlds.find((world: any) => world.name === v);
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

      <div className="space-y-6">
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Notes</label>
          <textarea className="w-full rounded-2xl bg-white/3 border border-white/5 px-4 py-4 text-sm text-white/70 outline-none focus:border-white/20 transition" rows={4} value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Strategy notes..." />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Progress: {progress}%</label>
          <input type="range" min="0" max="100" step="5" value={progress} onChange={(e: any) => setProgress(Number(e.target.value))} className="w-full accent-white" />
        </div>
      </div>
    </motion.div >
  );
}

function OpenRouterPanel({
  aiEngine,
  setAiEngine,
  parseResult,
  grammarHints,
  aiMode,
  setAiMode,
  enhancedSuggestBreakdown,
  decomposing,
  suggested,
  selectedIdx,
  setSelectedIdx,
  createSelectedSubtasks,
}: any) {
  return (
    <motion.div key="openrouter" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/50">Enhanced Assistant</p>
          <p className="text-[11px] text-white/50">Smart parsing + OpenRouter/Gemini with POS anchors.</p>
        </div>
        <div className="flex gap-2">
          {["gemini", "openrouter"].map((engine) => (
            <button
              key={engine}
              onClick={() => setAiEngine(engine as "gemini" | "openrouter")}
              className={`text-[10px] font-black px-3 py-1 rounded-full border transition ${aiEngine === engine ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/50"
                }`}
            >
              {engine.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Smart Parsing</span>
          <span className="text-[9px] text-white/30">
            {parseResult.intentType.toUpperCase()} • {parseResult.complexity} • {parseResult.estimatedSteps} steps • score {grammarHints.complexityScore}/5
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {parseResult.slots.map((slot: any, i: number) => (
            <span
              key={`${slot.type}-${i}`}
              className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ${slot.type === "action"
                ? "border-blue-400/40 text-blue-200 bg-blue-500/10"
                : slot.type === "time"
                  ? "border-amber-400/40 text-amber-200 bg-amber-500/10"
                  : slot.type === "object"
                    ? "border-emerald-400/40 text-emerald-200 bg-emerald-500/10"
                    : "border-white/20 text-white/60 bg-white/5"
                }`}
              title={`Confidence: ${Math.round(slot.confidence * 100)}%`}
            >
              {slot.type}: {slot.value}
            </span>
          ))}
          {parseResult.slots.length === 0 && (
            <span className="px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border border-white/10 text-white/50">
              No signals yet
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {(["decompose", "optimize", "expand", "clarify"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setAiMode(mode)}
            className={`text-[9px] font-black px-2 py-2 rounded-xl border transition-all ${aiMode === mode ? "bg-white text-black border-white" : "bg-white/5 border-white/5 text-white/50"
              }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      <button
        onClick={enhancedSuggestBreakdown}
        disabled={decomposing}
        className="text-[10px] font-black bg-white text-black px-4 py-2 rounded-full uppercase tracking-widest shadow active:scale-95 transition w-full"
      >
        {decomposing ? "Thinking..." : `Generate (${aiMode}) with ${aiEngine.toUpperCase()}`}
      </button>

      {suggested.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">
              {aiMode === "decompose"
                ? "Suggested Subtasks"
                : aiMode === "optimize"
                  ? "Optimizations"
                  : aiMode === "expand"
                    ? "Strategic Expansions"
                    : "Clarifications"}
            </span>
            <span className="text-[9px] text-white/30">
              {selectedIdx.size} selected • {suggested.reduce((sum: number, s: any) => sum + (s.duration_min || 0), 0)} min total
            </span>
          </div>
          <div className="grid gap-2">
            {suggested.map((s: any, i: number) => (
              <div
                key={i}
                onClick={() => {
                  const n = new Set(selectedIdx);
                  if (n.has(i)) n.delete(i);
                  else n.add(i);
                  setSelectedIdx(n);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${selectedIdx.has(i) ? "bg-white/10 border-white/20" : "bg-white/3 border-white/5 opacity-70"
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="text-sm font-bold flex-1">{s.title}</div>
                  <div className="text-[10px] font-black bg-white/10 text-white/60 px-2 py-1 rounded-full">
                    {s.duration_min || 15}m
                  </div>
                </div>
                {s.rationale && <div className="text-[10px] opacity-40 mt-1">{s.rationale}</div>}
              </div>
            ))}
          </div>
          {aiMode === "decompose" && (
            <button
              onClick={createSelectedSubtasks}
              className="w-full py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl mt-2 active:scale-95 transition-transform"
            >
              Create {selectedIdx.size} Subtasks
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

function RulesPanel({
  worldLookup,
  goal,
  project,
  grammarHints,
  parseResult,
  generateRuleSubtasks,
  ruleSubtasks,
  setTitle,
}: any) {
  return (
    <motion.div key="rules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/50">Rules-based (POS)</p>
          <p className="text-[11px] text-white/50">Offline parsing with POS keys for LF/Goal/Project.</p>
        </div>
        <span className="text-[10px] text-white/40">Offline</span>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <p className="text-[11px] text-white/70">
          LF/Goal/Project: {worldLookup?.name || "Unassigned"} / {goal || "Goal?"} / {project || "Project?"}
        </p>
        <p className="text-[10px] text-white/50">
          Complexity score: {grammarHints.complexityScore}/5 • Estimated steps: {parseResult.estimatedSteps}
        </p>
        <div className="flex flex-wrap gap-2">
          {["Actor", "Action", "Object", "Time", "Modality", "Location"].map((slot) => {
            const missing = grammarHints.missing.includes(slot);
            return (
              <span
                key={slot}
                className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${missing ? "border-amber-300 text-amber-200 bg-amber-500/10" : "border-emerald-400/40 text-emerald-200 bg-emerald-500/10"
                  }`}
              >
                {slot}
              </span>
            );
          })}
        </div>
        <ul className="space-y-2">
          {grammarHints.suggestions.map((s: string, i: number) => (
            <li key={i} className="text-[11px] text-white/70">• {s}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          {grammarHints.template && (
            <>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(grammarHints.template);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white text-black px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] shadow active:scale-95 transition"
              >
                Copy template
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle((prev: string) => prev || grammarHints.template || "");
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/90 text-black px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] shadow active:scale-95 transition"
              >
                Insert into title
              </button>
            </>
          )}
          <button
            type="button"
            onClick={generateRuleSubtasks}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 text-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] shadow active:scale-95 transition"
          >
            Generate 3 subtasks (rules)
          </button>
        </div>
      </div>
      {ruleSubtasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/50">Rule-based subtasks</p>
          <div className="grid gap-2">
            {ruleSubtasks.map((s: any, i: number) => (
              <div key={i} className="p-3 rounded-2xl border border-white/10 bg-white/5">
                <div className="text-sm font-bold text-white">{s.title}</div>
                <div className="text-[10px] text-white/50">{s.rationale}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
