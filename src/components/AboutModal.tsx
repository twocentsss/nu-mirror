"use client";

import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { X, Sparkles, Shield, Target, Zap, Heart, Users, Briefcase, TrendingUp, Globe, Lightbulb, Flame } from "lucide-react";
import { useState, useRef } from "react";
import { useUIStore } from "@/lib/store/ui-store";

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
    const { clickOrigin } = useUIStore();
    const modalRef = useRef<HTMLDivElement>(null);
    const scrollY = useMotionValue(0);

    const getTransformOrigin = () => {
        if (!clickOrigin || !modalRef.current) return "center center";
        const rect = modalRef.current.getBoundingClientRect();
        return `${clickOrigin.x - rect.left}px ${clickOrigin.y - rect.top}px`;
    };

    // Parallax transforms based on manual scroll value
    // ... Parallax code remains same

    // Parallax transforms based on manual scroll value
    const heroY = useTransform(scrollY, [0, 200], [0, -50]);
    const heroOpacity = useTransform(scrollY, [0, 200], [1, 0]);
    const section1Y = useTransform(scrollY, [200, 600], [50, 0]);
    const section2Y = useTransform(scrollY, [600, 1000], [50, 0]);
    const section3Y = useTransform(scrollY, [1000, 1400], [50, 0]);

    if (!isOpen) return null;

    const lifeFocusPillars = [
        { icon: Heart, name: "Core", desc: "Your soul, purpose, being", color: "from-rose-500 to-pink-500" },
        { icon: Sparkles, name: "Self", desc: "Body, mind, heart", color: "from-purple-500 to-indigo-500" },
        { icon: Users, name: "Circle", desc: "Family, friends, love", color: "from-blue-500 to-cyan-500" },
        { icon: Briefcase, name: "Grind", desc: "Work, responsibilities", color: "from-gray-600 to-gray-800" },
        { icon: TrendingUp, name: "Level Up", desc: "Skills, growth, business", color: "from-emerald-500 to-green-500" },
        { icon: Globe, name: "Impact", desc: "Giving back, community", color: "from-teal-500 to-cyan-600" },
        { icon: Target, name: "Play", desc: "Joy, creativity, travel", color: "from-yellow-500 to-orange-500" },
        { icon: Lightbulb, name: "Insight", desc: "Knowledge, wisdom", color: "from-amber-500 to-yellow-600" },
        { icon: Flame, name: "Chaos", desc: "The unexpected", color: "from-red-500 to-orange-600" },
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div
                    ref={modalRef}
                    initial={{ opacity: 0, scale: 0, filter: "blur(15px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0, filter: "blur(15px)" }}
                    style={{
                        transformOrigin: getTransformOrigin(),
                        willChange: "transform, opacity, filter"
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 110,
                        damping: 24,
                        mass: 1.5,
                        restDelta: 0.001
                    }}
                    className="relative w-full max-w-4xl h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 z-50 p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                    >
                        <X size={24} className="text-gray-600" />
                    </button>

                    {/* Scrollable Content with Manual Listener */}
                    <div
                        className="h-full overflow-y-auto scrollbar-hide"
                        onScroll={(e) => scrollY.set((e.target as HTMLElement).scrollTop)}
                    >
                        {/* Hero Section */}
                        <motion.section
                            style={{ y: heroY, opacity: heroOpacity }}
                            className="min-h-screen flex flex-col items-center justify-center px-8 text-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-8 shadow-2xl"
                            >
                                <Sparkles size={48} className="text-white" />
                            </motion.div>
                            <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Nu Flow Protocol
                            </h1>
                            <p className="text-2xl text-gray-600 max-w-2xl mb-8">
                                Track your life like money. Because time is the only thing you can't earn back.
                            </p>
                            <div className="flex gap-4">
                                <div className="px-6 py-3 bg-white rounded-full shadow-lg border border-purple-100">
                                    <span className="text-sm font-bold text-purple-600">1440 Minutes</span>
                                </div>
                                <div className="px-6 py-3 bg-white rounded-full shadow-lg border border-pink-100">
                                    <span className="text-sm font-bold text-pink-600">Every Day</span>
                                </div>
                            </div>
                        </motion.section>

                        {/* Section 1: LifeLedger */}
                        <motion.section
                            style={{ y: section1Y }}
                            className="min-h-screen flex flex-col items-center justify-center px-8 py-20 bg-white"
                        >
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-6">
                                    <Zap size={16} className="text-purple-600" />
                                    <span className="text-sm font-bold text-purple-600">LifeLedger</span>
                                </div>
                                <h2 className="text-5xl font-black mb-6">
                                    You're not lazy.
                                    <br />
                                    <span className="text-purple-600">You're leaking time.</span>
                                </h2>
                                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                    Most productivity apps are just prettier to-do lists. They don't answer the only question that matters:{" "}
                                    <strong>Where did my life go today?</strong>
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                                        <div className="text-4xl font-black text-purple-600 mb-2">1440</div>
                                        <div className="text-sm font-bold text-gray-700 mb-2">Daily Reconciliation</div>
                                        <div className="text-xs text-gray-600">Every day ends with one question: Does your day reconcile to 1440 minutes?</div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                                        <div className="text-4xl font-black text-blue-600 mb-2">P&L</div>
                                        <div className="text-sm font-bold text-gray-700 mb-2">Time Reports</div>
                                        <div className="text-xs text-gray-600">See your Scroll Tax, Asset Growth, and where your minutes actually went.</div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                                        <div className="text-4xl font-black text-green-600 mb-2">∞</div>
                                        <div className="text-sm font-bold text-gray-700 mb-2">No Guilt</div>
                                        <div className="text-xs text-gray-600">Scrolling isn't "bad", it's just an account. Want less? Move the funds.</div>
                                    </div>
                                </div>

                                <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-purple-900 text-white">
                                    <p className="text-2xl font-bold mb-4">"If you can't tell me where your 1440 minutes went..."</p>
                                    <p className="text-lg opacity-90">...someone else decided for you.</p>
                                </div>
                            </div>
                        </motion.section>

                        {/* Section 2: BYO Security */}
                        <motion.section
                            style={{ y: section2Y }}
                            className="min-h-screen flex flex-col items-center justify-center px-8 py-20 bg-gradient-to-br from-slate-50 to-gray-100"
                        >
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
                                    <Shield size={16} className="text-blue-600" />
                                    <span className="text-sm font-bold text-blue-600">Your Data, Your Rules</span>
                                </div>
                                <h2 className="text-5xl font-black mb-6">
                                    Bring Your Own
                                    <br />
                                    <span className="text-blue-600">Everything.</span>
                                </h2>
                                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                    We don't want your data. We want you to <strong>own</strong> it. Bring your own keys, storage, and compute. We just orchestrate the magic.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <Shield size={24} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">BYO Keys</h3>
                                            <p className="text-sm text-gray-600">Encrypt your private data with your own keys. We never see your raw thoughts.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
                                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <Globe size={24} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">BYO Storage</h3>
                                            <p className="text-sm text-gray-600">S3, Google Drive, or local. Your life, your cloud.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
                                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <Zap size={24} className="text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">BYO Config</h3>
                                            <p className="text-sm text-gray-600">Fork the config sheet and run your own rules. Full control.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* Section 3: 9 Life Focus Pillars */}
                        <motion.section
                            style={{ y: section3Y }}
                            className="min-h-screen flex flex-col items-center justify-center px-8 py-20 bg-white"
                        >
                            <div className="max-w-4xl w-full">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-6">
                                    <Target size={16} className="text-purple-600" />
                                    <span className="text-sm font-bold text-purple-600">Life Focus</span>
                                </div>
                                <h2 className="text-5xl font-black mb-6">
                                    Your life in
                                    <br />
                                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">9 Worlds.</span>
                                </h2>
                                <p className="text-xl text-gray-600 mb-12 leading-relaxed">
                                    Every moment belongs to one of 9 focus areas. Track them all, balance them beautifully.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {lifeFocusPillars.map((pillar, i) => {
                                        const Icon = pillar.icon;
                                        return (
                                            <motion.div
                                                key={pillar.name}
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                viewport={{ once: true }}
                                                className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-transparent hover:shadow-xl transition-all cursor-pointer"
                                            >
                                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${pillar.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                                    <Icon size={24} className="text-white" />
                                                </div>
                                                <h3 className="font-black text-lg mb-1">{pillar.name}</h3>
                                                <p className="text-sm text-gray-600">{pillar.desc}</p>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 text-white text-center">
                                    <p className="text-2xl font-bold mb-2">8 structured domains + 1 force of Chaos</p>
                                    <p className="text-lg opacity-90">Every story. Every life. Fully accounted for.</p>
                                </div>
                            </div>
                        </motion.section>

                        {/* Footer CTA */}
                        <section className="py-20 px-8 bg-gradient-to-br from-gray-900 to-purple-900 text-white text-center">
                            <h2 className="text-4xl font-black mb-4">Ready to reconcile your 1440?</h2>
                            <p className="text-xl opacity-90 mb-8">Start tracking your life like it matters.</p>
                            <button className="px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl">
                                Get Started
                            </button>
                        </section>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
