"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Save, Loader2, Target, Folder } from "lucide-react";

interface EntityEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void; // Callback to refresh parent list
    type: "goal" | "project";
    parentId: number | string; // lfId (number) for goal, goalId (string) for project
}

export function EntityEditorModal({ isOpen, onClose, onSave, type, parentId }: EntityEditorModalProps) {
    const [title, setTitle] = useState("");
    const [rationale, setRationale] = useState(""); // Description for project
    const [dueDate, setDueDate] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Auto-set defaults on open
    useEffect(() => {
        if (isOpen) {
            setTitle("");
            setRationale("");

            const today = new Date();
            let targetDate = new Date();

            if (type === "goal") {
                // End of Quarter
                const currentMonth = today.getMonth();
                const endMonth = Math.floor(currentMonth / 3) * 3 + 2;
                targetDate = new Date(today.getFullYear(), endMonth + 1, 0);
            } else {
                // End of Month
                targetDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            }
            // Add timezone offset correction manually or simple string manip to avoid day shift
            // Ideally: Date inputs expect YYYY-MM-DD.
            const yyyy = targetDate.getFullYear();
            const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
            const dd = String(targetDate.getDate()).padStart(2, '0');
            setDueDate(`${yyyy}-${mm}-${dd}`);
        }
    }, [isOpen, type]);

    const handleSave = async () => {
        if (!title.trim()) return;
        setIsSaving(true);

        try {
            const url = type === "goal"
                ? "/api/cogos/goals/add"
                : "/api/cogos/projects/create";

            const payload = type === "goal"
                ? { title, rationale, lfId: parentId, dueDate }
                : { title, description: rationale, goalId: parentId, dueDate };

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save");

            onSave();
            onClose();
        } catch (e: any) {
            alert("Error saving: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const isGoal = type === "goal";
    const accentColor = isGoal ? "text-yellow-400" : "text-cyan-400";
    const bgAccent = isGoal ? "bg-yellow-500" : "bg-cyan-500";
    const borderAccent = isGoal ? "border-yellow-500/20" : "border-cyan-500/20";

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative w-full max-w-lg bg-[#0A0A0A] border ${borderAccent} rounded-2xl shadow-xl overflow-hidden`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-white/5 ${accentColor}`}>
                                    {isGoal ? <Target size={20} /> : <Folder size={20} />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Create New {isGoal ? "Goal" : "Project"}</h2>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        {isGoal ? "Set a high-level target" : "Define a concrete undertaking"}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)]">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1 block">Title</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={isGoal ? "e.g. Master React Native" : "e.g. Build MVP App"}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-medium outline-none focus:border-white/30 transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1 block">Target Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-colors pl-10"
                                        />
                                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                    </div>
                                    <p className="text-[10px] text-[var(--text-secondary)] mt-1 ml-1">
                                        * Defaults to End of {isGoal ? "Quarter" : "Month"}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1 block">
                                    {isGoal ? "Rationale (Why?)" : "Description (What?)"}
                                </label>
                                <textarea
                                    value={rationale}
                                    onChange={(e) => setRationale(e.target.value)}
                                    rows={3}
                                    placeholder={isGoal ? "Why is this important now?" : "Briefly describe the scope."}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-colors resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !title.trim()}
                                className={`px-6 py-2 rounded-xl text-sm font-bold text-black shadow-lg flex items-center gap-2 transition-all ${isSaving || !title.trim() ? "opacity-50 cursor-not-allowed" : "hover:brightness-110"} ${bgAccent}`}
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save {isGoal ? "Goal" : "Project"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
