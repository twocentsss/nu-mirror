import { TaskRecord } from "@/components/TaskEditorModal";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, ChevronDown } from "lucide-react";

interface SingleLineTaskViewProps {
    tasks: TaskRecord[];
    selectedIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
    onTaskClick: (task: TaskRecord, e: React.MouseEvent) => void;
    onStepChange: (taskId: string, step: number) => Promise<void>;
    onStatusToggle: (task: TaskRecord) => Promise<void>;
    onDelete: (taskId: string) => Promise<void>;
}

export default function SingleLineTaskView({
    tasks,
    selectedIds,
    onSelectionChange,
    onTaskClick,
    onStepChange,
    onStatusToggle,
    onDelete
}: SingleLineTaskViewProps) {
    const [editingStep, setEditingStep] = useState<string | null>(null);

    const toggleSelection = (e: React.MouseEvent, id: string | undefined) => {
        e.stopPropagation();
        if (!id) return;
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onSelectionChange(next);
    };

    const handleStepClick = (e: React.MouseEvent, taskId: string | undefined) => {
        e.stopPropagation();
        if (!taskId) return;
        setEditingStep(taskId);
    };

    const handleStepSelect = async (taskId: string, step: number) => {
        await onStepChange(taskId, step);
        setEditingStep(null);
    };

    return (
        <div className="space-y-1">
            {/* Header Row */}
            {tasks.length > 0 && (
            <div className="relative flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 border-b border-white/5 mb-2 group">
              <ChevronDown className="absolute -top-3 right-2 text-[10px] opacity-0 transition-all duration-200 group-hover:opacity-100 text-white/40" />
                    <div
                        className="relative w-6 h-6 flex items-center justify-center cursor-pointer transition-all border border-white/10 rounded-md bg-white/5 hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
                        onClick={() => {
                            if (selectedIds.size === tasks.length) {
                                onSelectionChange(new Set());
                            } else {
                                onSelectionChange(new Set(tasks.map(t => t.id).filter(Boolean) as string[]));
                            }
                        }}
                    >
                        <div className={`w-4 h-4 rounded-md border transition-all flex items-center justify-center ${selectedIds.size === tasks.length && tasks.length > 0
                                ? "bg-white/20 border-white/40"
                                : "border-white/10"
                            }`}>
                            {selectedIds.size === tasks.length && tasks.length > 0 && <Check size={10} strokeWidth={4} />}
                            {selectedIds.size > 0 && selectedIds.size < tasks.length && <div className="w-1.5 h-1.5 bg-white/40 rounded-sm" />}
                        </div>
                    </div>
                    <div className="w-20 flex-shrink-0">Goal</div>
                    <div className="w-24 flex-shrink-0">Project</div>
                    <div className="flex-1">Title</div>
                    <div className="w-12 flex-shrink-0 text-center">Step</div>
                    <div className="w-12 flex-shrink-0 text-right pr-2">Done</div>
                </div>
            )}

            {tasks.map((task, index) => {
                const isSelected = task.id ? selectedIds.has(task.id) : false;
                const isDone = task.status === 'done';
                return (
                    <div
                        key={task.id || `task-${index}`}
                        onClick={(e) => {
                            // Only open editor if not clicking on UI controls
                            if ((e.target as HTMLElement).closest('button') ||
                                (e.target as HTMLElement).closest('.checkbox-area') ||
                                (e.target as HTMLElement).closest('.status-toggle') ||
                                (e.target as HTMLElement).closest('.quick-delete')) return;
                            onTaskClick(task, e);
                        }}
                        className={`group flex items-center gap-3 px-4 py-2 rounded-lg border transition-all cursor-pointer ${isSelected
                                ? "bg-white/10 border-white/20 shadow-lg"
                                : "hover:bg-[var(--glass-bg)] border-transparent hover:border-[var(--glass-border)]"
                            }`}
                    >
                        {/* Checkbox */}
            <div
                        className="checkbox-area relative w-6 h-6 flex items-center justify-center flex-shrink-0 border border-white/20 rounded-md bg-white/5 shadow-inner transition-all hover:border-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
                onClick={(e) => toggleSelection(e, task.id)}
            >
                <ChevronDown className="absolute -top-3 text-[8px] opacity-0 transition-all duration-200 group-hover:opacity-100 text-white/30" />
                <div className={`w-4 h-4 rounded-md border transition-all flex items-center justify-center ${isSelected
                                    ? "bg-white border-white text-black"
                                    : "border-white/20 group-hover:border-white/40"
                                }`}>
                                {isSelected && <Check size={10} strokeWidth={4} />}
                            </div>
                        </div>

                        {/* Goal */}
                        <div className="w-20 flex-shrink-0 text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] truncate pointer-events-none">
                            {task.goal || "—"}
                        </div>

                        {/* Project */}
                        <div className="w-24 flex-shrink-0 text-[10px] font-bold text-[var(--text-secondary)] truncate pointer-events-none opacity-60">
                            {task.project || "—"}
                        </div>

                        {/* Task Title */}
                        <div className={`flex-1 text-sm font-medium truncate min-w-0 pointer-events-none ${isDone ? 'line-through opacity-40' : 'text-[var(--text-primary)]'
                            }`}>
                            {task.title}
                        </div>

                        {/* Quick Delete (Visible on hover) */}
                        <div className="quick-delete opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); if (task.id) onDelete(task.id); }}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500/40 hover:text-red-500 transition-all"
                                title="Delete Task"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>

                        {/* Step Selector */}
                        <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <AnimatePresence>
                                {editingStep === task.id && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 bottom-full mb-2 z-[70] bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl p-1 w-32 overflow-hidden"
                                        onMouseLeave={() => setEditingStep(null)}
                                    >
                                        <div className="h-40 overflow-y-auto scrollbar-hide snap-y snap-mandatory relative">
                                            <div className="py-12">
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
                                                    <button
                                                        key={step}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStepSelect(task.id!, step);
                                                        }}
                                                        className={`w-full py-2 px-3 mb-1 rounded-xl transition-all snap-center flex items-center justify-between ${task.step === step
                                                            ? "bg-white text-black shadow-lg scale-[1.02]"
                                                            : "text-white/20 hover:text-white/40"
                                                            }`}
                                                    >
                                                        <span className="text-[10px] font-black uppercase tracking-wider">Step {step}</span>
                                                        {task.step === step && <Check size={10} />}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#1c1c1e] to-transparent pointer-events-none z-10" />
                                            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#1c1c1e] to-transparent pointer-events-none z-10" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <button
                                onClick={(e) => handleStepClick(e, task.id)}
                                className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${editingStep === task.id
                                        ? "bg-white text-black border-white shadow-lg"
                                        : "bg-white/5 text-white/30 border-white/5 hover:bg-white/10 hover:border-white/20"
                                    }`}
                            >
                                S{task.step || 1}
                            </button>
                        </div>

                        {/* Status Toggle */}
                        <div className="status-toggle w-6 h-6 flex-shrink-0 flex items-center justify-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); onStatusToggle(task); }}
                                className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center ${isDone
                                        ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                        : "border-white/20 hover:border-white/40"
                                    }`}
                            >
                                {isDone && <Check size={10} strokeWidth={4} />}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
