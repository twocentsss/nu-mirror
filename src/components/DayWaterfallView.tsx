"use client";

import { motion } from "framer-motion";
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
            // Only count tasks that are "todo" or "doing" or "done" today
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#0a0a0a] overflow-hidden flex flex-col pt-32"
        >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Day Waterfall</h2>
                    <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Resource Ledger (Time)</p>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition"
                >
                    ✕
                </button>
            </div>

            <div className="flex-1 p-8 flex gap-8 items-center justify-center overflow-hidden relative">

                {/* The Tank (Main Visual) */}
                <div className="w-64 h-[600px] border-2 border-white/20 rounded-3xl relative overflow-hidden bg-white/5 backdrop-blur-sm shadow-2xl">

                    {/* Water (Free Time) */}
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.min(100, waterHeight)}%` }}
                        transition={{ type: "spring", damping: 20 }}
                        className="absolute top-0 left-0 right-0 bg-blue-500/20 backdrop-blur-md flex items-center justify-center border-b border-blue-400/30"
                    >
                        <span className="text-blue-200 font-bold text-lg drop-shadow-md">
                            {Math.floor(metrics.freeMin / 60)}h {metrics.freeMin % 60}m
                            <span className="block text-[10px] text-blue-300 uppercase tracking-wider text-center">Available</span>
                        </span>
                    </motion.div>

                    {/* Sand (Tasks) - Stacked from bottom */}
                    <div className="absolute bottom-0 left-0 right-0 flex flex-col-reverse justify-start">
                        {Object.entries(metrics.segments).map(([lf, mins]) => {
                            const lfId = Number(lf);
                            const world = WORLDS.find(w => w.id === lfId);
                            const pct = (mins / CAPACITY_MINUTES) * 100;
                            return (
                                <motion.div
                                    key={lf}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: `${pct}%`, opacity: 1 }}
                                    className={`w-full bg-gradient-to-r ${world?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center relative border-t border-black/20`}
                                    style={{ height: `${pct}%` }} // Fallback
                                >
                                    {mins > 20 && (
                                        <span className="text-white font-bold text-xs drop-shadow-md">
                                            {mins}m
                                        </span>
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>

                </div>

                {/* Legend / Stats */}
                <div className="flex flex-col gap-6 w-64">
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Accounting</h3>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/40">Capacity</span>
                            <span className="text-white font-mono">{AWAKE_HOURS}h 00m</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/40">Committed</span>
                            <span className="text-white font-mono">{Math.floor(metrics.committedMin / 60)}h {metrics.committedMin % 60}m</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                            <span className="text-blue-400">Net Float</span>
                            <span className="text-blue-400 font-mono">{Math.floor(metrics.freeMin / 60)}h {metrics.freeMin % 60}m</span>
                        </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Overdraft Alert */}
                    {metrics.overload > 0 && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-4 rounded-xl bg-red-500/10 border border-red-500/50"
                        >
                            <h4 className="text-red-400 font-bold text-sm uppercase tracking-wider mb-1">Warning: Overdraft</h4>
                            <p className="text-red-200/60 text-xs leading-relaxed">
                                You have committed to <strong>{metrics.overload}m</strong> more than your daily capacity. Consider deferring tasks.
                            </p>
                        </motion.div>
                    )}

                    {metrics.freeMin > 180 && metrics.overload === 0 && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-4 rounded-xl bg-green-500/10 border border-green-500/50"
                        >
                            <h4 className="text-green-400 font-bold text-sm uppercase tracking-wider mb-1">Flow State</h4>
                            <p className="text-green-200/60 text-xs leading-relaxed">
                                Healthy buffer available. Good day for deep work or spontaneity.
                            </p>
                        </motion.div>
                    )}

                </div>

            </div>
        </motion.div>
    );
}
