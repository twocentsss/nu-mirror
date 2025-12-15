"use client";

import { useMemo, useState } from "react";
import TaskMenu from "@/ui/TaskMenu";
import { MirrorCard } from "@/ui/MirrorCard";
import TaskRow from "@/ui/TaskRow";
import Sheet from "@/ui/Sheet";

type P = "HIGH" | "MEDIUM" | "LOW";

export default function TodoPage() {
  const [openSection, setOpenSection] = useState<Record<P, boolean>>({
    HIGH: true,
    MEDIUM: true,
    LOW: true,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");

  const data = useMemo(
    () => ({
      HIGH: [
        { title: "Pay credit card", note: "2 min • Anytime" },
        { title: "Send the email", note: "10 min • Morning" },
      ],
      MEDIUM: [
        { title: "Grocery list", note: "15 min • Day" },
        { title: "Laundry", note: "30 min • Evening" },
      ],
      LOW: [{ title: "Read 10 pages", note: "10 min • Evening" }],
    }),
    [],
  );

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
              onClick={() => {
                setEditTitle("");
                setEditOpen(true);
              }}
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
                onClick={() => {
                  setEditTitle(t.title);
                  setEditOpen(true);
                }}
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
        onAdd={() => {
          setEditTitle("");
          setEditOpen(true);
        }}
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
          <div className="text-[12px] text-black/55">Task</div>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Enter task…"
            className="w-full rounded-[14px] border border-black/10 bg-white/80 px-3 py-3 text-[14px] outline-none focus:border-black/20"
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
      <path d="M12 5v14M5 12h14" stroke="rgba(0,0,0,0.6)" strokeWidth="2" strokeLinecap="round" />
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
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 160ms" }}
    >
      <path d="M6 9l6 6 6-6" stroke="rgba(0,0,0,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
