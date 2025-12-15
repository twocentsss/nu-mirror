"use client";

import { useState } from "react";
import DockPad, { DockActionId } from "@/ui/DockPad";

type Active = "todo" | "today" | "focus" | "me";

export default function BottomNav({
  active,
  onNavigate,
}: {
  active: Active;
  onNavigate: (to: string | "chat") => void;
}) {
  const [padOpen, setPadOpen] = useState(false);

  const Item = ({
    tab,
    label,
    icon,
    href,
  }: {
    tab: Active;
    label: string;
    icon: React.ReactNode;
    href: string;
  }) => {
    const isActive = active === tab;
    return (
      <button
        className="tap flex flex-col items-center justify-center gap-1 px-2 py-2"
        onClick={() => onNavigate(href)}
      >
        <div
          className={[
            "h-10 w-10 rounded-full flex items-center justify-center",
            isActive ? "bg-black/6 shadow-[0_12px_32px_rgba(0,0,0,0.10)]" : "bg-transparent",
          ].join(" ")}
        >
          {icon}
        </div>
        <div className={["text-[11px]", isActive ? "text-black/80" : "text-black/45"].join(" ")}>
          {label}
        </div>
      </button>
    );
  };

  function handlePick(id: DockActionId) {
    if (id === "chat") onNavigate("chat");
    else if (id === "solve") onNavigate("/solve");
    else alert(`${id} (wire later)`);
  }

  return (
    <>
      <DockPad
        open={padOpen}
        onClose={() => setPadOpen(false)}
        onPick={(id) => {
          handlePick(id);
          setPadOpen(false);
        }}
      />

      <div className="fixed inset-x-0 bottom-0 z-30 safe-bottom">
        <div className="mx-auto w-full max-w-[520px] px-4 pb-3">
          <div
            className={[
              "relative rounded-[26px]",
              "bg-white/72 backdrop-blur-[22px]",
              "border border-black/5",
              "shadow-[0_24px_70px_rgba(0,0,0,0.12)]",
              "px-4 py-2",
            ].join(" ")}
          >
            <div className="grid grid-cols-5 items-center">
              <div className="flex justify-center">
                <Item tab="todo" label="To-do" href="/todo" icon={<IconCheckSquare active={active === "todo"} />} />
              </div>
              <div className="flex justify-center">
                <Item tab="today" label="Today" href="/today" icon={<IconCalendar active={active === "today"} />} />
              </div>

              <div className="flex justify-center">
                <div className="h-12 w-12" />
              </div>

              <div className="flex justify-center">
                <Item tab="focus" label="Focus" href="/focus" icon={<IconFocus active={active === "focus"} />} />
              </div>
              <div className="flex justify-center">
                <Item tab="me" label="Me" href="/me" icon={<IconFace active={active === "me"} />} />
              </div>
            </div>

            {/* Center launcher button */}
            <button
              className={[
                "tap absolute left-1/2 -top-7 -translate-x-1/2",
                "h-16 w-16 rounded-full",
                "bg-white/80 backdrop-blur-[22px]",
                "border border-black/5",
                "shadow-[0_26px_80px_rgba(0,0,0,0.16)]",
                "flex items-center justify-center",
                "transition-transform active:scale-[0.98]",
              ].join(" ")}
              onClick={() => setPadOpen(true)}
              aria-label="Open launcher"
            >
              <div className="h-12 w-12 rounded-full bg-black/5 border border-black/5 flex items-center justify-center">
                <IconGrid9 />
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* icons */
/* icons */
function IconCheckSquare({ active }: { active: boolean }) {
  const c = active ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.45)";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke={c} strokeWidth="2.0" />
      <path d="M8 12l2.5 2.5L16 9" stroke={c} strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCalendar({ active }: { active: boolean }) {
  const c = active ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.45)";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="4" stroke={c} strokeWidth="2" />
      <path d="M8 2v4M16 2v4M3 10h18" stroke={c} strokeWidth="2" />
      <path d="M10 14h2v4h-2M10 14l-1 1" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconFocus({ active }: { active: boolean }) {
  const c = active ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.45)";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2" strokeOpacity="0.3" />
      <path d="M12 3a9 9 0 0 1 6.36 15.36L12 12" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconFace({ active }: { active: boolean }) {
  const c = active ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.45)";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2" />
      <path d="M9 10h.01M15 10h.01" stroke={c} strokeWidth="3" strokeLinecap="round" />
      <path d="M9.5 15a3.5 3.5 0 0 0 5 0" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconGrid9() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <g fill="rgba(0,0,0,0.65)">
        <circle cx="7" cy="7" r="1.4" />
        <circle cx="12" cy="7" r="1.4" />
        <circle cx="17" cy="7" r="1.4" />
        <circle cx="7" cy="12" r="1.4" />
        <circle cx="12" cy="12" r="1.4" />
        <circle cx="17" cy="12" r="1.4" />
        <circle cx="7" cy="17" r="1.4" />
        <circle cx="12" cy="17" r="1.4" />
        <circle cx="17" cy="17" r="1.4" />
      </g>
    </svg>
  );
}
