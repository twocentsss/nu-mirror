"use client";

import { motion } from "framer-motion";
import { TaskRecord, WORLDS } from "./TaskEditorModal";
import { useMemo } from "react";

/**
 * WorldGraphView
 * Visualizes the 9 Life Focus Worlds and the tasks that hang from them.
 * This is the "Mental Map" of your life.
 */

export function WorldGraphView({ tasks, onClose }: { tasks: TaskRecord[]; onClose: () => void }) {
    // Group tasks by LF
    const graph = useMemo(() => {
        const nodes = WORLDS.map(w => ({
            ...w,
            tasks: tasks.filter(t => t.lf === w.id)
        }));
        return nodes;
    }, [tasks]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-40 bg-[var(--app-bg)] overflow-hidden flex flex-col pt-24"
        >
            <div className="flex-1 overflow-y-auto p-6 md:p-12">
                <div className="max-w-7xl mx-auto space-y-16 pb-40">
                    {/* Vision Header */}
                    <header className="flex items-start justify-between">
                        <div className="space-y-6">
                            <p className="text-[14px] font-bold uppercase tracking-[0.6em] text-emerald-500">The World</p>
                            <h1 className="text-6xl md:text-8xl font-black text-[var(--text-primary)] tracking-tighter leading-none">
                                Your mental <br />map.
                            </h1>
                            <p className="text-2xl font-medium text-[var(--text-secondary)] italic">
                                9 worlds. Infinite intersections.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-6 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]/80 transition-all"
                        >
                            ✕
                        </button>
                    </header>

                    {/* The Grid of Worlds */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {graph.map((node, i) => (
                            <motion.div
                                key={node.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="group relative rounded-[2.5rem] p-10 bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:border-[var(--glass-border)]/20 hover:bg-[var(--glass-bg)]/80 transition-all duration-500 overflow-hidden"
                            >
                                {/* Node Label */}
                                <div className="absolute top-10 right-10 text-4xl font-black text-[var(--text-primary)]/5 pointer-events-none group-hover:text-[var(--text-primary)]/10 transition-colors">
                                    0{node.id}
                                </div>

                                <div className="space-y-8 relative z-10">
                                    <div className="space-y-2">
                                        <h3 className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${node.color} uppercase tracking-tighter`}>
                                            {node.name}
                                        </h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)]">
                                            {node.desc}
                                        </p>
                                    </div>

                                    {/* Task Hanging (The Edges) */}
                                    <div className="space-y-3">
                                        {node.tasks.length === 0 ? (
                                            <div className="py-4 border-b border-[var(--glass-border)]">
                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)]/20">Inactive World</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {node.tasks.map(task => (
                                                    <div
                                                        key={task.id}
                                                        className="flex items-center gap-4 py-2 border-b border-[var(--glass-border)] group/task cursor-pointer"
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${node.color} shadow-[0_0_10px_rgba(255,255,255,0.1)]`} />
                                                        <span className="text-sm font-bold text-[var(--text-secondary)] group-hover/task:text-[var(--text-primary)] transition-colors truncate">
                                                            {task.title}
                                                        </span>
                                                        {task.duration_min && (
                                                            <span className="ml-auto text-[10px] font-mono text-[var(--text-secondary)]/20">
                                                                {task.duration_min}m
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Central Stance Visualization (Background Decor) */}
                    <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-[0.03]">
                        <div className="w-[1200px] h-[1200px] rounded-full border border-white flex items-center justify-center">
                            <div className="w-[800px] h-[800px] rounded-full border border-white flex items-center justify-center">
                                <div className="w-[400px] h-[400px] rounded-full border border-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Jobs-ian Footer */}
            <footer className="p-12 mb-12 flex justify-center z-50">
                <button
                    onClick={onClose}
                    className="px-16 py-6 rounded-full bg-[var(--text-primary)] text-[var(--app-bg)] text-2xl font-black tracking-tight transition-all hover:scale-105 shadow-2xl"
                >
                    Return to Origin
                </button>
            </footer>
        </motion.div>
    );
}
