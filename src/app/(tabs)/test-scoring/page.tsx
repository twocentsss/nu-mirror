"use client";

import { useState } from "react";
import TaskMenu from "@/ui/TaskMenu";
import TaskRow from "@/ui/TaskRow";
import { scoreSingleTask, scoreAllTasks } from "@/lib/actions/scoring";
import { MirrorCard } from "@/ui/MirrorCard";

const INITIAL_TASKS = [
    { id: "1", title: "Write Nu Protocol Spec", status: "todo", duration_min: 120, lf: 4 }, // Deep Work
    { id: "2", title: "Refactor BottomNav", status: "done", duration_min: 60, lf: 4 }, // Deep Work
    { id: "3", title: "Buy groceries", status: "todo", duration_min: 45, lf: 9 }, // Chore
];

export default function TestScoringPage() {
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev]);

    const handleScoreSingle = async (task: typeof INITIAL_TASKS[0]) => {
        addLog(`Scoring task: ${task.title} (LF${task.lf}, ${task.duration_min}m)...`);
        const result = await scoreSingleTask({
            id: task.id,
            title: task.title,
            status: task.status,
            duration_min: task.duration_min,
            lf: task.lf
        });
        addLog(`✅ Task "${task.title}" Scored: SPS=${result.sps.toFixed(2)} (A:${result.accountCode})`);
    };

    const handleScoreAll = async () => {
        addLog(`Bulk rescoring ${tasks.length} tasks...`);
        // We map our simple mock tasks to the ScoringInput shape
        const inputs = tasks.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            duration_min: t.duration_min,
            lf: t.lf
        }));
        await scoreAllTasks(inputs);
        addLog(`✅ Bulk Rescore Complete.`);
    };

    return (
        <div className="p-4 space-y-6 max-w-lg mx-auto pb-40">
            <div className="mb-4">
                <h1 className="text-3xl font-black mb-1">Scoring UI Test</h1>
                <p className="text-gray-500">Verify single and bulk scoring actions with Account Logic.</p>
            </div>

            <TaskMenu
                title="Tasks"
                subtitle="3 items"
                onRescoreAll={handleScoreAll}
            />

            <div className="space-y-2 mt-4">
                {tasks.map(task => (
                    <TaskRow
                        key={task.id}
                        title={task.title}
                        note={`LF${task.lf} • ${task.duration_min}m • ${task.status}`}
                        onClick={() => addLog(`Clicked row: ${task.title}`)}
                        onScore={() => handleScoreSingle(task)}
                    />
                ))}
            </div>

            <div className="mt-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Action Logs
                </h3>
                <MirrorCard className="bg-black/5 p-4 min-h-[150px] font-mono text-xs overflow-y-auto max-h-[200px]">
                    {logs.length === 0 ? (
                        <div className="text-gray-400 italic">No actions yet.</div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="mb-1 border-b border-black/5 pb-1 last:border-0">
                                {log}
                            </div>
                        ))
                    )}
                </MirrorCard>
            </div>
        </div>
    );
}
