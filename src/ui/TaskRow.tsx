"use client";

import type { ReactNode } from "react";

export default function TaskRow({
  title,
  note,
  right,
  onClick,
  onScore,
}: {
  title: string;
  note?: string;
  right?: ReactNode;
  onClick?: () => void;
  onScore?: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="relative w-full text-left group">
      <div
        className="flex items-center justify-between gap-3 px-4 py-4 cursor-pointer tap"
        onClick={onClick}
      >
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-[var(--text-primary)] truncate">{title}</div>
          {note && <div className="mt-1 text-[12px] text-[var(--text-secondary)]">{note}</div>}
        </div>

        <div className="flex items-center gap-2">
          {onScore && (
            <button
              className="h-8 w-8 rounded-full bg-transparent hover:bg-black/5 flex items-center justify-center transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onScore(e);
              }}
              title="Score Task"
            >
              <TargetIcon />
            </button>
          )}

          {right ?? (
            <div className="h-10 w-10 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center">
              <Chevron />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TargetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-500">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
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
