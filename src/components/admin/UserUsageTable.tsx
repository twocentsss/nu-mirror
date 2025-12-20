
"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

type UsageRow = {
    user_email: string;
    day: string;
    tokens_used: number;
};

export function UserUsageTable() {
    const [usage, setUsage] = useState<UsageRow[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch("/api/admin/usage/list")
            .then(res => res.json())
            .then(data => {
                if (data.usage) setUsage(data.usage);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">User Usage (System Keys)</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-medium">
                        <tr>
                            <th className="p-3">User</th>
                            <th className="p-3">Date</th>
                            <th className="p-3 text-right">Tokens Used</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usage.map((row, i) => (
                            <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                                <td className="p-3 font-medium">{row.user_email}</td>
                                <td className="p-3">{new Date(row.day).toLocaleDateString()}</td>
                                <td className="p-3 text-right font-mono">{row.tokens_used.toLocaleString()}</td>
                                <td className="p-3 text-center">
                                    <button className="text-red-500 hover:underline text-xs" onClick={() => alert("Cap logic coming soon")}>
                                        Cap Limit
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {usage.length === 0 && (
                            <tr><td colSpan={4} className="p-4 text-center text-slate-500 italic">No usage recorded yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
