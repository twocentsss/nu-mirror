"use client";

import { useState } from "react";
import TaskMenu from "@/ui/TaskMenu";
import TaskRow from "@/ui/TaskRow";
import { scoreSingleTask, scoreAllTasks } from "@/lib/actions/scoring";
import { MirrorCard } from "@/ui/MirrorCard";

const INITIAL_TASKS = [
    { id: "1", title: "Write Nu Protocol Spec", status: "todo" },
    { id: "2", title: "Refactor BottomNav", status: "done" },
    { id: "3", title: "Buy groceries", status: "todo" },
];

export default function TestScoringPage() {
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev]);

    const handleScoreSingle = async (taskId: string, title: string) => {
        addLog(`Scoring task: ${title}...`);
        const result = await scoreSingleTask(taskId, title);
        addLog(`✅ Task "${title}" Scored: SPS=${result.sps.toFixed(2)}`);
    };

    const handleScoreAll = async () => {
        addLog(`Bulk rescoring ${tasks.length} tasks...`);
        await scoreAllTasks(tasks);
        addLog(`✅ Bulk Rescore Complete.`);
    };

    return (
        <div className="p-4 space-y-6 max-w-lg mx-auto pb-40">
            <div className="mb-4">
                <h1 className="text-3xl font-black mb-1">Scoring UI Test</h1>
                <p className="text-gray-500">Verify single and bulk scoring actions.</p>
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
                        note={`ID: ${task.id}`}
                        onClick={() => addLog(`Clicked row: ${task.title}`)}
                        onScore={() => handleScoreSingle(task.id, task.title)}
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
