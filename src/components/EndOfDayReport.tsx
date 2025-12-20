"use client";

import { useMemo } from "react";
import { TaskRecord } from "./TaskEditorModal";
import { calculateDayLedger } from "@/lib/ledger/analysis";
import { motion } from "framer-motion";

export function EndOfDayReport({ tasks, date, onClose }: { tasks: TaskRecord[], date: Date, onClose: () => void }) {

    const ledger = useMemo(() => {
        return calculateDayLedger(date.toISOString(), tasks);
    }, [tasks, date]);

    const isOverdraft = ledger.resources.time_available === 0;
    const deltaColor = isOverdraft ? "text-red-500" : "text-green-500";

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-40 bg-[#0a0a0a] flex items-center justify-center p-4 lg:p-12 pt-32"
        >
            <div className="w-full max-w-2xl bg-[#1c1c1e] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-full">

                {/* Header */}
                <div className="p-8 border-b border-white/5 bg-white/5">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Daily Reconciliation</p>
                    <h2 className="text-3xl font-black text-white tracking-tight">End of Day Report</h2>
                    <p className="text-white/60 mt-1">{date.toDateString()}</p>
                </div>

                {/* content */}
                <div className="p-8 overflow-y-auto space-y-8">

                    {/* Top Line Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-6 rounded-2xl bg-white/5 border border-white/5 ${isOverdraft ? 'bg-red-500/5 border-red-500/20' : ''}`}>
                            <p className="text-xs uppercase tracking-widest font-bold opacity-50">Net Float</p>
                            <div className={`text-3xl font-bold mt-1 ${deltaColor}`}>
                                {isOverdraft ? '-' : '+'}{Math.floor((isOverdraft ? (ledger.resources.time_committed - (16 * 60)) : ledger.resources.time_available) / 60)}h
                                {(isOverdraft ? (ledger.resources.time_committed - (16 * 60)) : ledger.resources.time_available) % 60}m
                            </div>
                            <p className="text-xs opacity-40 mt-2">
                                {isOverdraft ? "You exceeded capacity." : "Time remaining/banked."}
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                            <p className="text-xs uppercase tracking-widest font-bold opacity-50">Tasks Cleared</p>
                            <div className="text-3xl font-bold mt-1 text-white">
                                {tasks.filter(t => t.status === 'done').length} <span className="text-lg opacity-40">/ {tasks.length}</span>
                            </div>
                            <p className="text-xs opacity-40 mt-2">Completion Rate</p>
                        </div>
                    </div>

                    {/* Segment Breakdown */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Resource Allocation</h3>
                        <div className="space-y-3">
                            {Object.entries(ledger.allocation).map(([seg, min]) => {
                                if (min === 0) return null;
                                const pct = (min / ledger.resources.time_committed) * 100;
                                return (
                                    <div key={seg} className="flex items-center gap-4">
                                        <div className="w-20 text-xs font-bold uppercase text-white/60 text-right">{seg}</div>
                                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-white/80 rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="w-16 text-xs font-mono text-white/40 text-right">{min}m</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* AI Insight / Alerts */}
                    {ledger.alerts.length > 0 && (
                        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <h3 className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-2">Observations</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {ledger.alerts.map((a, i) => (
                                    <li key={i} className="text-orange-200/80 text-sm">{a}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-white/3 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 rounded-full bg-white text-black font-bold text-sm hover:scale-105 transition-transform"
                    >
                        Close Day
                    </button>
                </div>

            </div>
        </motion.div>
    );
}
