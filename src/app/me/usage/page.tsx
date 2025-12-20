
"use client";

import { useState, useEffect } from "react";
import { Loader2, Database, Zap } from "lucide-react";
import { usePlatformStore } from "@/lib/store/platform-store";

export default function UserUsagePage() {
    const [usage, setUsage] = useState<any[]>([]);
    const [storageStatus, setStorageStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch personal usage
        // Note: We need an endpoint for *my* usage. 
        // We can reuse the same table but filtered by session user on server?
        // Let's call a new endpoint or the admin one (which would forbid us).
        // Let's create `api/me/usage`.

        async function load() {
            setLoading(true);
            try {
                const [resUsage, resStorage] = await Promise.all([
                    fetch("/api/me/usage").then(r => r.json()),
                    fetch("/api/me/storage/status").then(r => r.json())
                ]);
                if (resUsage.usage) setUsage(resUsage.usage);
                if (resStorage) setStorageStatus(resStorage);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;

    const totalTokens = usage.reduce((acc, curr) => acc + curr.tokens_used, 0);

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">My Usage & Quotas</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap size={64} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <Zap className="text-yellow-500" size={20} /> AI System Usage
                        </h2>
                        <div className="text-3xl font-bold mb-1">{totalTokens.toLocaleString()}</div>
                        <div className="text-sm text-slate-500 mb-4">Total Tokens Used (System Keys)</div>

                        <div className="space-y-2 mt-4">
                            <div className="text-xs font-semibold uppercase text-slate-400">Recent Days</div>
                            {usage.slice(0, 5).map((row, i) => (
                                <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                    <span>{new Date(row.day).toLocaleDateString()}</span>
                                    <span className="font-mono">{row.tokens_used.toLocaleString()} keys</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Storage Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Database size={64} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <Database className="text-blue-500" size={20} /> Storage Status
                        </h2>

                        {storageStatus?.isByo ? (
                            <div className="text-green-600 font-medium bg-green-50 dark:bg-green-900/20 p-3 rounded">
                                BYO Database Active
                            </div>
                        ) : (
                            <div>
                                <div className="text-3xl font-bold mb-1 text-slate-700 dark:text-slate-300">Trial</div>
                                <div className="text-sm text-slate-500 mb-4">Using Shared System Database</div>
                                {storageStatus?.daysLeft !== undefined && (
                                    <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 p-3 rounded border border-orange-100 dark:border-orange-800">
                                        <span className="font-bold text-orange-600">{storageStatus.daysLeft} Days Left</span> in Trial
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
