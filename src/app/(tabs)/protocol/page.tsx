"use client";

import { useState } from "react";
import { ProtocolHeader, ProtocolMode } from "@/components/protocol/ProtocolHeader";
import { LFDashboard } from "@/components/protocol/LFDashboard";
import { RantInterface } from "@/components/protocol/RantInterface";
import { PersonalizationContent } from "@/components/PersonalizationView";
import { Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProtocolPage() {
    const [mode, setMode] = useState<ProtocolMode>("DASHBOARD");
    const [showManifesto, setShowManifesto] = useState(false);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-[var(--text-primary)]">
            {/* Sticky Sub-Header */}
            <div className="sticky top-0 z-30 pt-4 px-4 pb-4 bg-gradient-to-b from-[#0a0a0a] to-transparent pointer-events-none">
                <div className="flex items-center justify-between pointer-events-auto">
                    <ProtocolHeader mode={mode} setMode={setMode} />

                    <button
                        onClick={() => setShowManifesto(!showManifesto)}
                        className={`p-2 rounded-full transition-colors ${showManifesto ? 'bg-white text-black' : 'bg-[var(--glass-bg)] text-[var(--text-secondary)]'}`}
                    >
                        <Info size={18} />
                    </button>
                </div>
            </div>

            <div className="px-4">
                <AnimatePresence mode="wait">
                    {showManifesto ? (
                        <motion.div
                            key="manifesto"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <PersonalizationContent onClose={() => setShowManifesto(false)} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {mode === "DASHBOARD" ? <LFDashboard /> : <RantInterface />}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
