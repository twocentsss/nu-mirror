 "use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { FlowSummary } from "@/lib/flow/summary";
import { BINGO_TARGET_SCORE, calculatePillarScore } from "@/lib/features/bingo/rules";

type PillarSummary = {
    name: string;
    minutes: number;
    score: number;
};

export default function BingoWidget() {
    const [pillars, setPillars] = useState<PillarSummary[]>([]);
    const [totalMinutes, setTotalMinutes] = useState(0);
    const [trendLabel, setTrendLabel] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch("/api/flow/summary");
                if (!res.ok) throw new Error("Unable to load Flow summary");
                const body = (await res.json()) as { summary: FlowSummary };
                const { summary } = body;
                if (cancelled) return;

                const entries = Object.entries(summary.totalsByComponentGroup).map(([name, rawMinutes]) => {
                    const minutes = typeof rawMinutes === "number" ? rawMinutes : Number(rawMinutes ?? 0);
                    return {
                        name,
                        minutes,
                        score: calculatePillarScore(minutes),
                    };
                });

                setPillars(entries);
                setTotalMinutes(summary.totalMinutes);
                setTrendLabel(summary.trend?.label ?? "");
            } catch (err: any) {
                console.error("BingoWidget flow fetch failed", err);
                if (!cancelled) setError(err.message || "Failed to load data");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const totalScore = pillars.reduce((acc, pillar) => acc + pillar.score, 0);
    const isBingo = totalScore >= BINGO_TARGET_SCORE;

    const gaugeWidth = Math.min((totalScore / BINGO_TARGET_SCORE) * 100, 100);

    return (
        <div className="w-full bg-white/50 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                        Daily Bingo
                    </h2>
                    <p className="text-xs text-gray-500 tracking-[0.3em] uppercase">Target: {BINGO_TARGET_SCORE} pts</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-gray-800">{totalScore}</div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Points</div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-10 text-sm text-gray-500">Syncing Flow Ledger…</div>
            ) : error ? (
                <div className="text-sm text-red-500">{error}</div>
            ) : (
                <>
                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-6">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${gaugeWidth}%` }}
                            className={`absolute top-0 left-0 h-full ${
                                isBingo ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gradient-to-r from-blue-400 to-purple-500"
                            }`}
                        />
                    </div>

                    <div className="text-[11px] uppercase tracking-[0.4em] text-gray-400 mb-3">
                        {totalMinutes} min tracked • trend {trendLabel || "—"}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {pillars.map((pillar) => (
                            <motion.div
                                key={pillar.name}
                                whileTap={{ scale: 0.95 }}
                                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/60 border border-white/40 shadow-sm"
                            >
                                <div className="text-[10px] font-black text-gray-400 mb-1 truncate text-center">
                                    {pillar.name}
                                </div>
                                <div className={`text-xl font-bold ${pillar.score >= 8 ? "text-emerald-600" : "text-gray-800"}`}>
                                    {pillar.score}
                                </div>
                                <div className="text-[9px] uppercase tracking-[0.3em] text-gray-400 mt-1">
                                    {pillar.minutes}m
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </>
            )}

            {isBingo && !loading && !error && (
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
