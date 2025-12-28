"use client";

import { useMemo, useState } from "react";
import Sheet from "@/ui/Sheet";
import { MirrorCard } from "@/ui/MirrorCard";

export default function FloatingChat({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [text, setText] = useState("");

  const actions = useMemo(
    () => [
      { label: "Add task", hint: "“Buy groceries tomorrow morning”" },
      { label: "Plan my day", hint: "“Schedule tasks around meetings”" },
      { label: "Generate report", hint: "“Weekly summary”" },
      { label: "Make a comic", hint: "“Turn today into panels”" },
    ],
    [],
  );

  return (
    <Sheet
      open={open}
      onClose={() => onOpenChange(false)}
      title="Alfred Chat"
    >
      <div className="space-y-4">
        <MirrorCard tilt={false} className="p-4">
          <div className="text-[12px] text-black/55 mb-2">
            Ask Alfred anything. (Tasks, planning, reports, comics…)
          </div>
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type here…"
              className="w-full rounded-[14px] border border-black/10 bg-white/80 px-3 py-3 text-[14px] outline-none focus:border-black/20"
            />
            <button
              className="tap rounded-[14px] px-4 py-3 bg-black text-white text-[13px] shadow-[0_10px_30px_rgba(0,0,0,0.16)]"
              onClick={() => {
                // placeholder: later route to MCP/LLM action
                setText("");
                onOpenChange(false);
              }}
            >
              Send
            </button>
          </div>
        </MirrorCard>

        <div className="grid grid-cols-2 gap-3">
          {actions.map((a) => (
            <button
              key={a.label}
              className="tap"
              onClick={() => {
                setText(a.hint);
              }}
            >
              <MirrorCard tilt className="p-4 text-left">
                <div className="text-[13px] font-semibold">{a.label}</div>
                <div className="mt-1 text-[12px] text-black/55">{a.hint}</div>
              </MirrorCard>
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
