"use client";

import { useMemo, useState } from "react";
import TaskMenu from "@/ui/TaskMenu";
import { MirrorCard } from "@/ui/MirrorCard";
import StageRail, { StageId } from "@/ui/StageRail";
import EpisodeComposer, { Lane, Complexity } from "@/ui/EpisodeComposer";
import IssueTreeView from "@/ui/IssueTreeView";
import TaskTreeView from "@/ui/TaskTreeView";
import { buildArtifacts } from "@/core/breaker";
import { gatesForStage } from "@/core/gates";
import type { Artifacts, ProblemBrief } from "@/core/models";

export default function SolvePage() {
  const [stage, setStage] = useState<StageId>("intake");

  const [lane, setLane] = useState<Lane>("TASK");
  const [complexity, setComplexity] = useState<Complexity>("MEDIUM");

  const [raw, setRaw] = useState("");
  const [art, setArt] = useState<Artifacts | null>(null);

  const [brief, setBrief] = useState<ProblemBrief | null>(null);

  const stageStatus = useMemo(() => {
    const ok = (s: StageId) => gatesForStage(s, art, brief).missing.length === 0;
    return {
      intake: ok("intake"),
      define: ok("define"),
      break: ok("break"),
      plan: ok("plan"),
      execute: ok("execute"),
      case: ok("case"),
      communicate: ok("communicate"),
      close: ok("close"),
    };
  }, [art, brief]);

  const gate = useMemo(() => gatesForStage(stage, art, brief), [stage, art, brief]);

  function onSolve() {
    const out = buildArtifacts({ rawText: raw, lane, complexity });
    setArt(out);
    setBrief(out.problemBrief);
    setStage("define");
  }

  function advance() {
    if (gate.missing.length) return;
    const order: StageId[] = ["intake", "define", "break", "plan", "execute", "case", "communicate", "close"];
    const idx = order.indexOf(stage);
    setStage(order[Math.min(idx + 1, order.length - 1)]);
  }

  return (
    <div className="space-y-5">
      <TaskMenu
        title="Solve"
        subtitle="One line → auto-break → stage-gated execution"
        onFilter={() => alert("Filters later")}
        onAdd={() => alert("Templates later")}
      />

      <EpisodeComposer
        raw={raw}
        onRawChange={setRaw}
        lane={lane}
        onLaneChange={setLane}
        complexity={complexity}
        onComplexityChange={setComplexity}
        onSolve={onSolve}
      />

      <StageRail
        value={stage}
        onChange={setStage}
        status={stageStatus}
      />

      <MirrorCard className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[13px] text-black/55">Stage</div>
            <div className="mt-1 font-serif text-[26px] leading-none tracking-[-0.02em]">
              {label(stage)}
            </div>
          </div>

          <button
            className={[
              "tap rounded-[14px] px-4 py-3 text-[13px] font-semibold",
              gate.missing.length
                ? "bg-black/5 border border-black/10 text-black/40"
                : "bg-black text-white shadow-[0_20px_60px_rgba(0,0,0,0.16)]",
            ].join(" ")}
            onClick={advance}
          >
            Advance
          </button>
        </div>

        {gate.missing.length > 0 ? (
          <div className="mt-4 rounded-[14px] border border-black/10 bg-white/70 p-4">
            <div className="text-[12px] text-black/55">To advance, fill:</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-black/70">
              {gate.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4 text-[13px] text-black/55">Gates satisfied. You can advance.</div>
        )}
      </MirrorCard>

      {stage === "define" && (
        <MirrorCard className="p-5">
          <div className="text-[13px] font-semibold">Problem Brief</div>
          <div className="mt-3 space-y-3">
            <Field
              label="Problem statement"
              value={brief?.statement ?? ""}
              onChange={(v) => setBrief((b) => ({ ...(b ?? emptyBrief()), statement: v }))}
            />
            <Field
              label="Impact"
              value={brief?.impact ?? ""}
              onChange={(v) => setBrief((b) => ({ ...(b ?? emptyBrief()), impact: v }))}
            />
            <Field
              label="Outcome expected"
              value={brief?.outcome ?? ""}
              onChange={(v) => setBrief((b) => ({ ...(b ?? emptyBrief()), outcome: v }))}
            />
            <Field
              label="Definition of Done (binary/measurable)"
              value={brief?.dod ?? ""}
              onChange={(v) => setBrief((b) => ({ ...(b ?? emptyBrief()), dod: v }))}
            />
            <Field
              label="Time boundary"
              value={brief?.timeBoundary ?? ""}
              onChange={(v) => setBrief((b) => ({ ...(b ?? emptyBrief()), timeBoundary: v }))}
            />
            <Field
              label="DRI"
              value={brief?.dri ?? ""}
              onChange={(v) => setBrief((b) => ({ ...(b ?? emptyBrief()), dri: v }))}
            />
            <Field
              label="Decider"
              value={brief?.decider ?? ""}
              onChange={(v) => setBrief((b) => ({ ...(b ?? emptyBrief()), decider: v }))}
            />
          </div>
        </MirrorCard>
      )}

      {stage === "break" && (
        <div className="space-y-4">
          <IssueTreeView tree={art?.issueTree ?? null} />
          <TaskTreeView tree={art?.taskTree ?? null} />
        </div>
      )}

      {stage === "plan" && (
        <MirrorCard className="p-5">
          <div className="text-[13px] font-semibold">Plan (stub)</div>
          <div className="mt-2 text-[13px] text-black/55">
            Next: assign owners, set due dates, and dependency links.
          </div>
          <div className="mt-4 rounded-[14px] border border-black/10 bg-white/70 p-4 text-[13px] text-black/70">
            <div>• Execution Plan: milestones</div>
            <div>• Ownership: DRI/Decider per task</div>
            <div>• Priority: Eisenhower → MoSCoW</div>
            <div>• Risks: mitigations + triggers</div>
          </div>
        </MirrorCard>
      )}

      {stage === "execute" && (
        <MirrorCard className="p-5">
          <div className="text-[13px] font-semibold">Execute (stub)</div>
          <div className="mt-2 text-[13px] text-black/55">
            Next: WORKLOG sessions + evidence links + block detection.
          </div>
        </MirrorCard>
      )}

      {stage === "case" && (
        <MirrorCard className="p-5">
          <div className="text-[13px] font-semibold">Case Brief (auto draft)</div>
          <pre className="mt-3 whitespace-pre-wrap text-[12.5px] leading-[1.35] text-black/70">
{art?.casePack?.caseBrief ?? "Generate by solving first."}
          </pre>
        </MirrorCard>
      )}

      {stage === "communicate" && (
        <MirrorCard className="p-5">
          <div className="text-[13px] font-semibold">Exec Pack</div>
          <div className="mt-3 space-y-3">
            <Block label="BLUF" text={art?.casePack?.bluf ?? ""} />
            <Block label="1-slide bullets" text={art?.casePack?.slide ?? ""} />
            <Block label="5-min script" text={art?.casePack?.script ?? ""} />
          </div>
        </MirrorCard>
      )}

      {stage === "close" && (
        <MirrorCard className="p-5">
          <div className="text-[13px] font-semibold">Close the Loop</div>
          <div className="mt-2 text-[13px] text-black/55">
            Next: review prompts → promote rules/templates.
          </div>
        </MirrorCard>
      )}
    </div>
  );
}

function label(s: StageId) {
  return (
    (s === "intake" && "Intake") ||
    (s === "define" && "Define") ||
    (s === "break" && "Break") ||
    (s === "plan" && "Plan") ||
    (s === "execute" && "Work") ||
    (s === "case" && "Build Case") ||
    (s === "communicate" && "Make Case") ||
    "Close"
  );
}

function emptyBrief(): ProblemBrief {
  return {
    statement: "",
    impact: "",
    outcome: "",
    dod: "",
    constraints: [],
    timeBoundary: "",
    dri: "",
    decider: "",
  };
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[12px] text-black/55">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-[14px] border border-black/10 bg-white/80 px-3 py-3 text-[13px] outline-none focus:border-black/20"
      />
    </div>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-[14px] border border-black/10 bg-white/70 p-4">
      <div className="text-[12px] text-black/55">{label}</div>
      <pre className="mt-2 whitespace-pre-wrap text-[12.5px] leading-[1.35] text-black/70">
{text || "—"}
      </pre>
    </div>
  );
}

