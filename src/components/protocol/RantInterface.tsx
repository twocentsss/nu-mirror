"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Check, Loader2 } from "lucide-react";
import { generateMacroState, GeneratedItem } from "@/lib/quantum/macro_generator";

export function RantInterface() {
    const [rant, setRant] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);

    const handleProcess = async () => {
        if (!rant.trim()) return;
        setIsProcessing(true);
        try {
            const items = await generateMacroState(rant);
            setGeneratedItems(items);
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCommit = () => {
        // Here we would actually save to DB
        alert(`Committed ${generatedItems.length} items to your Life Graph!`);
        setGeneratedItems([]);
        setRant("");
    };

    return (
        <div className="pb-32 px-4 max-w-3xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-white mb-2">Rant Mode</h2>
                <p className="text-[var(--text-secondary)]">
                    Dump your brain. We'll extract the Goals, Projects, and Tasks for you.
                </p>
            </div>

            <div className="relative">
                <textarea
                    value={rant}
                    onChange={(e) => setRant(e.target.value)}
                    placeholder="I need to get in shape for the summer, maybe run a marathon..."
                    className="w-full h-48 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-3xl p-6 text-lg text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none transition-all"
                />

                <div className="absolute bottom-4 right-4">
                    <button
                        onClick={handleProcess}
                        disabled={isProcessing || !rant.trim()}
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                        {isProcessing ? "Analyzing..." : "Process"}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {generatedItems.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">Proposed Structure</h3>
                            <button
                                onClick={handleCommit}
                                className="text-xs font-bold text-[var(--accent-color)] hover:underline flex items-center gap-1"
                            >
                                <Check size={14} /> Commit All
                            </button>
                        </div>

                        <div className="grid gap-3">
                            {generatedItems.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layoutId={item.id}
                                    className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4"
                                >
                                    <div className={`p-2 rounded-lg 
                                        ${item.type === 'TARGET' ? 'bg-purple-500/20 text-purple-400' :
                                            item.type === 'PROJECT' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-green-500/20 text-green-400'}`}
                                    >
                                        {item.type === 'TARGET' ? <TargetIcon /> :
                                            item.type === 'PROJECT' ? <FolderIcon /> : <TaskIcon />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] uppercase font-bold opacity-50">{item.type}</span>
                                            <span className="text-[10px] font-mono opacity-30">LF{item.lf_id}</span>
                                        </div>
                                        <div className="font-bold text-white">{item.title}</div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-white/10 rounded-full"><ArrowRight size={16} /></button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function TargetIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg> }
function FolderIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg> }
function TaskIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></svg> }
