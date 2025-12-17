"use client";

import BingoWidget from "@/components/features/BingoWidget";

export default function BingoPage() {
    return (
        <div className="p-4 space-y-6 max-w-lg mx-auto pb-40">
            <div className="mb-4">
                <h1 className="text-3xl font-black mb-1">Bingo</h1>
                <p className="text-gray-500">Daily reconciliation game.</p>
            </div>

            <BingoWidget />

            <div className="text-center text-xs text-gray-400 mt-8">
                Reconcile your 1440 minutes daily.
            </div>
        </div>
    );
}
