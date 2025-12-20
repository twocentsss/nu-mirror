"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, MessageSquarePlus } from "lucide-react";

export type ProtocolMode = "DASHBOARD" | "RANT";

export function ProtocolHeader({
    mode,
    setMode
}: {
    mode: ProtocolMode;
    setMode: (m: ProtocolMode) => void;
}) {
    return (
        <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex bg-[var(--glass-bg)] rounded-full p-1 border border-[var(--glass-border)] backdrop-blur-md">
                <button
                    onClick={() => setMode("DASHBOARD")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${mode === "DASHBOARD"
                            ? "bg-black text-white shadow-md"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5"
                        }`}
                >
                    <LayoutDashboard size={14} />
                    Dashboard
                </button>
                <button
                    onClick={() => setMode("RANT")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${mode === "RANT"
                            ? "bg-black text-white shadow-md"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5"
                        }`}
                >
                    <MessageSquarePlus size={14} />
                    Rant
                </button>
            </div>
        </div>
    );
}
