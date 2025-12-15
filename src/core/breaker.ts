import type { Artifacts, CasePack, Complexity, IssueNode, Lane, ProblemBrief, TaskNode } from "@/core/models";

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function guessDomain(raw: string) {
  const t = raw.toLowerCase();
  if (/(p95|latency|timeout|error|crash|bug|incident)/.test(t)) return "ENGINEERING";
  if (/(tomorrow|today|schedule|meeting|call|invite|calendar)/.test(t)) return "SCHEDULING";
  if (/(pay|bill|charge|renew|invoice|subscription)/.test(t)) return "FINANCE";
  if (/(comic|story|write|draw|panel|plot)/.test(t)) return "CREATIVE";
  return "GENERAL";
}

function extractTimeBoundary(raw: string) {
  const t = raw.toLowerCase();
  if (/\bby friday\b/.test(t)) return "By Friday";
  if (/\btomorrow\b/.test(t)) return "Tomorrow";
  if (/\btoday\b/.test(t)) return "Today";
  return "";
}

function extractVerbObject(raw: string) {
  const words = raw.trim().split(/\s+/);
  const verb = words[0] ?? "Do";
  const obj = words.slice(1).join(" ") || "the thing";
  return { verb, obj };
}

function buildProblemBrief(rawText: string, lane: Lane, domain: string, complexity: Complexity): ProblemBrief {
  const { verb, obj } = extractVerbObject(rawText);
  const timeBoundary = extractTimeBoundary(rawText);

  const statement =
    lane === "TASK"
      ? `We need to ${verb.toLowerCase()} ${obj}.`
      : lane === "EVENT"
      ? `We need to schedule: ${rawText}.`
      : lane === "NOTE"
      ? `We observed: ${rawText}.`
      : `We want to store: ${rawText}.`;

  const impact =
    domain === "ENGINEERING"
      ? "This impacts performance/reliability and user experience."
      : domain === "FINANCE"
      ? "This impacts costs, risk, and compliance."
      : domain === "SCHEDULING"
      ? "This impacts time allocation and coordination."
      : domain === "CREATIVE"
      ? "This impacts creative output and narrative continuity."
      : "This impacts time, quality, and momentum.";

  const outcome =
    domain === "ENGINEERING"
      ? "System meets target performance and remains stable."
      : domain === "FINANCE"
      ? "Payment/state updated successfully with proof stored."
      : domain === "SCHEDULING"
      ? "Event is scheduled with confirmations."
      : domain === "CREATIVE"
      ? "A draft artifact is produced and saved."
      : "Work is complete and verified.";

  const dod =
    domain === "ENGINEERING"
      ? "Metric meets target (e.g., p95 below threshold) for 24h."
      : domain === "FINANCE"
      ? "Transaction verified + receipt stored."
      : domain === "SCHEDULING"
      ? "Invite sent + accepted/confirmed."
      : domain === "CREATIVE"
      ? "Draft produced + exported/stored."
      : "Done condition is measurable/binary.";

  const defaultDRI = complexity === "HIGH" ? "DRI (required)" : "";
  const defaultDecider = complexity === "HIGH" ? "Decider (required)" : "";

  return {
    statement,
    impact,
    outcome,
    dod,
    constraints: [],
    timeBoundary,
    dri: defaultDRI,
    decider: defaultDecider,
  };
}

function buildIssueTree(domain: string, rawText: string, complexity: Complexity): IssueNode {
  const root: IssueNode = { id: uid("issue"), kind: "requirement", text: "Issue Tree", children: [] };

  const causes: IssueNode = {
    id: uid("cause"),
    kind: "cause",
    text: "Causes",
    children: [
      { id: uid("c"), kind: "cause", text: domain === "ENGINEERING" ? "Resource bottleneck (CPU/DB)" : "Root cause candidate A" },
      { id: uid("c"), kind: "cause", text: domain === "ENGINEERING" ? "Payload size / serialization" : "Root cause candidate B" },
    ],
  };

  const reqs: IssueNode = {
    id: uid("req"),
    kind: "requirement",
    text: "Requirements",
    children: [
      { id: uid("r"), kind: "requirement", text: "No regressions / preserve correctness" },
      { id: uid("r"), kind: "requirement", text: "Time boundary respected" },
    ],
  };

  const options: IssueNode = {
    id: uid("opt"),
    kind: "option",
    text: "Options",
    children: [
      { id: uid("o"), kind: "option", text: "Option A (lowest risk)" },
      { id: uid("o"), kind: "option", text: "Option B (fastest)" },
    ],
  };

  const risks: IssueNode = {
    id: uid("risk"),
    kind: "risk",
    text: "Risks",
    children: [
      { id: uid("rk"), kind: "risk", text: "Dependency delays / unknowns" },
      { id: uid("rk"), kind: "risk", text: "Verification gap" },
    ],
  };

  if (complexity === "HIGH") {
    causes.children?.push({ id: uid("c"), kind: "cause", text: "Third cause candidate (validate with evidence)" });
    options.children?.push({ id: uid("o"), kind: "option", text: "Option C (long-term)" });
    risks.children?.push({ id: uid("rk"), kind: "risk", text: "Rollback / blast radius" });
    reqs.children?.push({ id: uid("r"), kind: "requirement", text: "Evidence required for DoD" });
  }

  reqs.children?.unshift({ id: uid("r"), kind: "requirement", text: `Success must satisfy: "${rawText.slice(0, 80)}"` });
  root.children = [causes, reqs, options, risks];
  return root;
}

function buildTaskTree(domain: string, rawText: string): TaskNode {
  const root: TaskNode = { id: uid("task"), title: `Solve: ${rawText}`, children: [] };

  const spine: { title: string; dod: string }[] =
    domain === "ENGINEERING"
      ? [
          { title: "Discover: capture baseline metrics", dod: "Baseline metrics recorded (p50/p95/error)." },
          { title: "Decide: choose approach", dod: "Decision recorded (option + why)." },
          { title: "Design: outline steps + risks", dod: "Plan written + rollback defined." },
          { title: "Execute: implement change", dod: "Change merged/deployed to target env." },
          { title: "Verify: confirm DoD", dod: "Metrics meet target for window." },
          { title: "Store: evidence + links", dod: "Dashboard links / screenshots saved." },
          { title: "Notify: stakeholders", dod: "BLUF message sent." },
        ]
      : [
          { title: "Discover: gather facts", dod: "Inputs collected." },
          { title: "Decide: select option", dod: "Choice captured." },
          { title: "Design: steps + DoD", dod: "Steps defined." },
          { title: "Execute: do the work", dod: "Work completed." },
          { title: "Verify: confirm outcome", dod: "DoD satisfied." },
          { title: "Store: evidence", dod: "Proof saved." },
          { title: "Notify: share/update", dod: "Stakeholders informed." },
        ];

  root.children = spine.map((s) => ({ id: uid("t"), title: s.title, dod: s.dod }));
  return root;
}

function buildCasePack(rawText: string, brief: ProblemBrief): CasePack {
  const bluf =
    `Bottom line: We should proceed with the plan to achieve: ${brief.outcome}\n` +
    `Why: (1) ${brief.impact}\n` +
    `     (2) DoD: ${brief.dod}\n` +
    `Risk: Primary risk is verification / dependencies.\n` +
    `Ask: Approve / decide / unblock ownership + timeline.\n`;

  const slide =
    `Title: Decision — ${brief.outcome}\n` +
    `Evidence: ${brief.dod}\n` +
    `Risks: dependencies, rollback, verification\n` +
    `Next steps: execute plan → verify → store → notify\nOwner: ${brief.dri || "TBD"}\n`;

  const script =
    `Answer: We should do X to achieve ${brief.outcome}.\n` +
    `Reason 1: ${brief.impact}\n` +
    `Reason 2: We have a measurable DoD.\n` +
    `Reason 3: The plan is staged and auditable.\n` +
    `Tradeoff: Speed vs risk.\n` +
    `Ask: Confirm decider + approve next action.\n`;

  const caseBrief =
    `S: ${brief.statement}\n` +
    `C: ${brief.impact}\n` +
    `Q: What decision is needed now?\n` +
    `A: Recommend executing the staged plan with DoD.\n\n` +
    `Evidence:\n- DoD: ${brief.dod}\n- Time: ${brief.timeBoundary || "TBD"}\n\n` +
    `Ask:\n- Approve plan / unblock dependencies / assign DRI & Decider\n`;

  return { bluf, slide, script, caseBrief };
}

export function buildArtifacts({
  rawText,
  lane,
  complexity,
}: {
  rawText: string;
  lane: Lane;
  complexity: Complexity;
}): Artifacts {
  const domain = guessDomain(rawText);
  const problemBrief = buildProblemBrief(rawText, lane, domain, complexity);
  const issueTree = buildIssueTree(domain, rawText, complexity);
  const taskTree = buildTaskTree(domain, rawText);
  const casePack = buildCasePack(rawText, problemBrief);

  return {
    lane,
    complexity,
    rawText,
    problemBrief,
    issueTree,
    taskTree,
    casePack,
  };
}
