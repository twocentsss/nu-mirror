"use client";

export type StageId =
  | "intake"
  | "define"
  | "break"
  | "plan"
  | "execute"
  | "case"
  | "communicate"
  | "close";

export default function StageRail({
  value,
  onChange,
  status,
}: {
  value: StageId;
  onChange: (v: StageId) => void;
  status: Record<StageId, boolean>;
}) {
  const stages: { id: StageId; label: string }[] = [
    { id: "intake", label: "Intake" },
    { id: "define", label: "Define" },
    { id: "break", label: "Break" },
    { id: "plan", label: "Plan" },
    { id: "execute", label: "Work" },
    { id: "case", label: "Case" },
    { id: "communicate", label: "Make" },
    { id: "close", label: "Close" },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {stages.map((s) => {
        const selected = s.id === value;
        const done = status[s.id];
        return (
          <button
            key={s.id}
            className={[
              "tap flex items-center gap-2 px-4 py-2 rounded-full border text-[13px] font-semibold",
              selected ? "border-black/15 bg-black/5" : "border-black/5 bg-white/60",
            ].join(" ")}
            onClick={() => onChange(s.id)}
          >
            <Dot done={done} />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

function Dot({ done }: { done: boolean }) {
  return (
    <span
      className={[
        "inline-block h-2.5 w-2.5 rounded-full",
        done ? "bg-black/55" : "bg-black/15",
      ].join(" ")}
    />
  );
}
