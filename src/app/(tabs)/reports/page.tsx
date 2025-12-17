"use client";

import ReportsWidget from "@/components/features/ReportsWidget";

export default function ReportsPage() {
    return (
        <div className="p-4 space-y-6 max-w-lg mx-auto pb-40">
            <div className="mb-4">
                <h1 className="text-3xl font-black mb-1">Reports</h1>
                <p className="text-gray-500">CEO Dashboard & Trends.</p>
            </div>

            <ReportsWidget />
        </div>
    );
}
