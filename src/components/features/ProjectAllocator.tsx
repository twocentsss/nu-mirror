"use client";

import { useEffect, useState } from "react";
import { Folder, Plus, Loader2 } from "lucide-react";

type Project = {
    project_id: string;
    title: string;
    description: string;
    goal_title: string;
    lf_id: number;
};

export function ProjectAllocator({ onAddTask }: { onAddTask: (p: Project) => void }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/cogos/projects/list")
            .then(res => res.json())
            .then(data => {
                if (data.ok) setProjects(data.projects);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>;

    if (projects.length === 0) return (
        <div className="p-6 rounded-2xl bg-gray-50 border border-[var(--glass-border)] text-center">
            <p className="text-gray-400 text-sm">No active projects found.</p>
            <p className="text-xs text-gray-300 mt-1">Go to Protocol tab to brainstorm.</p>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest pl-1">
                    Active Projects ({projects.length})
                </h3>
            </div>

            <div className="grid gap-3">
                {projects.map(p => (
                    <div key={p.project_id} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between group">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-bold text-gray-500 uppercase">LF{p.lf_id}</span>
                                <span className="text-[10px] text-gray-400 truncate max-w-[150px]">{p.goal_title}</span>
                            </div>
                            <h4 className="font-bold text-gray-800">{p.title}</h4>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.description}</p>
                        </div>
                        <button
                            onClick={() => onAddTask(p)}
                            className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
