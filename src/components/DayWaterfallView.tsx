"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TaskRecord, WORLDS } from "./TaskEditorModal";
import { useMemo } from "react";

/**
 * DayWaterfallView
 * Visualizes the 24h day as a container of finite capacity.
 * "Rocks" (Fixed), "Sand" (Tasks), "Water" (Free Time).
 */

export function DayWaterfallView({ tasks, onClose }: { tasks: TaskRecord[]; onClose: () => void }) {

    // Calculate Capacity
    const TOTAL_MINUTES = 24 * 60;
    const AWAKE_HOURS = 16;
    const CAPACITY_MINUTES = AWAKE_HOURS * 60;

    const metrics = useMemo(() => {
        let committedMin = 0;

        // Group tasks by category for the stacked bar
        const segments: Record<number, number> = {};

        tasks.forEach(t => {
            const duration = t.duration_min || 15;
            committedMin += duration;

            const lf = t.lf || 9;
            segments[lf] = (segments[lf] || 0) + duration;
        });

        const freeMin = Math.max(0, CAPACITY_MINUTES - committedMin);
        const overload = Math.max(0, committedMin - CAPACITY_MINUTES);

        return { committedMin, freeMin, overload, segments };
    }, [tasks]);

    const waterHeight = (metrics.freeMin / CAPACITY_MINUTES) * 100;
    const sandHeight = (metrics.committedMin / CAPACITY_MINUTES) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-40 bg-[var(--app-bg)] overflow-hidden flex flex-col pt-24"
        >
            <div className="flex-1 overflow-y-auto p-6 md:p-12">
                <div className="max-w-6xl mx-auto space-y-16 pb-32">
                    {/* Vision Header */}
                    <header className="flex items-start justify-between">
                        <div className="space-y-6">
                            <p className="text-[14px] font-bold uppercase tracking-[0.6em] text-amber-500">Flow</p>
                            <h1 className="text-6xl md:text-8xl font-black text-[var(--text-primary)] tracking-tighter leading-none">
                                Your daily <br />energy.
                            </h1>
                            <p className="text-2xl font-medium text-[var(--text-secondary)] italic">
                                16 hours awake. Spend it well.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-6 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]/80 transition-all"
                        >
                            ✕
                        </button>
                    </header>

                    <div className="grid lg:grid-cols-[1fr_300px] gap-20 items-center">
                        {/* The Instrument (The Tank) */}
                        <div className="relative flex justify-center">
                            <div className="w-full max-w-md h-[550px] bg-[var(--glass-bg)] rounded-[4rem] border border-[var(--glass-border)] relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl">
                                {/* Water (Free Time / Surplus) */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.min(100, waterHeight)}%` }}
                                    className="absolute top-0 left-0 right-0 bg-blue-500/10 border-b border-blue-500/20 flex flex-col items-center justify-center space-y-2"
                                >
                                    <span className="text-4xl font-black text-blue-400 tracking-tighter">
                                        {Math.floor(metrics.freeMin / 60)}h {metrics.freeMin % 60}m
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400/60">Free</span>
                                </motion.div>

                                {/* The Allocation Stack (Committed Time) */}
                                <div className="absolute bottom-0 left-0 right-0 flex flex-col-reverse">
                                    {Object.entries(metrics.segments).map(([lf, mins]) => {
                                        const world = WORLDS.find(w => w.id === Number(lf));
                                        const pct = (mins / CAPACITY_MINUTES) * 100;
                                        return (
                                            <motion.div
                                                key={lf}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${pct}%` }}
                                                className={`w-full bg-gradient-to-r ${world?.color || 'from-zinc-700 to-zinc-800'} border-t border-black/20 flex items-center justify-center overflow-hidden group`}
                                            >
                                                {pct > 5 && (
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {world?.name || 'Other'} ({mins}m)
                                                    </span>
                                                )}
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Decorative Scales */}
                            <div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-between py-10 text-[10px] font-black text-white/20 uppercase tracking-widest">
                                <span>100%</span>
                                <span>75%</span>
                                <span>50%</span>
                                <span>25%</span>
                                <span>0%</span>
                            </div>
                        </div>

                        {/* Accounting Side Panel */}
                        <div className="space-y-12">
                            <div className="space-y-8">
                                <h3 className="text-[14px] font-bold uppercase tracking-[0.5em] text-amber-500">Summary</h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest">Total Energy</span>
                                        <span className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">{AWAKE_HOURS}h 00m</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest">Busy</span>
                                        <span className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">{Math.floor(metrics.committedMin / 60)}h {metrics.committedMin % 60}m</span>
                                    </div>
                                    <div className="h-px bg-[var(--glass-border)]" />
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold text-amber-500 uppercase tracking-widest">Net Flow</span>
                                        <span className={`text-4xl font-black tracking-tighter ${metrics.overload > 0 ? 'text-rose-500' : 'text-blue-400'}`}>
                                            {metrics.overload > 0 ? `-${metrics.overload}m` : `+${Math.floor(metrics.freeMin / 60)}h ${metrics.freeMin % 60}m`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Warnings / Insights */}
                            <AnimatePresence>
                                {metrics.overload > 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-8 rounded-[2.5rem] bg-rose-500/5 border border-rose-500/20 space-y-4"
                                    >
                                        <h4 className="text-rose-500 font-black uppercase tracking-widest text-[10px]">Overdraft Alert</h4>
                                        <p className="text-lg font-medium text-rose-200/60 leading-tight italic">
                                            "You have committed to more than human reality allows. Something will fail. Choose what it is now, before the day decides for you."
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-8 rounded-[2.5rem] bg-blue-500/5 border border-blue-500/20 space-y-4"
                                    >
                                        <h4 className="text-blue-400 font-black uppercase tracking-widest text-[10px]">Flow Stability</h4>
                                        <p className="text-lg font-medium text-blue-200/60 leading-tight italic">
                                            "Your schedule has air. Spontaneity and deep work are possible. Protect this surplus."
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={onClose}
                                className="w-full py-6 rounded-full bg-[var(--text-primary)] text-[var(--app-bg)] text-xl font-black tracking-tight transition-all hover:scale-[1.02] shadow-2xl mt-8"
                            >
                                Calibrate Schedule
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
