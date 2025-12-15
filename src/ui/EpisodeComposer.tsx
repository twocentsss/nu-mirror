"use client";

import { MirrorCard } from "@/ui/MirrorCard";

export type Lane = "TASK" | "EVENT" | "NOTE" | "MEMORY";
export type Complexity = "LOW" | "MEDIUM" | "HIGH";

export default function EpisodeComposer({
  raw,
  onRawChange,
  lane,
  onLaneChange,
  complexity,
  onComplexityChange,
  onSolve,
}: {
  raw: string;
  onRawChange: (v: string) => void;
  lane: Lane;
  onLaneChange: (v: Lane) => void;
  complexity: Complexity;
  onComplexityChange: (v: Complexity) => void;
  onSolve: () => void;
}) {
  return (
    <MirrorCard tilt={false} className="p-5">
      <div className="text-[13px] font-semibold">Episode</div>
      <div className="mt-1 text-[12px] text-black/55">
        Paste one line. The system routes + breaks deterministically.
      </div>

      <textarea
        value={raw}
        onChange={(e) => onRawChange(e.target.value)}
        placeholder="e.g., Fix p95 latency on activity ingest by Friday"
        rows={3}
        className="mt-3 w-full rounded-[14px] border border-black/10 bg-white/80 px-3 py-3 text-[13px] leading-[1.35] outline-none focus:border-black/20"
      />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {(["TASK", "EVENT", "NOTE", "MEMORY"] as Lane[]).map((x) => (
          <button
            key={x}
            className={[
              "tap px-4 py-2 rounded-full border text-[13px] font-medium backdrop-blur-[12px]",
              lane === x ? "border-black/15 bg-black/5" : "border-black/5 bg-white/60",
            ].join(" ")}
            onClick={() => onLaneChange(x)}
          >
            {x}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div className="text-[12px] text-black/55">Auto-break depth</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(["LOW", "MEDIUM", "HIGH"] as Complexity[]).map((c) => (
            <button
              key={c}
              className={[
                "tap rounded-[14px] border px-4 py-3 text-[13px] font-semibold",
                complexity === c ? "border-black/15 bg-black/5" : "border-black/10 bg-white/70",
              ].join(" ")}
              onClick={() => onComplexityChange(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <button
        className={[
          "tap mt-4 w-full rounded-[14px] px-4 py-3 text-[14px] font-semibold",
          raw.trim().length ? "bg-black text-white shadow-[0_20px_60px_rgba(0,0,0,0.16)]" : "bg-black/5 text-black/40 border border-black/10",
        ].join(" ")}
        disabled={!raw.trim().length}
        onClick={onSolve}
      >
        Solve this
      </button>
    </MirrorCard>
  );
}
