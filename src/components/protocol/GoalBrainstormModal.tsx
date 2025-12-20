"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Check, Loader2, ArrowRight } from "lucide-react";

type GeneratedGoal = {
    title: string;
    rationale: string;
    projects: { title: string; description: string }[];
};

export function GoalBrainstormModal({
    isOpen,
    onClose,
    lf,
}: {
    isOpen: boolean;
    onClose: () => void;
    lf: { id: number; name: string; desc: string; color: string };
}) {
    const [context, setContext] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [generatedGoals, setGeneratedGoals] = useState<GeneratedGoal[]>([]);
    const [selectedGoals, setSelectedGoals] = useState<Set<number>>(new Set());

    const handleGenerate = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        try {
            const res = await fetch("/api/cogos/goals/generate", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    lfName: lf.name,
                    lfDesc: lf.desc,
                    context,
                }),
            });
            const data = await res.json();
            if (data.ok && Array.isArray(data.goals)) {
                setGeneratedGoals(data.goals);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to generate ideas. Try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleGoal = (idx: number) => {
        const next = new Set(selectedGoals);
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        setSelectedGoals(next);
    };

    const handleAdopt = async () => {
        setIsSaving(true);
        try {
            const adopted = generatedGoals.filter((_, i) => selectedGoals.has(i));

            const res = await fetch("/api/cogos/goals/create", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    lfId: lf.id,
                    goals: adopted
                }),
            });

            if (!res.ok) throw new Error("Failed to save goals");

            alert(`Successfully adopted ${adopted.length} Goals!`);
            onClose();
            setGeneratedGoals([]);
            setContext("");
            setSelectedGoals(new Set());
        } catch (e) {
            console.error(e);
            alert("Error saving goals. Check console.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#1c1c1e] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative z-10 max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className={`p-6 border-b border-white/5 bg-gradient-to-r ${lf.color.replace('bg-', 'from-').replace('400', '500/20')} to-transparent`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                <Sparkles size={24} className="text-yellow-400" />
                                Brainstorm: {lf.name}
                            </h2>
                            <p className="text-white/60 text-sm mt-1">{lf.desc}</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {generatedGoals.length === 0 ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Context (Optional)</label>
                                <textarea
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    placeholder={`e.g. "I want to take my ${lf.name.toLowerCase()} to the next level..."`}
                                    className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none"
                                />
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                {isGenerating ? "Consulting Oracle..." : "Generate Ideas"}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">Proposed Strategy</h3>
                                <button onClick={() => setGeneratedGoals([])} className="text-xs text-[var(--text-secondary)] hover:text-white hover:underline">Reset</button>
                            </div>

                            {generatedGoals.map((goal, i) => {
                                const isSelected = selectedGoals.has(i);
                                return (
                                    <div
                                        key={i}
                                        onClick={() => toggleGoal(i)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-white/10 border-white/40' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-[var(--accent-color)] border-[var(--accent-color)]' : 'border-white/30'}`}>
                                                {isSelected && <Check size={12} className="text-white" />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold text-white leading-tight">{goal.title}</h4>
                                                <p className="text-xs text-[var(--text-secondary)] mt-1 mb-3">{goal.rationale}</p>

                                                <div className="space-y-2 pl-4 border-l-2 border-white/5">
                                                    {goal.projects.map((proj, pi) => (
                                                        <div key={pi} className="text-sm">
                                                            <span className="text-white/80 font-medium opacity-80">{proj.title}</span>
                                                            <span className="text-white/40 mx-2">—</span>
                                                            <span className="text-white/40 italic">{proj.description}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {generatedGoals.length > 0 && (
                    <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end">
                        <button
                            onClick={handleAdopt}
                            disabled={selectedGoals.size === 0 || isSaving}
                            className="px-8 py-3 rounded-full bg-white text-black font-bold hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : <ArrowRight size={16} />}
                            {isSaving ? "Saving..." : "Adopt Selected"}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
