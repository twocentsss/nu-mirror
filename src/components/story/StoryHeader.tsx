"use client";

import { Sparkles, LayoutList } from "lucide-react";

export type StoryViewMode = "FEED" | "STUDIO";

interface StoryHeaderProps {
    mode: StoryViewMode;
    setMode: (m: StoryViewMode) => void;
}

export function StoryHeader({ mode, setMode }: StoryHeaderProps) {
    return (
        <div className="flex items-center gap-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full p-1 w-fit">
            <button
                onClick={() => setMode("FEED")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${mode === "FEED"
                        ? "bg-black text-white shadow-md"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
            >
                <LayoutList size={14} />
                Feed
            </button>
            <button
                onClick={() => setMode("STUDIO")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${mode === "STUDIO"
                        ? "bg-[var(--accent-color)] text-white shadow-md"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
            >
                <Sparkles size={14} />
                Studio
            </button>
        </div>
    );
}
