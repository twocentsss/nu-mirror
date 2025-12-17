"use client";

import { motion } from "framer-motion";
import { MirrorCard } from "@/ui/MirrorCard";
import { DepartmentId } from "@/lib/reporting/types";

// Mock Department Data (aligned with src/lib/reporting/aggregator.ts)
const DEPARTMENTS: { id: DepartmentId; label: string; score: number; color: string; insight: string }[] = [
    { id: 'OPERATIONS', label: 'Ops & Maint', score: 85, color: 'text-blue-600', insight: 'Capacity stable.' },
    { id: 'HR', label: 'Culture & HR', score: 60, color: 'text-amber-500', insight: 'Invest minutes.' },
    { id: 'R_AND_D', label: 'R&D', score: 92, color: 'text-purple-600', insight: 'Innovation high.' },
];

export default function ReportsWidget() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-lg font-bold text-gray-800">CEO Dashboard</h2>
                <button className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Q3 Review
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DEPARTMENTS.map((dept, i) => (
                    <motion.div
                        key={dept.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <MirrorCard className="p-4 bg-white hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{dept.label}</div>
                                <div className={`text-xl font-black ${dept.color}`}>{dept.score}%</div>
                            </div>

                            {/* Ring Visualization (Abstract CSS) */}
                            <div className="relative w-full h-1 bg-gray-100 rounded-full mb-3 overflow-hidden">
                                <div
                                    className={`absolute top-0 left-0 h-full rounded-full ${dept.color.replace('text-', 'bg-')}`}
                                    style={{ width: `${dept.score}%` }}
                                />
                            </div>

                            <div className="text-xs font-medium text-gray-600 italic">
                                "{dept.insight}"
                            </div>
                        </MirrorCard>
                    </motion.div>
                ))}
            </div>

            {/* Heatmap Section */}
            <MirrorCard className="p-4 bg-white/80">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Consistency Grid</div>
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 28 }).map((_, i) => {
                        const intensity = Math.random();
                        const opacity = intensity > 0.7 ? 1 : intensity > 0.3 ? 0.6 : 0.2;
                        return (
                            <div
                                key={i}
                                className="w-full pt-[100%] rounded-md bg-green-500 relative"
                                style={{ opacity }}
                            />
                        );
                    })}
                </div>
            </MirrorCard>
        </div>
    );
}
