"use client";

import { LayoutGrid, List, Clock } from "lucide-react";

export type TaskViewMode = "compact" | "single-line" | "timeline";

interface ViewSelectorProps {
    view: TaskViewMode;
    onChange: (view: TaskViewMode) => void;
}

export default function ViewSelector({ view, onChange }: ViewSelectorProps) {
    return (
        <div className="flex items-center gap-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full p-1">
            <button
                onClick={() => onChange("compact")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${view === "compact"
                    ? "bg-white text-black shadow-md"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                title="Compact Card View"
            >
                <LayoutGrid size={14} />
                Card
            </button>
            <button
                onClick={() => onChange("single-line")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${view === "single-line"
                    ? "bg-white text-black shadow-md"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                title="Single Line View"
            >
                <List size={14} />
                Line
            </button>
            <button
                onClick={() => onChange("timeline")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${view === "timeline"
                    ? "bg-white text-black shadow-md"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                title="Timeline View"
            >
                <Clock size={14} />
                Timeline
            </button>
        </div>
    );
}
