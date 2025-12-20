"use client";

import { useState, useCallback, useMemo } from "react";
import { TaskRecord } from "@/components/TaskEditorModal";
import { Loader2, Check, PenTool, LayoutTemplate, Box, Zap, Sparkles, Brain, Heart, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type StudioMode = "AUDIT" | "CREATIVE";

export default function StoryStudio({ onGenerate }: { onGenerate: () => void }) {
    const [mode, setMode] = useState<StudioMode>("AUDIT");

    // --- AUDIT STATE ---
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [tasks, setTasks] = useState<TaskRecord[]>([]);
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [period, setPeriod] = useState<"day" | "sprint">("day");

    // --- CREATIVE STATE ---
    const [framework, setFramework] = useState("pixar");
    const [character, setCharacter] = useState("");
    const [setting, setSetting] = useState("");

    // --- GEN STATE ---
    const [isGenerating, setIsGenerating] = useState(false);

    // Fetch Tasks for Audit
    const fetchTasks = async (p: "day" | "sprint") => {
        setLoadingTasks(true);
        // Simple range calc (Day = Today, Sprint = Last 14 days)
        const end = new Date();
        const start = new Date();
        if (p === "day") start.setHours(0, 0, 0, 0);
        if (p === "sprint") start.setDate(start.getDate() - 14);

        try {
            const qs = new URLSearchParams({
                start: start.toISOString().slice(0, 10),
                end: end.toISOString().slice(0, 10)
            });
            const res = await fetch(`/api/cogos/task/list?${qs}`);
            const j = await res.json();
            if (j.tasks) setTasks(j.tasks);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingTasks(false);
        }
    };

    // Trigger initial fetch on load or period change
    useMemo(() => {
        fetchTasks(period);
        setSelectedTasks([]);
    }, [period]);

    const toggleTask = (id: string) => {
        if (selectedTasks.includes(id)) {
            setSelectedTasks(selectedTasks.filter(t => t !== id));
        } else {
            setSelectedTasks([...selectedTasks, id]);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            let body: any = {};

            if (mode === "AUDIT") {
                body = {
                    mode: "feature", // Feature mode supports arbitrary taskIds now
                    taskIds: selectedTasks,
                    // If no tasks selected, maybe fallback to period? 
                    // Let's enforce selection or default to period.
                    period: period
                };
                if (selectedTasks.length === 0) {
                    body.mode = "period"; // Fallback to full period story
                }
            } else {
                body = {
                    mode: "creative",
                    creativeParams: {
                        framework,
                        character,
                        setting
                    }
                };
            }

            const res = await fetch("/api/story/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                onGenerate();
                // Reset optional fields
                setCharacter("");
                setSetting("");
                setSelectedTasks([]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="mt-6">
            {/* Studio Toggle */}
            <div className="flex gap-4 mb-6 border-b border-[var(--glass-border)] pb-2">
                <button
                    onClick={() => setMode("AUDIT")}
                    className={`text-sm font-bold pb-2 border-b-2 transition-all ${mode === "AUDIT" ? "border-[var(--text-primary)] text-[var(--text-primary)]" : "border-transparent text-[var(--text-secondary)]"}`}
                >
                    Audit Mode (Tasks)
                </button>
                <button
                    onClick={() => setMode("CREATIVE")}
                    className={`text-sm font-bold pb-2 border-b-2 transition-all ${mode === "CREATIVE" ? "border-[var(--accent-color)] text-[var(--accent-color)]" : "border-transparent text-[var(--text-secondary)]"}`}
                >
                    Creative Mode (Free)
                </button>
            </div>

            <AnimatePresence mode="wait">
                {mode === "AUDIT" ? (
                    <motion.div
                        key="audit"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                    >
                        {/* Period Filter */}
                        <div className="flex gap-2">
                            {(["day", "sprint"] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${period === p ? "bg-[var(--glass-bg)] border border-[var(--text-primary)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] border border-transparent hover:bg-[var(--glass-bg)]"}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        {/* Task List */}
                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                            {loadingTasks && <div className="text-center py-8 text-xs text-[var(--text-secondary)]"><Loader2 className="animate-spin inline mr-2" /> Fetching ledger...</div>}

                            {!loadingTasks && tasks.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => toggleTask(t.id!)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${selectedTasks.includes(t.id!) ? "bg-[var(--accent-color)]/10 border-[var(--accent-color)]" : "bg-[var(--glass-bg)] border-[var(--glass-border)] hover:border-[var(--text-primary)]/30"}`}
                                >
                                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${selectedTasks.includes(t.id!) ? "bg-[var(--accent-color)] border-[var(--accent-color)]" : "border-[var(--text-secondary)]"}`}>
                                        {selectedTasks.includes(t.id!) && <Check size={10} className="text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate text-[var(--text-primary)]">{t.title}</div>
                                        <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-2">
                                            {t.lf && <span>LF{t.lf}</span>}
                                            <span className={t.status === 'done' ? "text-green-500" : "text-yellow-500"}>{t.status}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-xs text-[var(--text-secondary)] text-center">
                            {selectedTasks.length} tasks selected. {selectedTasks.length === 0 ? "Will generate summary of period." : "Will weave narrative of selected items."}
                        </div>

                    </motion.div>
                ) : (
                    <motion.div
                        key="creative"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-6"
                    >
                        {/* Frameworks Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                                { id: 'pixar', label: 'Pixar', icon: Sparkles, desc: "Classic Arc" },
                                { id: 'hero', label: "Hero's Journey", icon: Zap, desc: "Epic Quest" },
                                { id: 'freytag', label: "Freytag", icon: LayoutTemplate, desc: "Dramatic" },
                                { id: 'golden', label: "Golden Circle", icon: Target, desc: "Why-How-What" },
                                { id: 'hso', label: "HSO", icon: Box, desc: "Hook-Story-Offer" },
                                { id: '5c', label: "5 C's", icon: Heart, desc: "Emotional" },
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setFramework(f.id)}
                                    className={`p-3 rounded-xl border text-left transition-all ${framework === f.id ? "bg-white text-black shadow-lg scale-105" : "bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-white/5"}`}
                                >
                                    <f.icon size={16} className="mb-2" />
                                    <div className="font-bold text-xs">{f.label}</div>
                                    <div className="text-[9px] opacity-70">{f.desc}</div>
                                </button>
                            ))}
                        </div>

                        {/* Inputs */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Character</label>
                                <input
                                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--text-primary)]"
                                    placeholder="Who is the protagonist? (e.g. The weary Founder)"
                                    value={character}
                                    onChange={e => setCharacter(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Setting / Context</label>
                                <input
                                    className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--text-primary)]"
                                    placeholder="Where does this take place? (e.g. Q4 Crunch)"
                                    value={setting}
                                    onChange={e => setSetting(e.target.value)}
                                />
                            </div>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

            {/* GENERATE ACTION */}
            <div className="mt-8">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full py-4 rounded-2xl bg-[var(--accent-color)] text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(var(--accent-color-rgb),0.4)] disabled:opacity-50 disabled:scale-100"
                >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <PenTool />}
                    {mode === "AUDIT" ? "Weave Narrative" : "Draft Story"}
                </button>
            </div>
        </div>
    );
}
