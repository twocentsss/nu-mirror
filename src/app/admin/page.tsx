
"use client";

import { useState } from "react";
import { SystemKeyManager } from "@/components/admin/SystemKeyManager";
import { UserUsageTable } from "@/components/admin/UserUsageTable";

export default function AdminPage() {
    const [tab, setTab] = useState<"keys" | "usage">("keys");

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Admin Dashboard</h1>

            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setTab("keys")}
                    className={`pb-2 px-4 ${tab === "keys" ? "border-b-2 border-primary font-semibold" : "text-slate-500"}`}
                >
                    System Keys
                </button>
                <button
                    onClick={() => setTab("usage")}
                    className={`pb-2 px-4 ${tab === "usage" ? "border-b-2 border-primary font-semibold" : "text-slate-500"}`}
                >
                    User Usage
                </button>
            </div>

            {tab === "keys" && <SystemKeyManager />}
            {tab === "usage" && <UserUsageTable />}
        </div>
    );
}
