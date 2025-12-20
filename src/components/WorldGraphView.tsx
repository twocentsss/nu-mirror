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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#0a0a0a] overflow-hidden flex flex-col pt-32"
        >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-md z-50">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">World Graph</h2>
                    <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Your Life Context</p>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition"
                >
                    ✕
                </button>
            </div>

            {/* The Graph Canvas */}
            <div className="flex-1 overflow-auto p-8 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                    {graph.map((node, i) => (
                        <motion.div
                            key={node.id}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`relative group rounded-3xl p-6 border border-white/5 bg-gradient-to-br ${node.color.replace('from-', 'from-').replace('to-', 'to-').split(' ')[0]}/5 hover:bg-white/5 transition-all`}
                        >
                            {/* Node Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${node.color} uppercase tracking-tighter`}>
                                        {node.name}
                                    </h3>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mt-1">
                                        {node.desc}
                                    </p>
                                </div>
                                <div className="text-4xl font-black text-white/5 absolute top-4 right-6 pointer-events-none">
                                    0{node.id}
                                </div>
                            </div>

                            {/* Connected Tasks (Edges) */}
                            <div className="space-y-3 relative z-10">
                                {node.tasks.length === 0 && (
                                    <div className="p-4 rounded-xl border border-dashed border-white/5 text-center">
                                        <span className="text-[10px] text-white/20 uppercase">Void</span>
                                    </div>
                                )}
                                {node.tasks.map(task => (
                                    <motion.div
                                        key={task.id}
                                        layoutId={`task-${task.id}`}
                                        className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 cursor-pointer flex items-center gap-3 group/task backdrop-blur-sm"
                                    >
                                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${node.color}`} />
                                        <span className="text-sm font-medium text-white/80 group-hover/task:text-white truncate">
                                            {task.title}
                                        </span>
                                        {task.duration_min && (
                                            <span className="ml-auto text-[10px] text-white/30 font-mono">
                                                {task.duration_min}m
                                            </span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Decorative Connections */}
                            <div className="absolute top-1/2 -left-4 w-4 h-px bg-white/5 hidden lg:block" />
                            <div className="absolute top-1/2 -right-4 w-4 h-px bg-white/5 hidden lg:block" />

                        </motion.div>
                    ))}
                </div>

                {/* Central Hub Visualization (Background) */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
                    <div className="w-[800px] h-[800px] rounded-full border border-white/20" />
                    <div className="absolute w-[600px] h-[600px] rounded-full border border-white/10" />
                    <div className="absolute w-[400px] h-[400px] rounded-full border border-white/5" />
                </div>
            </div>
        </motion.div>
    );
}
