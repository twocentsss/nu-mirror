"use client";

import { useMemo, useState } from "react";
import TaskMenu from "@/ui/TaskMenu";
import { MirrorCard } from "@/ui/MirrorCard";
import TaskRow from "@/ui/TaskRow";
import Sheet from "@/ui/Sheet";

type P = "HIGH" | "MEDIUM" | "LOW";

type TaskItem = {
  title: string;
  note?: string;
  desc?: string;
};

const DETERMINISTIC_WORKFLOW_MD = [
  "# A Deterministic Problem-Solving Workflow",
  "",
  "### Define → Break → Plan → Work the Plan → Build the Case → Make the Case",
  "",
  "*(6-pager, written as an engineering operating model using your 12D-G Episode as the canonical unit)*",
  "",
  "---",
  "",
  "## Page 1 — Purpose, Objects, and the Core Promise",
  "",
  "### Purpose",
  "",
  "Build an operating system that turns **any English input** (task, rant, bug, idea, reflection, request) into:",
  "",
  "1. **structured work** (tasks + subtasks + ownership + schedule),",
  "2. **measurable execution** (logs + evidence), and",
  "3. **executive-grade communication** (case + decision + alignment).",
  "",
  "The system must be:",
  "",
  "- **deterministic** (rules first, AI optional),",
  "- **composable** (same flow for personal life and engineering work),",
  "- **auditable** (evidence, links, decisions captured),",
  "- **reportable** (widgets/weekly reviews auto-generated).",
  "",
  "### Canonical Unit: the Episode",
  "",
  "Every input becomes an **Episode**. This is the only required entry point.",
  "",
  "~~~",
  "Episode {",
  "  id: ULID",
  "  raw_text: string",
  "  dims: D12 // your 12D-G semantic vector",
  "}",
  "~~~",
  "",
  "The Episode is a “semantic checksum”: once created, every downstream engine can map from it without guessing.",
  "",
  "### The Three Persistent Objects (avoid schema bloat)",
  "",
  "To scale without drowning, the workflow is built on three living objects:",
  "",
  "1. **TASK** — the durable definition of work",
  "   - what it is, why it exists, who owns it, what “done” means.",
  "",
  "2. **WORKLOG** — the execution history",
  "   - when you worked, how long, what happened, what evidence exists.",
  "",
  "3. **DECISIONLOG** — the decisions that change reality",
  "   - what was decided, options, tradeoffs, confidence, risk, owner.",
  "",
  "Everything else (streaks, delayed, days-left, ROI, trends, heatmaps, productivity scores) is **computed** from these.",
  "",
  "### The Lifecycle (single stage machine)",
  "",
  "Each problem/initiative runs as:",
  "",
  "`intake → defined → decomposed → planned → executing → verified → cased → communicated → closed`",
  "",
  "You are always in one stage, and the system knows what is required to advance.",
  "",
  "---",
  "",
  "## Page 2 — Stage 0–1: Intake and Define (turn language into a problem)",
  "",
  "### Stage 0: Intake / Normalize",
  "",
  "**Goal:** Convert messy English into a structured episode and route it.",
  "",
  "**Input:** raw text (one-liner or paragraph)",
  "**Output:** Episode (12D-G), plus a routing label",
  "",
  "**Routing decision (Meaning + Action)**",
  "",
  "- If `meaning.category = task` and `action.class in {create/update/schedule/notify}` → goes to TASK flow.",
  "- If `meaning.category = observation/note` → goes to knowledge/journal flow.",
  "- If `meaning.category = event` → goes to scheduling flow.",
  "- If `meaning.category = memory` → goes to capture/store flow.",
  "",
  "This prevents everything becoming a “task” and creates clean downstream lanes.",
  "",
  "### Stage 1: Define the Problem",
  "",
  "**Goal:** Convert the episode into an unambiguous problem statement + done condition.",
  "",
  "#### Output artifact: Problem Brief (1 page)",
  "",
  "A deterministic template:",
  "",
  "1. **Problem statement**",
  "   “We are experiencing **[symptom]** in **[context]**.”",
  "",
  "2. **Impact**",
  "   “This causes **[cost/risk/time/quality/user harm]**.”",
  "",
  "3. **Target outcome**",
  "   `outcome.expected`",
  "",
  "4. **Definition of Done (DoD)**",
  "   `outcome.success_condition` (must be testable)",
  "",
  "5. **Constraints**",
  "   `context.constraints[]` (budget/time/dependencies)",
  "",
  "6. **Time boundary**",
  "   `time.when/value` and (if needed) due date",
  "",
  "7. **Urgency & state**",
  "   `state.urgency` plus any key mood/energy notes",
  "",
  "8. **Ownership**",
  "   - DRI (shepherd)",
  "   - Decider (final call)",
  "",
  "#### Quality gates (must pass to proceed)",
  "",
  "A definition is acceptable only if:",
  "",
  "- DoD is **binary** (true/false) or explicitly measurable,",
  "- the time window is explicit (or intentionally “unspecified” with next action),",
  "- at least one DRI exists,",
  "- the “why now” is explainable (urgency + impact + constraints).",
  "",
  "If these gates fail, the system loops inside Stage 1 rather than spilling ambiguity into execution.",
  "",
  "---",
  "",
  "## Page 3 — Stage 2: Break the Problem (Issue Tree + Task Tree)",
  "",
  "Breaking is where most “automation systems” fail because they collapse thinking and doing. You must separate the two.",
  "",
  "### Stage 2A: Issue Tree (thinking tree)",
  "",
  "**Goal:** Build a MECE structure for causes, requirements, options, risks.",
  "",
  "**Output:** Issue Tree where each leaf becomes one of:",
  "",
  "- a measurement,",
  "- a decision,",
  "- a task.",
  "",
  "#### Deterministic branching questions",
  "",
  "1. **Causes:** Why is it happening? (root cause candidates)",
  "2. **Requirements:** What must be true for success? (constraints/criteria)",
  "3. **Options:** What are the solution paths? (A/B/C)",
  "4. **Risks:** What can break the plan? (dependencies, failure modes)",
  "",
  "#### Minimal allowed tools (choose 1, not 10)",
  "",
  "- 5 Whys (single causal chain)",
  "- Fishbone (cause families)",
  "- MECE issue tree (best default)",
  "",
  "The system should pick a default based on domain:",
  "",
  "- Engineering/latency bugs → Fishbone + measures",
  "- Product prioritization → options + requirements",
  "- Personal life tasks → simple issue tree + constraints",
  "",
  "### Stage 2B: Task Tree / WBS (doing tree)",
  "",
  "**Goal:** Convert thinking into executable tasks.",
  "",
  "**Output:** Parent TASK + subtasks, each atomic.",
  "",
  "#### Deterministic subtask chain (universal)",
  "",
  "For most real-world problems, you can generate the same “spine”:",
  "",
  "1. **Discover** (facts/data)",
  "2. **Decide** (choose approach)",
  "3. **Design** (plan/steps)",
  "4. **Execute** (do work)",
  "5. **Verify** (confirm success)",
  "6. **Store** (save evidence)",
  "7. **Notify** (stakeholders)",
  "",
  "Each subtask must be written in strict English semantics:",
  "",
  "- **Verb + Object + Modifier + DoD**",
  "",
  "Example form:",
  "",
  "- “Compare three options **by Friday**; DoD = recommendation written.”",
  "- “Deploy fix to prod; DoD = metric p95 < target for 24h.”",
  "",
  "#### Atomicity gate",
  "",
  "A subtask passes only if:",
  "",
  "- one DRI can finish it without needing hidden tasks,",
  "- it can be completed in one bounded chunk,",
  "- it has its own DoD or inherits the parent DoD fragment.",
  "",
  "---",
  "",
  "## Page 4 — Stage 3–4: Plan the Work and Work the Plan (execution OS)",
  "",
  "### Stage 3: Plan the Work",
  "",
  "**Goal:** Turn a WBS into a schedule, ownership map, prioritization map, and risk plan.",
  "",
  "#### Outputs (four small artifacts)",
  "",
  "1. **Execution Plan**: sequence + milestones",
  "2. **Ownership Plan**: DRI + Decider (+ RAPID/RACI if needed)",
  "3. **Priority Plan**: Eisenhower + MoSCoW (+ optional score)",
  "4. **Risk Plan**: risk level + mitigation + triggers",
  "",
  "#### Planning mechanics",
  "",
  "**A) Ownership (shepherding)**",
  "",
  "- Every task has exactly:",
  "  - one DRI",
  "  - one Decider",
  "- A DRI may delegate work, but never delegates accountability.",
  "",
  "**Decision enforcement rule**",
  "If a task contains verbs like:",
  "",
  "- choose, approve, commit, sign off, finalize",
  "  then a **DECISIONLOG entry is mandatory** before it can move to “done”.",
  "",
  "**B) Priority**",
  "Use a two-pass system:",
  "",
  "- **Pass 1: Eisenhower** decides attention lane",
  "  - Do / Schedule / Delegate / Drop",
  "",
  "- **Pass 2: MoSCoW** decides commitment to the plan",
  "  - Must / Should / Could / Won’t",
  "",
  "Optional: For dense backlogs, add a numeric ordering:",
  "",
  "- WSJF (Cost of Delay / Duration) or RICE.",
  "",
  "**C) Scheduling**",
  "Convert time into a deterministic triad:",
  "",
  "- `due_date` (deadline)",
  "- `next_action_date` (when work begins)",
  "- `cadence` if recurring",
  "",
  "**D) Dependencies**",
  "Every dependency must be:",
  "",
  "- a task id, or",
  "- a named external dependency (“waiting on vendor”).",
  "",
  "No free-form “blocked” allowed without an object.",
  "",
  "### Stage 4: Work the Plan (Execution)",
  "",
  "**Goal:** Convert planning into momentum without losing auditability.",
  "",
  "#### Output artifacts",
  "",
  "- WORKLOG entries",
  "- Updated task statuses",
  "- Evidence links",
  "- Occasional decision logs (only when reality changes)",
  "",
  "#### The micro-loop (the smallest repeatable execution cycle)",
  "",
  "1. Choose the next subtask (priority + dependencies)",
  "2. Execute a focused session",
  "3. Log the session",
  "4. Update status",
  "5. Unblock the next action",
  "",
  "#### WORKLOG (minimum viable and reportable)",
  "",
  "- timestamp_start",
  "- duration_actual",
  "- task_id",
  "- status (doing/done/blocked)",
  "- notes (1–2 lines)",
  "- link (evidence)",
  "",
  "Optional but powerful:",
  "",
  "- focus, location, E1..E5 (your state metrics)",
  "",
  "#### Block detection (deterministic)",
  "",
  "If notes contain phrases like:",
  "",
  "- “waiting on”, “pending”, “can’t until”, “blocked by”",
  "  → status becomes `blocked`, and a dependency task is created/linked.",
  "",
  "---",
  "",
  "## Page 5 — Stage 5–6: Automate the Workflow + Build the Case",
  "",
  "### Stage 5: Automation (make problem-solving self-running)",
  "",
  "Automation here is not “AI magic.” It’s **rules + gates + triggers** driven by Episode dims and stage transitions.",
  "",
  "#### Automation categories",
  "",
  "**1) Object creation**",
  "",
  "- If `meaning.category = task` → create TASK",
  "- If action.class implies coordination → create “Notify/Coordinate” subtask",
  "- If time.when is explicit → set due_date automatically",
  "",
  "**2) Subtask generation**",
  "Based on action.class:",
  "",
  "- schedule/notify → add “draft message”, “send”, “confirm”",
  "- update/renew/pay → add “discover → decide → execute → verify → store”",
  "- create/build → add “design → implement → test → ship → verify”",
  "",
  "**3) Stage gates**",
  "",
  "- cannot move from “defined” → “planned” without DoD, owner, time",
  "- cannot move from “doing” → “done” without evidence link if required by policy",
  "- cannot complete “choose/approve” tasks without DECISIONLOG",
  "",
  "**4) Auto-report drafting**",
  "",
  "- daily: aggregate WORKLOG by tag/module/LF",
  "- weekly: produce a summary with deltas, trend, blockers, decisions required",
  "",
  "This is the mechanical spine of “automate any problem solving.”",
  "",
  "### Stage 6: Build the Case (turn work into a persuasive artifact)",
  "",
  "**Goal:** Prepare a decision-grade narrative from facts + tradeoffs.",
  "",
  "#### Output: Case Brief (1–2 pages)",
  "",
  "Use SCQA + evidence (tight, exec-friendly).",
  "",
  "Template:",
  "",
  "1. **Situation:** baseline facts",
  "2. **Complication:** what changed / why now",
  "3. **Question:** what decision is needed",
  "4. **Answer:** recommendation",
  "5. **Evidence:** 3 strongest points",
  "6. **Options:** A/B/C with tradeoffs",
  "7. **Risks & mitigations:** concise",
  "8. **Plan:** milestones + owners",
  "9. **Ask:** approval/unblock/resources",
  "",
  "#### Evidence discipline",
  "",
  "Evidence must reference:",
  "",
  "- WORKLOG entries",
  "- links to docs/screenshots/metrics",
  "- measured outcomes vs DoD",
  "",
  "No evidence → no case. This makes the system truthy.",
  "",
  "---",
  "",
  "## Page 6 — Stage 7–8: Make the Case (Exec Communication) + Close the Loop",
  "",
  "### Stage 7: Make the Case (executive communication)",
  "",
  "**Goal:** Turn the Case Brief into decisions and alignment quickly.",
  "",
  "#### Three formats (always produce all three)",
  "",
  "1. **BLUF message** (Slack/email, 6 lines)",
  "2. **1-slide summary** (for meetings)",
  "3. **5-minute spoken script**",
  "",
  "**1) BLUF template**",
  "",
  "- Bottom line: “We should X by Y to achieve Z.”",
  "- Why: 2 bullets (evidence)",
  "- Risks: 1 bullet",
  "- Ask: “Approve/Decide/Unblock: ____”",
  "",
  "**2) 1-slide template**",
  "",
  "- Title: decision statement",
  "- Left: evidence bullets",
  "- Right: risks + mitigations",
  "- Bottom: ask + next steps + owner",
  "",
  "**3) 5-minute script**",
  "",
  "- 1 sentence answer",
  "- 3 reasons",
  "- 1 tradeoff",
  "- 1 ask",
  "- confirm decider + next action",
  "",
  "#### Decision closure rule",
  "",
  "Every exec interaction ends with one of:",
  "",
  "- Yes / No / Change / Defer",
  "  And you log it in DECISIONLOG.",
  "",
  "### Stage 8: Close the Loop (learning + system upgrade)",
  "",
  "**Goal:** Convert outcomes into improved rules, templates, and future speed.",
  "",
  "#### Outputs",
  "",
  "- Review entry",
  "- Updated rule-sheet / mapping config",
  "- Updated task templates / decomposition patterns",
  "",
  "#### Deterministic review prompts",
  "",
  "- What worked?",
  "- What failed?",
  "- What surprised us?",
  "- What rule would have prevented failure?",
  "- What template should be promoted to default?",
  "",
  "This stage is how your OS “gets smarter” without relying on the LLM every time.",
  "",
  "---",
  "",
  "# Summary: The Whole Workflow in One Line",
  "",
  "**English → Episode (12D) → Problem Brief → Issue Tree + Task Tree → Plan (owners/priorities/schedule) → Execute (worklogs) → Case Brief → Exec BLUF/slide/script → Decisions logged → Review + rules updated.**",
].join("\n");

export default function TodoPage() {
  const [openSection, setOpenSection] = useState<Record<P, boolean>>({
    HIGH: true,
    MEDIUM: true,
    LOW: true,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const data = useMemo<Record<P, TaskItem[]>>(
    () => ({
      HIGH: [
        {
          title: "Deterministic Problem-Solving Workflow (6-pager)",
          note: "Operating model • Define→Break→Plan→Work→Case",
          desc: DETERMINISTIC_WORKFLOW_MD,
        },
        { title: "Pay credit card", note: "2 min • Anytime", desc: "" },
        { title: "Send the email", note: "10 min • Morning", desc: "" },
      ],
      MEDIUM: [
        { title: "Grocery list", note: "15 min • Day", desc: "" },
        { title: "Laundry", note: "30 min • Evening", desc: "" },
      ],
      LOW: [{ title: "Read 10 pages", note: "10 min • Evening", desc: "" }],
    }),
    [],
  );

  function openEditor(task?: TaskItem) {
    setEditTitle(task?.title ?? "");
    setEditDesc(task?.desc ?? "");
    setEditOpen(true);
  }

  function Section({ p, label }: { p: P; label: string }) {
    return (
      <MirrorCard className="overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="text-[13px] font-semibold text-black/65">
            {label}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="tap h-9 w-9 rounded-full bg-black/5 border border-black/5 flex items-center justify-center"
              onClick={() => setOpenSection((s) => ({ ...s, [p]: !s[p] }))}
              aria-label="Toggle"
            >
              <ChevronDown open={openSection[p]} />
            </button>
            <button
              className="tap h-9 w-9 rounded-full bg-black/5 border border-black/5 flex items-center justify-center"
              onClick={() => openEditor(undefined)}
              aria-label="Add"
            >
              <Plus />
            </button>
          </div>
        </div>

        {openSection[p] && (
          <div className="divide-y divide-black/5">
            {data[p].map((t) => (
              <TaskRow
                key={t.title}
                title={t.title}
                note={t.note}
                onClick={() => openEditor(t)}
              />
            ))}
          </div>
        )}
      </MirrorCard>
    );
  }

  return (
    <div className="space-y-5">
      <TaskMenu
        title="To-do"
        subtitle="Your priority buckets"
        onFilter={() => alert("Filter (later)")}
        onAdd={() => openEditor(undefined)}
      />

      <div className="space-y-4 pt-2">
        <Section p="HIGH" label="High priority" />
        <Section p="MEDIUM" label="Medium priority" />
        <Section p="LOW" label="Low priority" />
      </div>

      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit to-do"
      >
        <div className="space-y-4">
          <div className="text-[12px] text-black/55">Title</div>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Enter task…"
            className="w-full rounded-[14px] border border-black/10 bg-white/80 px-3 py-3 text-[14px] outline-none focus:border-black/20"
          />

          <div className="text-[12px] text-black/55">Description</div>
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="Add details…"
            rows={10}
            className="w-full rounded-[14px] border border-black/10 bg-white/80 px-3 py-3 text-[13px] leading-[1.35] outline-none focus:border-black/20"
          />

          <div className="grid grid-cols-2 gap-2">
            <button className="tap rounded-[14px] border border-black/10 bg-white/70 px-4 py-3 text-[13px]">
              Time of day (later)
            </button>
            <button className="tap rounded-[14px] border border-black/10 bg-white/70 px-4 py-3 text-[13px]">
              Priority (later)
            </button>
          </div>

          <button
            className="tap w-full rounded-[14px] bg-black text-white px-4 py-3 text-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.16)]"
            onClick={() => setEditOpen(false)}
          >
            Save
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function Plus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5v14M5 12h14"
        stroke="rgba(0,0,0,0.6)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 160ms",
      }}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="rgba(0,0,0,0.55)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
