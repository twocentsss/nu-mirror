import type {
  Artifacts,
  CasePack,
  Complexity,
  IssueNode,
  Lane,
  ProblemBrief,
  TaskNode,
} from "@/core/models";
import { analyzeNlp, type NerMode } from "@/core/ner";
import { splitIntoUnits } from "@/core/splitter";

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function guessDomainFromSignals(raw: string, verbs: string[], nouns: string[]) {
  const mixed = `${raw.toLowerCase()} ${verbs.join(" ")} ${nouns.join(" ")}`.toLowerCase();
  if (/(latency|p95|timeout|crash|error|deploy|prod|api|auth|integration)/.test(mixed)) {
    return "ENGINEERING";
  }
  if (/(schedule|meeting|invite|calendar|call)/.test(mixed)) {
    return "SCHEDULING";
  }
  if (/(pay|bill|charge|invoice|subscription|renew)/.test(mixed)) {
    return "FINANCE";
  }
  if (/(comic|story|write|draw|panel|plot)/.test(mixed)) {
    return "CREATIVE";
  }
  return "GENERAL";
}

function bestTimeBoundary(primaryDateText?: string) {
  return primaryDateText ? `By/On ${primaryDateText}` : "";
}

function buildProblemBriefFromNlp(
  unitText: string,
  lane: Lane,
  domain: string,
  signals: { primaryDateText?: string; entitiesText: string[]; verbs: string[] },
): ProblemBrief {
  const timeBoundary = bestTimeBoundary(signals.primaryDateText);
  const mainVerb = signals.verbs?.[0] ?? "Do";
  const entityHint = signals.entitiesText[0]
    ? `Key entity: ${signals.entitiesText[0]}`
    : "Key entity: (none detected)";

  const statement =
    lane === "TASK"
      ? `We need to ${mainVerb.toLowerCase()} — ${unitText}`
      : lane === "EVENT"
      ? `We need to schedule: ${unitText}`
      : lane === "NOTE"
      ? `We observed: ${unitText}`
      : `We want to store: ${unitText}`;

  const impact =
    domain === "ENGINEERING"
      ? "This impacts reliability/performance and blocks integration if unresolved."
      : domain === "SCHEDULING"
      ? "This impacts coordination and time allocation."
      : domain === "FINANCE"
      ? "This impacts cost/risk/compliance."
      : domain === "CREATIVE"
      ? "This impacts creative output continuity."
      : "This impacts time, quality, and momentum.";

  const outcome =
    domain === "ENGINEERING"
      ? "System meets target metrics and dependencies are unblocked."
      : domain === "SCHEDULING"
      ? "Event scheduled + confirmed."
      : domain === "FINANCE"
      ? "Payment/state updated + proof stored."
      : domain === "CREATIVE"
      ? "Draft produced + stored."
      : "Work completed + verified.";

  const dod =
    domain === "ENGINEERING"
      ? "Target metric satisfied (e.g., p95 below threshold) for 24h and no regressions."
      : domain === "SCHEDULING"
      ? "Invite sent and accepted/confirmed."
      : domain === "FINANCE"
      ? "Transaction verified + receipt stored."
      : domain === "CREATIVE"
      ? "Draft exported + saved."
      : "Binary or measurable done condition defined.";

  return {
    statement,
    impact: `${impact} (${entityHint})`,
    outcome,
    dod,
    constraints: [],
    timeBoundary,
    dri: "",
    decider: "",
  };
}

function buildIssueTree(domain: string, unitText: string, complexity: Complexity): IssueNode {
  const root: IssueNode = {
    id: uid("issue"),
    kind: "requirement",
    text: "Issue Tree",
    children: [],
  };

  const causes: IssueNode = {
    id: uid("cause"),
    kind: "cause",
    text: "Causes",
    children:
      domain === "ENGINEERING"
        ? [
            { id: uid("c"), kind: "cause", text: "DB / storage contention" },
            { id: uid("c"), kind: "cause", text: "Payload size / serialization" },
            { id: uid("c"), kind: "cause", text: "Network / upstream backpressure" },
          ]
        : [
            { id: uid("c"), kind: "cause", text: "Root cause candidate A" },
            { id: uid("c"), kind: "cause", text: "Root cause candidate B" },
          ],
  };

  const reqs: IssueNode = {
    id: uid("req"),
    kind: "requirement",
    text: "Requirements",
    children: [
      { id: uid("r"), kind: "requirement", text: `Must satisfy: "${unitText.slice(0, 90)}"` },
      { id: uid("r"), kind: "requirement", text: "No regressions / preserve correctness" },
      { id: uid("r"), kind: "requirement", text: "Verification evidence is captured" },
    ],
  };

  const options: IssueNode = {
    id: uid("opt"),
    kind: "option",
    text: "Options",
    children:
      domain === "ENGINEERING"
        ? [
            { id: uid("o"), kind: "option", text: "Option A: quick fix (lowest change)" },
            { id: uid("o"), kind: "option", text: "Option B: structural fix (medium effort)" },
          ]
        : [
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
      { id: uid("rk"), kind: "risk", text: "Verification gap / false done" },
    ],
  };

  if (complexity === "HIGH") {
    options.children?.push({ id: uid("o"), kind: "option", text: "Option C: long-term hardening" });
    risks.children?.push({ id: uid("rk"), kind: "risk", text: "Rollback/blast radius" });
  }

  root.children = [causes, reqs, options, risks];
  return root;
}

function buildTaskTree(domain: string, unitText: string): TaskNode {
  const root: TaskNode = { id: uid("task"), title: `Solve: ${unitText}`, children: [] };

  const spine =
    domain === "ENGINEERING"
      ? [
          { title: "Discover: capture baseline metrics", dod: "Baseline metrics recorded (p50/p95/error)." },
          { title: "Decide: choose approach", dod: "Decision logged (option + rationale)." },
          { title: "Design: steps + rollback", dod: "Plan + rollback defined." },
          { title: "Execute: implement change", dod: "Change shipped to target env." },
          { title: "Verify: confirm DoD", dod: "Metrics meet target for required window." },
          { title: "Store: evidence links", dod: "Dashboards/screenshots/PR links stored." },
          { title: "Notify: stakeholders", dod: "BLUF sent + next steps shared." },
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

  root.children = spine.map((step) => ({ id: uid("t"), title: step.title, dod: step.dod }));
  return root;
}

function buildCasePack(unitText: string, brief: ProblemBrief): CasePack {
  const bluf =
    `Bottom line: We should execute the staged plan to achieve: ${brief.outcome}\n` +
    `Why:\n- ${brief.impact}\n- DoD: ${brief.dod}\n` +
    `Risk: verification + dependencies\n` +
    `Ask: approve / decide / assign DRI\n`;

  const slide =
    `Title: Decision — ${brief.outcome}\n` +
    `Evidence: DoD = ${brief.dod}\n` +
    `Risks: dependencies, rollback, verification\n` +
    `Next: execute → verify → store → notify\n`;

  const script =
    `Answer: We should do this to achieve ${brief.outcome}.\n` +
    `Reasons: impact, measurable DoD, staged execution.\n` +
    `Tradeoff: speed vs risk.\n` +
    `Ask: confirm decider + approve next action.\n`;

  const caseBrief =
    `S: ${brief.statement}\n` +
    `C: ${brief.impact}\n` +
    `Q: What decision is needed now?\n` +
    `A: Recommend executing the staged plan with measurable DoD.\n\n` +
    `Evidence:\n- DoD: ${brief.dod}\n- Time: ${brief.timeBoundary || "TBD"}\n\n` +
    `Ask:\n- Approve plan / unblock dependencies / assign DRI & Decider\n`;

  return { bluf, slide, script, caseBrief };
}

export async function buildArtifacts({
  rawText,
  lane,
  complexity,
  nerMode,
}: {
  rawText: string;
  lane: Lane;
  complexity: Complexity;
  nerMode: NerMode;
}): Promise<Artifacts> {
  const nlpRes = await analyzeNlp(rawText, nerMode);
  const units = splitIntoUnits(nlpRes.sentences, rawText);
  const primary = units[0]?.text ?? rawText;

  const entitiesText = nlpRes.entities
    .filter((entity) => ["PERSON", "ORG", "GPE"].includes(entity.type))
    .map((entity) => entity.text);

  const domain = guessDomainFromSignals(primary, nlpRes.verbs, nlpRes.nouns);
  const problemBrief = buildProblemBriefFromNlp(primary, lane, domain, {
    primaryDateText: nlpRes.primaryDateText,
    entitiesText,
    verbs: nlpRes.verbs,
  });

  const issueTree = buildIssueTree(domain, primary, complexity);
  const taskTree = buildTaskTree(domain, primary);
  const casePack = buildCasePack(primary, problemBrief);

  return {
    lane,
    complexity,
    rawText: primary,
    problemBrief,
    issueTree,
    taskTree,
    casePack,
  };
}
