"use client";

import SprintWidget from "@/components/features/SprintWidget";
import { MirrorCard } from "@/ui/MirrorCard";

export default function SprintPage() {
    return (
        <div className="p-4 space-y-6 max-w-lg mx-auto pb-40">
            <div className="mb-4">
                <h1 className="text-3xl font-black mb-1">Sprint</h1>
                <p className="text-gray-500">Plan your next 2 weeks.</p>
            </div>

            <SprintWidget />

            <div className="mt-8 space-y-4">
                <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest pl-1">
                    Backlog Suggestions
                </h3>

                <MirrorCard className="p-4 bg-white/70 border border-amber-200/50">
                    <div className="flex gap-3">
                        <div className="text-2xl">✨</div>
                        <div>
                            <div className="font-bold text-gray-800 text-sm">Quantum Suggestion</div>
                            <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                                "Based on your 60% Grind saturation, try adding 'Read in Park' for Recovery."
                            </div>
                        </div>
                    </div>
                </MirrorCard>
            </div>
        </div>
    );
}
