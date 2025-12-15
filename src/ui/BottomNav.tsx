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
                <Item tab="todo" label="To-do" href="/todo" icon={<IconList active={active === "todo"} />} />
              </div>
              <div className="flex justify-center">
                <Item tab="today" label="Today" href="/today" icon={<IconSun active={active === "today"} />} />
              </div>

              <div className="flex justify-center">
                <div className="h-12 w-12" />
              </div>

              <div className="flex justify-center">
                <Item tab="focus" label="Focus" href="/focus" icon={<IconTimer active={active === "focus"} />} />
              </div>
              <div className="flex justify-center">
                <Item tab="me" label="Me" href="/me" icon={<IconUser active={active === "me"} />} />
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
function IconList({ active }: { active: boolean }) {
  const c = active ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.45)";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M8 6h13M8 12h13M8 18h13" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" stroke={c} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
function IconSun({ active }: { active: boolean }) {
  const c = active ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.45)";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" stroke={c} strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M5 19l1.4-1.4"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconTimer({ active }: { active: boolean }) {
  const c = active ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.45)";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M10 2h4" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14l2-2" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 22a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke={c} strokeWidth="2" />
    </svg>
  );
}
function IconUser({ active }: { active: boolean }) {
  const c = active ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.45)";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke={c} strokeWidth="2" />
      <path d="M20 22a8 8 0 0 0-16 0" stroke={c} strokeWidth="2" strokeLinecap="round" />
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
