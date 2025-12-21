import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef } from "react";
import { useUIStore } from "@/lib/store/ui-store";
import { Zap, Loader2, Check, ArrowRight, Trash2, Plus, Calendar, Clock, Target, Box } from "lucide-react";
import { WORLDS } from "./TaskEditorModal";

type ParsedTask = {
    title: string;
    notes: string;
    due_date: string;
    lf: number;
    step?: number;
    duration_min: number;
    goal?: string;
    project?: string;
    subtasks: Array<{ title: string; duration_min: number }>;
};

export default function RantModal(props: {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => Promise<void>;
}) {
    const { clickOrigin } = useUIStore();
    const [rant, setRant] = useState("");
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState<string | null>(null);
    const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const getTransformOrigin = () => {
        if (!clickOrigin || !modalRef.current) return "center center";
        const rect = modalRef.current.getBoundingClientRect();
        const x = clickOrigin.x - rect.left;
        const y = clickOrigin.y - rect.top;
        return `${x}px ${y}px`;
    };

    async function handleRant() {
        if (!rant.trim() || loading) return;
        setLoading(true);
        setProgress("Parsing your thoughts...");

        try {
            const res = await fetch("/api/cogos/task/rant", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ rant }),
            });
            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.error || "Failed to parse rant");
                setLoading(false);
                setProgress(null);
                return;
            }

            // Ensure default step is 1
            setParsedTask({ ...data.task, step: data.task.step || 1 });
            setLoading(false);
            setProgress(null);
        } catch (e) {
            console.error(e);
            alert("An error occurred while processing your rant");
            setLoading(false);
            setProgress(null);
        }
    }

    async function handleCommit() {
        if (!parsedTask || loading) return;
        setLoading(true);
        setProgress("Creating your sequence...");

        try {
            // 2. Create the main task
            const createRes = await fetch("/api/cogos/task/create", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    title: parsedTask.title,
                    raw_text: rant,
                    due_date: parsedTask.due_date,
                    notes: parsedTask.notes,
                    duration_min: parsedTask.duration_min || 30,
                    lf: parsedTask.lf || 9,
                    step: parsedTask.step || 1,
                    goal: parsedTask.goal,
                    project: parsedTask.project
                }),
            });

            if (!createRes.ok) {
                alert("Failed to create main task");
                setLoading(false);
                return;
            }

            const createdTask = await createRes.json();
            const taskId = createdTask.task?.id;

            // 3. Create subtasks
            if (parsedTask.subtasks && parsedTask.subtasks.length > 0) {
                setProgress(`Generating ${parsedTask.subtasks.length} subtasks...`);
                await fetch("/api/cogos/task/createMany", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        parent_task_id: taskId,
                        episode_id: createdTask.episode?.id,
                        due_date: parsedTask.due_date,
                        lf: parsedTask.lf || 9,
                        goal: parsedTask.goal,
                        project: parsedTask.project,
                        items: parsedTask.subtasks.map((s: any) => ({
                            title: s.title,
                            duration_min: s.duration_min || 15,
                        })),
                    }),
                });
            }

            setProgress("Done!");
            setRant("");
            setParsedTask(null);
            await props.onCreated();
            setTimeout(() => {
                props.onClose();
                setLoading(false);
                setProgress(null);
            }, 800);

        } catch (e) {
            console.error(e);
            alert("An error occurred while finalizing tasks");
            setLoading(false);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            if (parsedTask) handleCommit();
            else handleRant();
        }
        if (e.key === "Escape") {
            props.onClose();
        }
    };

    if (!props.isOpen) return null;

    return (
        <AnimatePresence>
            {props.isOpen && (
                <motion.div
                    key="overlay"
                    className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 lg:p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onMouseDown={props.onClose}
                >
                    <motion.div
                        ref={modalRef}
                        className="w-full max-w-2xl bg-[#1c1c1e] text-white shadow-[0_32px_128px_rgba(0,0,0,0.8)] rounded-[2rem] border border-white/10 flex flex-col overflow-hidden max-h-[90vh]"
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                            transformOrigin: getTransformOrigin(),
                            willChange: "transform, opacity, filter"
                        }}
                        initial={{ scale: 0, opacity: 0, filter: "blur(20px)" }}
                        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                        exit={{ scale: 0, opacity: 0, filter: "blur(20px)" }}
                        transition={{
                            type: "spring",
                            stiffness: 140,
                            damping: 24,
                            mass: 1.2,
                            restDelta: 0.001
                        }}
                        onKeyDown={handleKeyDown}
                    >
                        {!parsedTask ? (
                            <>
                                {/* Step 1: Rant Input */}
                                <div className="relative border-b border-white/10 p-4 lg:p-6 bg-white/3">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                            <Zap size={14} className="text-white fill-current" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold tracking-tight text-white/90">Rant to Task</h2>
                                        </div>
                                    </div>
                                    <textarea
                                        autoFocus
                                        className="w-full bg-transparent text-xl lg:text-2xl font-medium outline-none placeholder:text-white/20 resize-none min-h-[120px] leading-relaxed"
                                        value={rant}
                                        onChange={(e) => setRant(e.target.value)}
                                        placeholder="Just rant about what you need to do... 'I need to fix the production server by tonight, it keeps crashing during high load. Probably need to check the logs...'"
                                        disabled={loading}
                                    />

                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 text-white/40 border border-white/10 flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'}`} />
                                                {loading ? "AI PARSING..." : "READY TO SEQUENCE"}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-40 pointer-events-none hidden lg:flex">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/30">⌘</span>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/30">ENTER</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-y-auto p-6 lg:p-8 space-y-6 flex-1">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                            <div className="relative">
                                                <div className="absolute inset-0 blur-xl bg-emerald-500/20 rounded-full animate-pulse" />
                                                <Loader2 size={32} className="text-emerald-500 animate-spin relative" />
                                            </div>
                                            <AnimatePresence mode="wait">
                                                <motion.p
                                                    key={progress}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -5 }}
                                                    className="text-xs font-bold uppercase tracking-[0.3em] text-white/40"
                                                >
                                                    {progress}
                                                </motion.p>
                                            </AnimatePresence>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="p-6 rounded-[2rem] border-2 border-dashed border-white/5 bg-white/[0.02] text-center">
                                                <p className="text-xs text-white/30 leading-relaxed font-medium">
                                                    AI will automatically extract subtasks, durations, focus areas, and goals from your rant for your approval.
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex flex-col gap-1">
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Step 1</span>
                                                    <span className="text-xs font-bold text-white/60">Voice/Text Rant</span>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex flex-col gap-1">
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Step 2</span>
                                                    <span className="text-xs font-bold text-white/60">Verify & Commit</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-white/3 border-t border-white/5 flex items-center justify-between">
                                    <button onClick={props.onClose} className="text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest">Cancel</button>
                                    <button
                                        onClick={handleRant}
                                        disabled={!rant.trim() || loading}
                                        className="h-10 px-8 rounded-full bg-white text-black font-bold text-sm hover:scale-105 active:scale-95 disabled:opacity-20 transition-all flex items-center gap-2 shadow-xl"
                                    >
                                        Parse Thoughts <ArrowRight size={16} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Step 2: Review & Edit */}
                                <div className="relative border-b border-white/10 p-4 lg:p-6 bg-white/3">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setParsedTask(null)} className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors">
                                                <ArrowRight size={14} className="text-white rotate-180" />
                                            </button>
                                            <h2 className="text-sm font-bold tracking-tight text-white/90">Review Sequence</h2>
                                        </div>
                                        <div className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.2em] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                            STRUCTURED
                                        </div>
                                    </div>
                                    <input
                                        className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-white/20"
                                        value={parsedTask.title}
                                        onChange={(e) => setParsedTask({ ...parsedTask, title: e.target.value })}
                                        placeholder="Task Title"
                                    />
                                </div>

                                <div className="overflow-y-auto p-6 lg:p-8 space-y-8 flex-1">
                                    {/* Primary Info Grid */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <Calendar size={10} /> Due Date
                                                </label>
                                                <input
                                                    type="date"
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-white/10 transition-colors"
                                                    value={parsedTask.due_date}
                                                    onChange={(e) => setParsedTask({ ...parsedTask, due_date: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <Clock size={10} /> Effort (min)
                                                </label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-white/10 transition-colors"
                                                    value={parsedTask.duration_min}
                                                    onChange={(e) => setParsedTask({ ...parsedTask, duration_min: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <Target size={10} /> Goal
                                                </label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-white/10 transition-colors"
                                                    value={parsedTask.goal || ""}
                                                    onChange={(e) => setParsedTask({ ...parsedTask, goal: e.target.value })}
                                                    placeholder="Focus Area"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <Box size={10} /> Project
                                                </label>
                                                <input
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-white/10 transition-colors"
                                                    value={parsedTask.project || ""}
                                                    onChange={(e) => setParsedTask({ ...parsedTask, project: e.target.value })}
                                                    placeholder="Category"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selectors Row: World and Steps */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">World Context</label>
                                            <div className="h-32 overflow-y-auto scrollbar-hide snap-y snap-mandatory bg-white/3 rounded-2xl border border-white/5 p-1 relative">
                                                <div className="py-10">
                                                    {WORLDS.map(w => (
                                                        <button
                                                            key={w.id}
                                                            onClick={() => setParsedTask({ ...parsedTask, lf: w.id })}
                                                            className={`w-full py-2 px-3 mb-1 rounded-xl transition-all snap-center flex items-center justify-between ${parsedTask.lf === w.id
                                                                ? `bg-gradient-to-r ${w.color} text-white shadow-lg`
                                                                : "text-white/20 hover:text-white/40"
                                                                }`}
                                                        >
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">{w.name}</span>
                                                            <span className="text-[8px] font-mono opacity-20">{w.id}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#1c1c1e] to-transparent pointer-events-none rounded-t-2xl z-10" />
                                                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1c1c1e] to-transparent pointer-events-none rounded-b-2xl z-10" />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Step in Sequence</label>
                                            <div className="h-32 overflow-y-auto scrollbar-hide snap-y snap-mandatory bg-white/3 rounded-2xl border border-white/5 p-1 relative">
                                                <div className="py-10">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => setParsedTask({ ...parsedTask, step: s })}
                                                            className={`w-full py-2 px-3 mb-1 rounded-xl transition-all snap-center flex items-center justify-between ${parsedTask.step === s
                                                                ? "bg-white text-black shadow-lg scale-[1.02]"
                                                                : "text-white/20 hover:text-white/40"
                                                                }`}
                                                        >
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">Step {s}</span>
                                                            <Check size={10} className={parsedTask.step === s ? "opacity-100" : "opacity-0"} />
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#1c1c1e] to-transparent pointer-events-none rounded-t-2xl z-10" />
                                                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1c1c1e] to-transparent pointer-events-none rounded-b-2xl z-10" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subtasks */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Subtask Sequence</label>
                                            <button
                                                onClick={() => setParsedTask({ ...parsedTask, subtasks: [...parsedTask.subtasks, { title: "", duration_min: 15 }] })}
                                                className="text-[9px] font-bold text-white/40 hover:text-white flex items-center gap-1"
                                            >
                                                <Plus size={10} /> ADD STEP
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {parsedTask.subtasks.map((st, i) => (
                                                <div key={i} className="flex gap-2 group">
                                                    <input
                                                        className="flex-1 bg-white/3 border border-white/5 rounded-xl px-4 py-2 text-xs font-medium outline-none focus:border-white/10"
                                                        value={st.title}
                                                        onChange={(e) => {
                                                            const next = [...parsedTask.subtasks];
                                                            next[i].title = e.target.value;
                                                            setParsedTask({ ...parsedTask, subtasks: next });
                                                        }}
                                                        placeholder="What needs to happen?"
                                                    />
                                                    <input
                                                        type="number"
                                                        className="w-20 bg-white/3 border border-white/5 rounded-xl px-2 py-2 text-xs font-mono text-center outline-none focus:border-white/10"
                                                        value={st.duration_min}
                                                        onChange={(e) => {
                                                            const next = [...parsedTask.subtasks];
                                                            next[i].duration_min = parseInt(e.target.value) || 0;
                                                            setParsedTask({ ...parsedTask, subtasks: next });
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const next = parsedTask.subtasks.filter((_, idx) => idx !== i);
                                                            setParsedTask({ ...parsedTask, subtasks: next });
                                                        }}
                                                        className="h-8 w-8 rounded-xl bg-red-500/10 text-red-500/40 hover:text-red-500 hover:bg-red-500/20 transition-all flex items-center justify-center"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Summary & Context</label>
                                        <textarea
                                            className="w-full bg-white/3 border border-white/5 rounded-2xl p-4 text-xs text-white/70 leading-relaxed outline-none focus:border-white/10 transition-colors h-32 resize-none"
                                            value={parsedTask.notes}
                                            onChange={(e) => setParsedTask({ ...parsedTask, notes: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-white/3 border-t border-white/5 flex items-center justify-between">
                                    <button onClick={() => setParsedTask(null)} className="text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest">Back</button>
                                    <button
                                        onClick={handleCommit}
                                        disabled={loading}
                                        className="h-10 px-8 rounded-full bg-emerald-500 text-white font-bold text-sm hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xl shadow-emerald-500/20"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                        {loading ? "Committing..." : "Finalize & Create"}
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
