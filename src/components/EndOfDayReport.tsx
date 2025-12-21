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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-40 bg-[var(--app-bg)] overflow-hidden flex flex-col pt-24"
        >
            <div className="flex-1 overflow-y-auto p-6 md:p-12">
                <div className="max-w-4xl mx-auto space-y-16 pb-32">
                    {/* Vision Header */}
                    <header className="space-y-6">
                        <p className="text-[14px] font-bold uppercase tracking-[0.6em] text-purple-500">The Evidence</p>
                        <h1 className="text-6xl md:text-8xl font-black text-[var(--text-primary)] tracking-tighter leading-none">
                            Did your day <br />reconcile?
                        </h1>
                        <p className="text-2xl font-medium text-[var(--text-secondary)] italic">
                            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </header>

                    {/* Stance Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Net Float Card */}
                        <div className={`p-10 rounded-[3rem] bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-6 ${isOverdraft ? 'border-red-500/30' : 'border-emerald-500/30'}`}>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)]">Net Float</p>
                            <div className={`text-6xl font-black tracking-tighter ${deltaColor}`}>
                                {isOverdraft ? '-' : '+'}{Math.floor((isOverdraft ? (ledger.resources.time_committed - (16 * 60)) : ledger.resources.time_available) / 60)}h
                                {(isOverdraft ? (ledger.resources.time_committed - (16 * 60)) : ledger.resources.time_available) % 60}m
                            </div>
                            <p className="text-xl font-medium text-[var(--text-secondary)] leading-tight">
                                {isOverdraft
                                    ? "You spent more life than you had. The debt must be paid in rest."
                                    : "You banked your potential. Tomorrow begins with a surplus."}
                            </p>
                        </div>

                        {/* Velocity Card */}
                        <div className="p-10 rounded-[3rem] bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)]">Daily Velocity</p>
                            <div className="text-6xl font-black tracking-tighter text-[var(--text-primary)]">
                                {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%
                            </div>
                            <p className="text-xl font-medium text-[var(--text-secondary)] leading-tight">
                                {tasks.filter(t => t.status === 'done').length} of {tasks.length} intents cleared.
                            </p>
                        </div>
                    </div>

                    {/* The Matrix (Breakdown) */}
                    <section className="space-y-12">
                        <div className="space-y-4">
                            <h2 className="text-[14px] font-bold uppercase tracking-[0.5em] text-purple-500">The Allocation</h2>
                            <h3 className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">Where your soul went.</h3>
                        </div>

                        <div className="grid gap-4">
                            {Object.entries(ledger.allocation).map(([seg, min]) => {
                                if (min === 0) return null;
                                const pct = (min / ledger.resources.time_committed) * 100;
                                return (
                                    <div key={seg} className="group p-8 rounded-[2rem] bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-between gap-8 hover:bg-[var(--glass-bg)]/80 transition-all duration-500">
                                        <div className="w-32">
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] group-hover:text-purple-400/80 transition-colors">{seg}</span>
                                        </div>
                                        <div className="flex-1 h-1 bg-[var(--text-secondary)]/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                className="h-full bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                                            />
                                        </div>
                                        <div className="w-24 text-right">
                                            <span className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">{min}m</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    {/* Completed Tasks List */}
                    <section className="space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-[14px] font-bold uppercase tracking-[0.5em] text-emerald-500">Accomplishments</h2>
                            <h3 className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">What you completed.</h3>
                        </div>

                        <div className="grid gap-3">
                            {tasks.filter(t => t.status === 'done').length === 0 ? (
                                <div className="p-12 text-center rounded-[2rem] bg-[var(--glass-bg)] border border-[var(--glass-border)] opacity-40">
                                    <p className="text-xl text-[var(--text-secondary)] italic">No tasks completed yet today.</p>
                                </div>
                            ) : (
                                tasks.filter(t => t.status === 'done').map((task, i) => (
                                    <motion.div
                                        key={task.id ?? i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="p-6 rounded-2xl bg-[var(--glass-bg)] border border-emerald-500/20 flex items-center gap-4 group hover:border-emerald-500/40 transition-all"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-lg font-semibold text-[var(--text-primary)] truncate">{task.title || "Untitled Task"}</h4>
                                            {task.duration_min && (
                                                <p className="text-sm text-[var(--text-secondary)] mt-1">{task.duration_min} minutes</p>
                                            )}
                                        </div>
                                        {task.lf && (
                                            <div className="px-2 py-1 rounded text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                LF{task.lf}
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Provocations (Alerts) */}
                    {ledger.alerts.length > 0 && (
                        <section className="p-12 rounded-[4rem] bg-amber-500/5 border border-amber-500/20 space-y-8">
                            <h3 className="text-amber-500 text-[12px] font-black uppercase tracking-[0.5em]">The Provocations</h3>
                            <ul className="space-y-6">
                                {ledger.alerts.map((a, i) => (
                                    <li key={i} className="text-2xl font-medium text-amber-500/60 leading-tight italic">
                                        "{a}"
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Footer / Jobs-ian CTA */}
                    <footer className="pt-12 flex justify-center">
                        <button
                            onClick={onClose}
                            className="px-16 py-6 rounded-full bg-[var(--text-primary)] text-[var(--app-bg)] text-2xl font-black tracking-tight transition-all hover:scale-105 shadow-2xl"
                        >
                            Accept Reconcilliation
                        </button>
                    </footer>
                </div>
            </div>
        </motion.div>
    );
}
