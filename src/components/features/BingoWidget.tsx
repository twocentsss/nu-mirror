"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { BINGO_TARGET_SCORE, PILLARS_COUNT } from "@/lib/features/bingo/rules";

// Mock Data (since we don't have the live engine hooked up yet)
const PILLARS = ["CORE", "SELF", "CIRCLE", "GRIND", "LEVEL_UP", "IMPACT", "PLAY", "INSIGHT", "CHAOS"];
const MOCK_SCORES = {
    CORE: 8,
    SELF: 5,
    GRIND: 10,
    PLAY: 2,
};

export default function BingoWidget() {
    const totalScore = 25; // Bingo!
    const isBingo = totalScore >= BINGO_TARGET_SCORE;

    return (
        <div className="w-full bg-white/50 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                        Daily Bingo
                    </h2>
                    <p className="text-sm text-gray-500">Target: {BINGO_TARGET_SCORE} pts</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-gray-800">{totalScore}</div>
                    <div className="text-xs uppercase tracking-wider text-gray-400">Points</div>
                </div>
            </div>

            {/* The Gauge */}
            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-8">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((totalScore / BINGO_TARGET_SCORE) * 100, 100)}%` }}
                    className={`absolute top-0 left-0 h-full ${isBingo ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-purple-500'}`}
                />
            </div>

            {/* The Pillars Grid */}
            <div className="grid grid-cols-3 gap-3">
                {PILLARS.map((pillar) => {
                    const score = (MOCK_SCORES as any)[pillar] || 0;
                    const opacity = score > 0 ? 1 : 0.4;

                    return (
                        <motion.div
                            key={pillar}
                            whileTap={{ scale: 0.95 }}
                            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/60 border border-white/40 shadow-sm"
                            style={{ opacity }}
                        >
                            <div className="text-[10px] font-bold text-gray-400 mb-1">{pillar}</div>
                            <div className={`text-xl font-bold ${score === 10 ? 'text-green-600' : 'text-gray-800'}`}>
                                {score}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {isBingo && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-6 p-4 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-2xl text-center text-white font-bold shadow-lg transform rotate-1"
                >
                    🎉 BINGO ACHIEVED!
                </motion.div>
            )}
        </div>
    );
}
