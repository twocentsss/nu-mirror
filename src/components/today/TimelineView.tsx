"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TaskRecord } from '@/components/TaskEditorModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight, Clock } from 'lucide-react';
import { format, parseISO, startOfDay, addMinutes, isWithinInterval, isValid, differenceInMinutes } from 'date-fns';

interface TimelineViewProps {
    tasks: TaskRecord[];
    onTaskClick: (task: TaskRecord, e: React.MouseEvent) => void;
    onAddTask: (time: Date, duration: number) => void;
    baseDate?: Date; // Use the globally selected date from the store
}

type TimeScale = 15 | 30 | 60 | 120 | 180;

export default function TimelineView({ tasks, onTaskClick, onAddTask, baseDate = new Date() }: TimelineViewProps) {
    const [scale, setScale] = useState<TimeScale>(30);
    const containerRef = useRef<HTMLDivElement>(null);

    // Slots Generation: Strictly deterministic based on baseDate and scale
    const { slots, allDayTasks } = useMemo(() => {
        const dayStart = startOfDay(baseDate);
        const slotsArray: any[] = [];
        const totalMinutes = 24 * 60;

        // 1. Process Timed Tasks
        const timedTasks = tasks.map(t => {
            const dateStr = t.time?.due_date || "";
            const d = parseISO(dateStr);
            return {
                ...t,
                startAt: isValid(d) ? d : null,
                isTimed: isValid(d) && dateStr.includes(':') // Must have a time component
            };
        });

        const activeTimed = timedTasks.filter(t => t.isTimed);
        const floaters = timedTasks.filter(t => !t.isTimed);

        // 2. Iterate through segments
        for (let min = 0; min < totalMinutes; min += scale) {
            const slotStart = addMinutes(dayStart, min);
            const slotEnd = addMinutes(dayStart, min + scale);

            // Find tasks starting in this exact time-slice
            const tasksInSlot = activeTimed.filter(t => {
                const taskTime = t.startAt!;
                return taskTime >= slotStart && taskTime < slotEnd;
            });

            slotsArray.push({
                time: slotStart,
                tasks: tasksInSlot,
                isEmpty: tasksInSlot.length === 0
            });
        }

        return { slots: slotsArray, allDayTasks: floaters };
    }, [tasks, scale, baseDate]);

    return (
        <div ref={containerRef} className="flex flex-col gap-6 w-full pb-32">
            {/* Precision Grid Header */}
            <div className="px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Precision</span>
                    <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                        {[15, 30, 60, 120, 180].map((s) => (
                            <button
                                key={s}
                                onClick={() => setScale(s as TimeScale)}
                                className={`px-2.5 py-1 rounded-full text-[9px] font-black transition-all ${scale === s ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"}`}
                            >
                                {s >= 60 ? `${s / 60}h` : `${s}m`}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/5 text-white/20">
                    <Clock size={10} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{format(baseDate, 'MMM d, yyyy')}</span>
                </div>
            </div>

            {/* Floaters Section (Tasks without time) */}
            {allDayTasks.length > 0 && (
                <div className="px-6 space-y-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/10">Anytime Today</span>
                    <div className="flex flex-wrap gap-2">
                        {allDayTasks.map(t => (
                            <button
                                key={t.id ?? t.title}
                                onClick={(e) => onTaskClick(t, e)}
                                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-white/40 hover:text-white transition-all shadow-sm"
                            >
                                {t.title || "Untitled"}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* The Grid */}
            <div className="relative pl-14 pr-4">
                <div className="absolute left-[52px] top-0 bottom-0 w-px bg-white/10" />

                <div className="flex flex-col">
                    {slots.map((slot, idx) => (
                        <div key={slot.time.getTime()} className="relative group flex items-start py-4 border-b border-white/[0.02]">
                            {/* Time Label (Clean Numeric Style) */}
                            <div className="absolute -left-14 w-12 text-right pr-4 flex flex-col items-end pt-0.5">
                                <span className={`text-[10px] font-black tabular-nums text-white/90`}>
                                    {format(slot.time, 'H.mm')}
                                </span>
                            </div>

                            {/* Node */}
                            <div className="absolute left-[47.5px] top-[21.5px] w-2.5 h-2.5 rounded-full border border-white/20 bg-[#0a0a0a] z-10 transition-colors group-hover:border-white/50" />

                            {/* Content */}
                            <div className="flex-1 ml-6 pl-2 min-h-[30px]">
                                {slot.isEmpty ? (
                                    <button
                                        onClick={() => onAddTask(slot.time, scale)}
                                        className="opacity-0 group-hover:opacity-100 transition-all flex items-center h-full w-full py-1 text-[9px] font-black uppercase tracking-widest text-white/10 hover:text-white/40"
                                    >
                                        <Plus size={12} className="mr-3" strokeWidth={3} />
                                        <span>Add to {format(slot.time, 'h:mm a')}</span>
                                    </button>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {slot.tasks.map((task: TaskRecord) => (
                                            <motion.div
                                                key={task.id}
                                                initial={{ opacity: 0, x: 2 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                onClick={(e) => onTaskClick(task, e)}
                                                className="glass-card rounded-xl p-3 border border-white/5 hover:border-white/20 transition-all cursor-pointer group/card flex items-center justify-between"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <h3 className={`text-xs font-black tracking-tight ${task.status === 'done' ? 'line-through opacity-30' : 'text-white'}`}>
                                                        {task.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[8px] font-black text-white/10 uppercase">{task.duration_min || scale}M</span>
                                                        {task.project && (
                                                            <span className="text-[8px] font-bold text-white/5 uppercase truncate">/ {task.project}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight size={12} className="text-white/5 group-hover/card:text-white/20" />
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
