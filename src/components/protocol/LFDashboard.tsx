"use client";

import { motion } from "framer-motion";
import { ArrowRight, Target, Folder, Layers } from "lucide-react";

const LIFE_FOCI = [
    { id: 1, name: "Core", desc: "Soul, purpose, being", color: "bg-white" },
    { id: 2, name: "Self", desc: "Body, mind, heart", color: "bg-red-400" },
    { id: 3, name: "Circle", desc: "Family, friends, love", color: "bg-orange-400" },
    { id: 4, name: "Grind", desc: "Work, responsibilities", color: "bg-yellow-400" },
    { id: 5, name: "Level Up", desc: "Skills, growth, business", color: "bg-green-400" },
    { id: 6, name: "Impact", desc: "Giving back, community", color: "bg-emerald-400" },
    { id: 7, name: "Play", desc: "Joy, creativity, travel", color: "bg-cyan-400" },
    { id: 8, name: "Insight", desc: "Knowledge, wisdom", color: "bg-purple-400" },
    { id: 9, name: "Chaos", desc: "The unexpected (Constant)", color: "bg-pink-400" },
];

import { useState } from "react";
import { GoalBrainstormModal } from "./GoalBrainstormModal";
import { LFDetailModal } from "./LFDetailModal";

export function LFDashboard() {
    const [brainstormLf, setBrainstormLf] = useState<typeof LIFE_FOCI[0] | null>(null);
    const [detailLf, setDetailLf] = useState<typeof LIFE_FOCI[0] | null>(null);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-32">
                {LIFE_FOCI.map((lf, i) => (
                    <LFCard
                        key={lf.id}
                        lf={lf}
                        index={i}
                        onBrainstorm={() => setBrainstormLf(lf)}
                        onClick={() => setDetailLf(lf)}
                    />
                ))}
            </div>
            {brainstormLf && (
                <GoalBrainstormModal
                    isOpen={!!brainstormLf}
                    onClose={() => setBrainstormLf(null)}
                    lf={brainstormLf}
                />
            )}
            {detailLf && (
                <LFDetailModal
                    isOpen={!!detailLf}
                    onClose={() => setDetailLf(null)}
                    lf={detailLf}
                />
            )}
        </>
    );
}

function LFCard({ lf, index, onBrainstorm, onClick }: { lf: typeof LIFE_FOCI[0], index: number, onBrainstorm: () => void, onClick: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative p-6 rounded-3xl bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:bg-white/5 transition-all cursor-pointer"
            onClick={onClick}
        >
            <div className={`absolute top-0 right-0 w-24 h-24 ${lf.color} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity rounded-full -translate-y-8 translate-x-8`} />

            <div className="relative">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">World {lf.id}</span>
                    <div className={`w-2 h-2 rounded-full ${lf.color}`} />
                </div>

                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-1">{lf.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">{lf.desc}</p>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="p-3 rounded-2xl bg-black/5 border border-black/5 flex flex-col items-center">
                        <Target size={14} className="text-[var(--text-secondary)] mb-1" />
                        <span className="text-lg font-bold">0</span>
                        <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">Goals</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/5 border border-black/5 flex flex-col items-center">
                        <Folder size={14} className="text-[var(--text-secondary)] mb-1" />
                        <span className="text-lg font-bold">0</span>
                        <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">Projs</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/5 border border-black/5 flex flex-col items-center">
                        <Layers size={14} className="text-[var(--text-secondary)] mb-1" />
                        <span className="text-lg font-bold">0</span>
                        <span className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">Tasks</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                    <button
                        onClick={(e) => { e.stopPropagation(); onBrainstorm(); }}
                        className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Target size={14} /> Brainstorm Goals
                    </button>
                    <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-colors">
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
