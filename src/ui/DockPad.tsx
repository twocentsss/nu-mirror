"use client";

import Sheet from "@/ui/Sheet";
import { MirrorCard } from "@/ui/MirrorCard";

export type DockActionId =
  | "chat"
  | "solve"
  | "capture"
  | "calendar"
  | "reports"
  | "comics"
  | "story"
  | "agents"
  | "settings";

export default function DockPad({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (id: DockActionId) => void;
}) {
  const items: { id: DockActionId; label: string; sub?: string }[] = [
    { id: "chat", label: "Chat", sub: "Ask Nu" },
    { id: "solve", label: "Solve", sub: "Auto-break" },
    { id: "capture", label: "Capture", sub: "Quick note" },

    { id: "calendar", label: "Calendar", sub: "Plan day" },
    { id: "reports", label: "Reports", sub: "Weekly" },
    { id: "comics", label: "Comics", sub: "Panels" },

    { id: "story", label: "Story", sub: "Beats" },
    { id: "agents", label: "Agents", sub: "Run flows" },
    { id: "settings", label: "Settings", sub: "Prefs" },
  ];

  return (
    <Sheet open={open} onClose={onClose} title="Launcher">
      <div className="space-y-4">
        <div className="text-[12px] text-black/55">3×3 keypad launcher (future-proof).</div>

        <div className="grid grid-cols-3 gap-3">
          {items.map((it) => (
            <button
              key={it.id}
              className="tap"
              onClick={() => onPick(it.id)}
            >
              <MirrorCard tilt className="p-4 text-left">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13px] font-semibold">{it.label}</div>
                  <div className="h-8 w-8 rounded-full bg-black/5 border border-black/5 flex items-center justify-center">
                    <DotIcon />
                  </div>
                </div>
                {it.sub && <div className="mt-2 text-[12px] text-black/55">{it.sub}</div>}
              </MirrorCard>
            </button>
          ))}
        </div>

        <button
          className="tap w-full rounded-[14px] border border-black/10 bg-white/70 px-4 py-3 text-[13px]"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </Sheet>
  );
}

function DotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="2.2" fill="rgba(0,0,0,0.55)" />
    </svg>
  );
}
