"use client";

export type TimeOfDay = "ANYTIME" | "MORNING" | "DAY" | "EVENING";

export default function TimeOfDayChip({
  value,
  selected,
  onClick,
}: {
  value: TimeOfDay;
  selected?: boolean;
  onClick?: () => void;
}) {
  const label =
    value === "ANYTIME"
      ? "Anytime"
      : value === "MORNING"
      ? "Morning"
      : value === "DAY"
      ? "Day"
      : "Evening";

  const tint =
    value === "ANYTIME"
      ? "bg-black/5"
      : value === "MORNING"
      ? "bg-amber-200/60"
      : value === "DAY"
      ? "bg-sky-200/60"
      : "bg-violet-200/60";

  return (
    <button
      className={[
        "tap px-4 py-2 rounded-full border text-[13px] font-medium",
        "backdrop-blur-[12px]",
        selected ? "border-black/15" : "border-black/5",
        selected ? "shadow-[0_10px_30px_rgba(0,0,0,0.08)]" : "shadow-[0_10px_30px_rgba(0,0,0,0.04)]",
        tint,
      ].join(" ")}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
