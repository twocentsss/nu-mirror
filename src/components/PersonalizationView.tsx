"use client";

import { motion } from "framer-motion";

export function PersonalizationContent({ onClose }: { onClose?: () => void }) {
    return (
        <div className="max-w-5xl mx-auto space-y-24 pb-40 px-6">
            {/* Hero / Stance */}
            <header className="space-y-8 max-w-4xl pt-12">
                <p className="text-[14px] font-bold uppercase tracking-[0.6em] text-blue-500">The Nu Protocol</p>
                <h1 className="text-6xl md:text-8xl font-black text-[var(--text-primary)] tracking-tighter leading-[0.95]">
                    Identity. <br />Decided by design.
                </h1>
                <p className="text-2xl md:text-3xl font-medium text-[var(--text-secondary)] max-w-2xl leading-tight italic">
                    "Track your life like money. Because time is the only thing you can't earn back."
                </p>
            </header>

            {/* Vision Cards */}
            <section className="grid md:grid-cols-3 gap-12">
                {[
                    { value: "1440", label: "Daily Reconciliation", desc: "Every day ends with one question: Did your day reconcile?", color: "from-blue-600/20 to-indigo-600/20" },
                    { value: "P&L", label: "Life Ledger", desc: "See your Scroll Tax and Asset Growth. No guilt, just accounting.", color: "from-purple-600/20 to-pink-600/20" },
                    { value: "BYO", label: "Self-Sovereign", desc: "Bring your own keys, storage, and config. You own the system.", color: "from-emerald-600/20 to-teal-600/20" },
                ].map((card) => (
                    <div key={card.label} className={`p-10 rounded-[2.5rem] bg-gradient-to-br ${card.color} border border-[var(--glass-border)] space-y-6 transition-transform hover:scale-[1.02] duration-500`}>
                        <div className="text-5xl font-black text-[var(--text-primary)]">{card.value}</div>
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)]">{card.label}</h3>
                            <p className="text-[var(--text-secondary)] text-lg font-medium leading-snug">{card.desc}</p>
                        </div>
                    </div>
                ))}
            </section>

            {/* The 9 Worlds (The Grid) */}
            <section className="space-y-16">
                <div className="space-y-4">
                    <h2 className="text-[14px] font-bold uppercase tracking-[0.5em] text-blue-500">The 9 Worlds</h2>
                    <h3 className="text-5xl font-black text-[var(--text-primary)] tracking-tighter">Define the dimensions.</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        ["1. Core", "Soul, purpose, being"],
                        ["2. Self", "Body, mind, heart"],
                        ["3. Circle", "Family, friends, love"],
                        ["4. Grind", "Work, responsibilities"],
                        ["5. Level Up", "Skills, growth, business"],
                        ["6. Impact", "Giving back, community"],
                        ["7. Play", "Joy, creativity, travel"],
                        ["8. Insight", "Knowledge, wisdom"],
                        ["9. Chaos", "The unexpected"]
                    ].map(([title, desc]) => (
                        <div key={title} className="group p-8 rounded-[2rem] border border-[var(--glass-border)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg)]/80 transition-all duration-500">
                            <span className="text-2xl font-black text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors uppercase tracking-tight">{title}</span>
                            <p className="text-sm text-[var(--text-secondary)] font-bold uppercase tracking-[0.2em] mt-2 italic">{desc}</p>
                        </div>
                    ))}
                </div>
                <div className="p-8 rounded-[2rem] bg-blue-500/5 border border-blue-500/10 text-center">
                    <p className="text-white/40 font-medium italic">
                        "We provide the defaults. You provide the meaning. Rename, replace, or reconfigure via Config Vending (Coming Phase 5)."
                    </p>
                </div>
            </section>

            {/* CTA Footer */}
            {onClose && (
                <footer className="rounded-[4rem] bg-[var(--glass-bg)] border border-[var(--glass-border)] p-20 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-color)] to-transparent opacity-50" />
                    <div className="space-y-10 relative z-10">
                        <h3 className="text-5xl font-black tracking-tighter italic text-[var(--text-primary)] md:text-6xl">"Identity is not a state, it's a protocol."</h3>
                        <div className="flex justify-center">
                            <button
                                onClick={onClose}
                                className="px-16 py-6 rounded-full bg-[var(--text-primary)] text-[var(--app-bg)] text-2xl font-black tracking-tight transition-all hover:scale-105 shadow-2xl"
                            >
                                Recalibrate Now
                            </button>
                        </div>
                    </div>
                </footer>
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
            className="fixed inset-0 z-40 bg-[var(--app-bg)] overflow-hidden flex flex-col pt-32"
        >
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <PersonalizationContent onClose={onClose} />
            </div>
        </motion.div>
    );
}
