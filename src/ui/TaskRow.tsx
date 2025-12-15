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
          <div className="text-[15px] font-semibold text-[var(--text-primary)] truncate">{title}</div>
          {note && <div className="mt-1 text-[12px] text-[var(--text-secondary)]">{note}</div>}
        </div>
        {right ?? (
          <div className="h-10 w-10 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center">
            <Chevron />
          </div>
        )}
      </div>
    </button>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[var(--text-secondary)]">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
