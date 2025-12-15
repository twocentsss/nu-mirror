"use client";

import type { ReactNode } from "react";

export default function TaskRow({
  title,
  note,
  right,
  onClick,
}: {
  title: string;
  note?: string;
  right?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      className="tap w-full text-left"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold truncate">{title}</div>
          {note && <div className="mt-1 text-[12px] text-black/50">{note}</div>}
        </div>
        {right ?? (
          <div className="h-10 w-10 rounded-full bg-black/5 border border-black/5 flex items-center justify-center">
            <Chevron />
          </div>
        )}
      </div>
    </button>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 6l6 6-6 6"
        stroke="rgba(0,0,0,0.45)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
