"use client";

import { useMemo, useState } from "react";
import TaskMenu from "@/ui/TaskMenu";
import { MirrorCard } from "@/ui/MirrorCard";
import TaskRow from "@/ui/TaskRow";
import TimeOfDayChip, { TimeOfDay } from "@/ui/TimeOfDayChip";

export default function TodayPage() {
  const [selected, setSelected] = useState<TimeOfDay | "ALL">("ALL");

  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(undefined, { weekday: "long" });
  }, []);

  const groups = useMemo(
    () => ({
      ANYTIME: [{ title: "Pay credit card", note: "2 min" }],
      MORNING: [{ title: "Send the email", note: "10 min" }],
      DAY: [{ title: "Grocery run", note: "30 min" }],
      EVENING: [{ title: "Read 10 pages", note: "10 min" }],
    }),
    [],
  );

  const chips: TimeOfDay[] = ["ANYTIME", "MORNING", "DAY", "EVENING"];

  function Group({ k, label }: { k: TimeOfDay; label: string }) {
    if (selected !== "ALL" && selected !== k) return null;
    return (
      <MirrorCard className="overflow-hidden">
        <div className="px-4 pt-4 pb-2 text-[13px] font-semibold text-black/60">
          {label}
        </div>
        <div className="divide-y divide-black/5">
          {groups[k].map((t) => (
            <TaskRow key={t.title} title={t.title} note={t.note} onClick={() => {}} />
          ))}
        </div>
      </MirrorCard>
    );
  }

  return (
    <div className="space-y-5">
      <TaskMenu
        title={today}
        subtitle="Today’s flow"
        onFilter={() => alert("Filter (later)")}
        onAdd={() => alert("Add task (later)")}
      />

      <div className="flex gap-2 overflow-x-auto pb-1 pt-2">
        <button
          className={[
            "tap px-4 py-2 rounded-full border text-[13px] font-medium backdrop-blur-[12px]",
            selected === "ALL" ? "border-black/15 bg-black/5" : "border-black/5 bg-white/60",
          ].join(" ")}
          onClick={() => setSelected("ALL")}
        >
          All
        </button>
        {chips.map((c) => (
          <TimeOfDayChip
            key={c}
            value={c}
            selected={selected === c}
            onClick={() => setSelected(c)}
          />
        ))}
      </div>

      <div className="space-y-4">
        <Group k="ANYTIME" label="Anytime" />
        <Group k="MORNING" label="Morning" />
        <Group k="DAY" label="Day" />
        <Group k="EVENING" label="Evening" />
      </div>
    </div>
  );
}
