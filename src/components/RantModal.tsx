import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef } from "react";
import { useUIStore } from "@/lib/store/ui-store";
import { Zap, Loader2, Check, ArrowRight } from "lucide-react";

export default function RantModal(props: {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => Promise<void>;
}) {
    const { clickOrigin } = useUIStore();
    const [rant, setRant] = useState("");
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState<string | null>(null);
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
            // 1. Process Rant via AI
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

            const task = data.task;
            setProgress("Structuring task & subtasks...");

            // 2. Create the main task
            const createRes = await fetch("/api/cogos/task/create", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    title: task.title,
                    raw_text: rant,
                    due_date: task.due_date,
                    notes: task.notes,
                    duration_min: task.duration_min || 30,
                    lf: task.lf || 9,
                }),
            });

            if (!createRes.ok) {
                alert("Failed to create main task");
                setLoading(false);
                setProgress(null);
                return;
            }

            const createdTask = await createRes.json();
            const taskId = createdTask.task?.id;

            // 3. Create subtasks
            if (task.subtasks && task.subtasks.length > 0) {
                setProgress(`Generating ${task.subtasks.length} subtasks...`);
                await fetch("/api/cogos/task/createMany", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        parent_task_id: taskId,
                        episode_id: createdTask.episode?.id,
                        due_date: task.due_date,
                        lf: task.lf || 9,
                        items: task.subtasks.map((s: any) => ({
                            title: s.title,
                            duration_min: s.duration_min || 15,
                        })),
                    }),
                });
            }

            setProgress("Done!");
            setRant("");
            await props.onCreated();
            setTimeout(() => {
                props.onClose();
                setLoading(false);
                setProgress(null);
            }, 800);

        } catch (e) {
            console.error(e);
            alert("An error occurred while processing your rant");
            setLoading(false);
            setProgress(null);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            handleRant();
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
                        {/* Spotlight Header TextArea */}
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

                        {/* Scrollable Context Area */}
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
                                            AI will automatically extract subtasks, estimated durations, focus areas, and due dates from your text.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Efficiency</span>
                                            <span className="text-xs font-bold text-white/60">Auto-Scheduling</span>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Intelligence</span>
                                            <span className="text-xs font-bold text-white/60">Context Parsing</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Toolbar / Actions */}
                        <div className="p-4 bg-white/3 border-t border-white/5 flex items-center justify-between">
                            <button
                                onClick={props.onClose}
                                className="text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleRant}
                                disabled={!rant.trim() || loading}
                                className={`
                                    h-10 px-8 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-xl
                                    ${loading
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-white text-black hover:scale-105 active:scale-95 disabled:opacity-20'
                                    }
                                `}
                            >
                                {loading ? (
                                    <>
                                        <Check size={16} />
                                        Processing
                                    </>
                                ) : (
                                    <>
                                        Generate
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
