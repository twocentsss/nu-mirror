"use client";

import { motion } from "framer-motion";

export function PersonalizationContent({ onClose }: { onClose?: () => void }) {
    return (
        <div className="max-w-3xl mx-auto space-y-12 pb-32">

            {/* Hero */}
            <section className="text-center space-y-6">
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-tighter">
                    Nu Flow Protocol
                </h1>
                <p className="text-xl md:text-2xl font-medium text-white/60 max-w-2xl mx-auto leading-relaxed">
                    Track your life like money. Because time is the only thing you can't earn back.
                </p>
            </section>

            <hr className="border-white/10" />

            {/* Core Tenets */}
            <section className="grid md:grid-cols-3 gap-8">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                    <div className="text-3xl font-black text-white mb-2">1440</div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2">Daily Reconciliation</h3>
                    <p className="text-white/40 text-sm">Every day ends with one question: Did your day reconcile?</p>
                </div>
                <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                    <div className="text-3xl font-black text-white mb-2">P&L</div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2">Life Ledger</h3>
                    <p className="text-white/40 text-sm">See your Scroll Tax and Asset Growth. No guilt, just accounting.</p>
                </div>
                <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                    <div className="text-3xl font-black text-white mb-2">BYO</div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2">Your Data</h3>
                    <p className="text-white/40 text-sm">Bring your own keys, storage, and config. You own the system.</p>
                </div>
            </section>

            {/* The 9 Worlds */}
            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">The 9 Worlds</h2>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-white/60 uppercase">Configurable</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        ["1. Core", "Soul, purpose, being"],
                        ["2. Self", "Body, mind, heart"],
                        ["3. Circle", "Family, friends, love"],
                        ["4. Grind", "Work, responsibilities"],
                        ["5. Level Up", "Skills, growth, business"],
                        ["6. Impact", "Giving back, community"],
                        ["7. Play", "Joy, creativity, travel"],
                        ["8. Insight", "Knowledge, wisdom"],
                        ["9. Chaos", "The unexpected (Constant)"]
                    ].map(([title, desc]) => (
                        <div key={title} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col">
                            <span className="font-bold text-white">{title}</span>
                            <span className="text-xs text-white/40 uppercase tracking-wider mt-1">{desc}</span>
                        </div>
                    ))}
                </div>
                <p className="text-center text-sm text-white/40 italic">
                    "We provide the defaults. You provide the meaning. Rename, replace, or reconfigure via Config Vending (Coming Phase 5)."
                </p>
            </section>

            {/* Footer */}
            {onClose && (
                <section className="p-8 rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 text-center space-y-4">
                    <h3 className="text-xl font-bold text-white">Ready to reconcile?</h3>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform"
                    >
                        Enter the Flow
                    </button>
                </section>
            )}

        </div>
    );
}

export function PersonalizationView({ onClose }: { onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-40 bg-[#0a0a0a] overflow-hidden flex flex-col pt-32"
        >
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <PersonalizationContent onClose={onClose} />
            </div>
        </motion.div>
    );
}
