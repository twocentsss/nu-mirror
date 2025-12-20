"use client";

import { TaskRecord } from "@/components/TaskEditorModal";
import { useState } from "react";
import { motion } from "framer-motion";

interface SingleLineTaskViewProps {
    tasks: TaskRecord[];
    onTaskClick: (task: TaskRecord) => void;
    onStepChange: (taskId: string, step: number) => Promise<void>;
}

export default function SingleLineTaskView({ tasks, onTaskClick, onStepChange }: SingleLineTaskViewProps) {
    const [editingStep, setEditingStep] = useState<string | null>(null);

    const handleStepClick = (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        setEditingStep(taskId);
    };

    const handleStepSelect = async (taskId: string, step: number) => {
        await onStepChange(taskId, step);
        setEditingStep(null);
    };

    return (
        <div className="space-y-1">
            {tasks.map((task, index) => (
                <div
                    key={task.id || `task-${index}`}
                    onClick={(e) => {
                        // Only open editor if not clicking on button elements
                        if ((e.target as HTMLElement).tagName === 'BUTTON') return;
                        onTaskClick(task);
                    }}
                    className="group flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[var(--glass-bg)] border border-transparent hover:border-[var(--glass-border)] cursor-pointer transition-all"
                >
                    {/* Goal */}
                    <div className="w-20 flex-shrink-0 text-xs font-medium text-[var(--text-secondary)] truncate pointer-events-none">
                        {task.goal || "—"}
                    </div>

                    {/* Project */}
                    <div className="w-24 flex-shrink-0 text-xs font-medium text-[var(--text-secondary)] truncate pointer-events-none">
                        {task.project || "—"}
                    </div>

                    {/* Task Title */}
                    <div className="flex-1 text-sm font-medium text-[var(--text-primary)] truncate min-w-0 pointer-events-none">
                        {task.title}
                    </div>

                    {/* Step Selector */}
                    <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {editingStep === task.id ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute right-0 top-0 z-10 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg shadow-xl p-2 grid grid-cols-5 gap-1"
                                onMouseLeave={() => setEditingStep(null)}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
                                    <button
                                        key={step}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStepSelect(task.id!, step);
                                        }}
                                        className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${task.step === step
                                            ? "bg-[var(--accent-color)] text-white"
                                            : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
                                            }`}
                                    >
                                        {step}
                                    </button>
                                ))}
                            </motion.div>
                        ) : (
                            <button
                                onClick={(e) => handleStepClick(e, task.id!)}
                                className="px-2 py-1 rounded-md text-xs font-bold bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 transition-all border border-transparent hover:border-[var(--text-primary)]/20"
                            >
                                Step {task.step || 1}
                            </button>
                        )}
                    </div>

                    {/* Status Indicator */}
                    <div className="w-16 flex-shrink-0 text-right pointer-events-none">
                        <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${task.status === "done"
                                ? "bg-green-500/20 text-green-400"
                                : task.status === "doing"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-gray-500/20 text-gray-400"
                                }`}
                        >
                            {task.status}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
