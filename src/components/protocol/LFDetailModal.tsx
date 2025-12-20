"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Folder, Plus, Trash2, Calendar, ChevronRight, Loader2 } from "lucide-react";
import { EntityEditorModal } from "./EntityEditorModal";

interface LFDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    lf: { id: number; name: string; desc: string; color: string };
}

type Project = {
    project_id: string;
    title: string;
    description?: string;
    due_date?: string;
    created_at: string;
};

type Goal = {
    goal_id: string;
    title: string;
    rationale?: string;
    due_date?: string;
    projects: Project[];
    created_at: string;
};

export function LFDetailModal({ isOpen, onClose, lf }: LFDetailModalProps) {
    const [hierarchy, setHierarchy] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);

    // Editor State
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorType, setEditorType] = useState<"goal" | "project">("goal");
    const [editorParentId, setEditorParentId] = useState<number | string>(lf.id);

    const fetchHierarchy = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/cogos/hierarchy?lfId=${lf.id}`);
            const data = await res.json();
            if (data.hierarchy) {
                setHierarchy(data.hierarchy);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchHierarchy();
        }
    }, [isOpen, lf.id]);

    const handleDelete = async (type: "goal" | "project", id: string) => {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

        try {
            await fetch("/api/cogos/entities/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, id })
            });
            fetchHierarchy();
        } catch (e) {
            alert("Delete failed");
        }
    };

    const openEditor = (type: "goal" | "project", parentId: number | string) => {
        setEditorType(type);
        setEditorParentId(parentId);
        setEditorOpen(true);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="relative w-full max-w-4xl h-[80vh] bg-[#0A0A0A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className={`p-8 ${lf.color} text-black`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-4xl font-black mb-2">{lf.name}</h2>
                                    <p className="text-black/70 font-medium">{lf.desc}</p>
                                </div>
                                <button onClick={onClose} className="p-2 bg-black/10 rounded-full hover:bg-black/20 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                            <h3 className="font-bold text-[var(--text-secondary)] uppercase text-xs tracking-widest pl-2">Active Targets</h3>
                            <button
                                onClick={() => openEditor("goal", lf.id)}
                                className="px-4 py-2 bg-[var(--text-primary)] text-black rounded-xl text-xs font-bold hover:brightness-110 flex items-center gap-2"
                            >
                                <Plus size={14} /> New Goal
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {loading ? (
                                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[var(--text-secondary)]" /></div>
                            ) : hierarchy.length === 0 ? (
                                <div className="text-center p-10 text-[var(--text-secondary)]">No goals found. Start brainstorming!</div>
                            ) : (
                                hierarchy.map(goal => (
                                    <div key={goal.goal_id} className="relative pl-4 border-l-2 border-yellow-500/20">
                                        {/* Goal Row */}
                                        <div className="group flex items-start justify-between mb-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Target size={16} className="text-yellow-500" />
                                                    <h4 className="text-lg font-bold text-white leading-tight">{goal.title}</h4>
                                                </div>
                                                {goal.rationale && <p className="text-sm text-[var(--text-secondary)] max-w-xl">{goal.rationale}</p>}
                                                {goal.due_date && (
                                                    <div className="flex items-center gap-1 text-[10px] text-yellow-500/70 font-mono">
                                                        <Calendar size={10} />
                                                        {new Date(goal.due_date).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditor("project", goal.goal_id)}
                                                    className="p-1.5 rounded-lg hover:bg-white/10 text-cyan-400" title="Add Project"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete("goal", goal.goal_id)}
                                                    className="p-1.5 rounded-lg hover:bg-white/10 text-red-400" title="Delete Goal"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Projects Grid */}
                                        {goal.projects.length > 0 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 pl-6">
                                                {goal.projects.map(proj => (
                                                    <div key={proj.project_id} className="group/proj p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-colors relative">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2 text-cyan-400">
                                                                <Folder size={14} />
                                                                <span className="text-xs font-bold uppercase tracking-wider">Project</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDelete("project", proj.project_id)}
                                                                className="opacity-0 group-hover/proj:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                        <h5 className="font-bold text-white mb-1 pr-4">{proj.title}</h5>
                                                        {proj.due_date && (
                                                            <div className="text-[10px] text-[var(--text-secondary)] font-mono">
                                                                Due: {new Date(proj.due_date).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Editor Trigger */}
                    <EntityEditorModal
                        isOpen={editorOpen}
                        onClose={() => setEditorOpen(false)}
                        onSave={fetchHierarchy}
                        type={editorType}
                        parentId={editorParentId}
                    />
                </div>
            )}
        </AnimatePresence>
    );
}
