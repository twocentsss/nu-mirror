"use client";

import { useEffect, useState } from "react";
import { MirrorCard } from "@/ui/MirrorCard";
import TaskRow from "@/ui/TaskRow";

type KeyRow = {
    id: string;
    label: string;
    provider: string;
    created_at: string;
    disabled: boolean;
    daily_limit?: number;
    preferred?: boolean;
};

export default function OpenAiKeyManager() {
    const [keys, setKeys] = useState<KeyRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);

    const [newLabel, setNewLabel] = useState("");
    const [newKey, setNewKey] = useState("");
    const [newDailyLimit, setNewDailyLimit] = useState("");

    const [usage, setUsage] = useState<Record<string, { total: number }>>({});
    const [usageByKey, setUsageByKey] = useState<Record<string, number>>({});
    const [totalTokens, setTotalTokens] = useState(0);

    async function fetchKeys() {
        setLoading(true);
        try {
            const res = await fetch("/api/llm/keys/list");
            if (res.ok) {
                const data = await res.json();
                setKeys(data.keys ?? []);
            }
            // Also fetch usage
            const res2 = await fetch("/api/llm/usage");
            if (res2.ok) {
                const u = await res2.json();
                setUsage(u.byProvider || {});
                setUsageByKey(u.byKey || {});
                setTotalTokens(u.grandTotal || 0);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchKeys();
    }, []);

    async function addKey() {
        if (!newKey.trim()) return;
        setAdding(true);
        try {
            const res = await fetch("/api/llm/keys/add", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    label: newLabel,
                    apiKey: newKey.trim(),
                    provider: newKey.startsWith("sk-or-") ? "openrouter" : (newKey.startsWith("AIza") ? "gemini" : "openai"),
                    daily_limit: newDailyLimit ? Number(newDailyLimit) : 0
                }),
            });
            if (res.ok) {
                setNewLabel("");
                setNewKey("");
                setNewDailyLimit("");
                await fetchKeys();
            } else {
                const j = await res.json();
                alert(j.error ?? "Failed to add key");
            }
        } finally {
            setAdding(false);
        }
    }

    async function disableKey(keyId: string) {
        if (!confirm("Disable this key? It cannot be re-enabled.")) return;
        try {
            const res = await fetch("/api/llm/keys/disable", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ keyId }),
            });
            if (res.ok) {
                await fetchKeys();
            }
        } catch (e) {
            alert("Failed to disable");
        }
    }

    async function setPreferred(keyId: string) {
        try {
            const res = await fetch("/api/llm/keys/prefer", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ keyId }),
            });
            if (res.ok) {
                await fetchKeys();
            } else {
                alert("Failed to set preference");
            }
        } catch (e) {
            alert("Failed to set preference");
        }
    }

    return (
        <MirrorCard className="overflow-hidden p-0">
            <div className="bg-black/5 px-4 py-3 text-[13px] font-semibold text-black/60 flex justify-between items-center">
                <div className="flex flex-col">
                    <span>LLM Keys</span>
                    {totalTokens > 0 && <span className="text-[10px] text-black/40 font-normal">Used {totalTokens} tokens today</span>}
                </div>
                <button
                    onClick={fetchKeys}
                    disabled={loading}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                    Refresh
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Add Key Form */}
                <div className="bg-black/5 rounded-lg p-3 space-y-2">
                    <div className="text-xs font-medium text-black/50 uppercase">Add New Key</div>
                    <input
                        className="w-full text-sm rounded bg-white border border-black/10 px-2 py-1 outline-none focus:border-blue-500"
                        placeholder="Label (e.g. OpenRouter Team)"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                    />
                    <input
                        className="w-full text-sm rounded bg-white border border-black/10 px-2 py-1 outline-none focus:border-blue-500"
                        placeholder="Daily Token Limit (0 = unlimited)"
                        type="number"
                        value={newDailyLimit}
                        onChange={(e) => setNewDailyLimit(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <input
                            type="password"
                            className="flex-1 text-sm rounded bg-white border border-black/10 px-2 py-1 outline-none focus:border-blue-500"
                            placeholder="sk-..."
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                        />
                        <button
                            disabled={adding || !newKey}
                            onClick={addKey}
                            className="bg-black text-white text-xs font-semibold px-3 py-1 rounded shadow-sm hover:opacity-80 disabled:opacity-50"
                        >
                            {adding ? "Adding..." : "Add"}
                        </button>
                    </div>
                    <div className="text-[10px] text-black/40">
                        * Provider detected automatically (sk-or- = OpenRouter, AIza = Gemini, else OpenAI)
                    </div>
                </div>

                {/* Key List */}
                <div className="space-y-1">
                    {loading && keys.length === 0 && <div className="text-xs text-black/40 p-2">Loading keys...</div>}
                    {!loading && keys.length === 0 && <div className="text-xs text-black/40 p-2">No keys found. Add one above.</div>}

                    {keys.map((k) => {
                        const used = usageByKey[k.id] || 0;
                        const limit = k.daily_limit || 0;
                        const limitText = limit > 0 ? `${used}/${limit}` : `${used}`;
                        const isOverLimit = limit > 0 && used >= limit;

                        return (
                            <div key={k.id} className="flex items-center justify-between p-2 rounded hover:bg-black/5 transition group">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => !k.preferred && setPreferred(k.id)}
                                            className={`text-sm ${k.preferred ? "text-yellow-500 cursor-default" : "text-gray-300 hover:text-yellow-400"}`}
                                            title={k.preferred ? "Primary key" : "Set as primary"}
                                        >
                                            ⭐
                                        </button>
                                        <div className="text-sm font-medium text-black/80 truncate">
                                            {k.label || "(No label)"}
                                        </div>
                                        <span className={`text-[10px] px-1 rounded uppercase font-bold ${k.provider === 'openrouter' ? 'bg-purple-100 text-purple-600' : (k.provider === 'gemini' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600')}`}>
                                            {k.provider}
                                        </span>
                                        {/* Usage Badge */}
                                        <span className={`text-[10px] px-1 rounded border ${isOverLimit ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                            {limitText} toks
                                        </span>
                                        {k.disabled && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">DISABLED</span>}
                                    </div>
                                    <div className="text-[11px] text-black/40 font-mono truncate">
                                        Created: {new Date(k.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                {!k.disabled && (
                                    <button
                                        onClick={() => disableKey(k.id)}
                                        className="text-xs p-1 text-red-500 opacity-0 group-hover:opacity-100 transition hover:bg-red-50 rounded"
                                    >
                                        Disable
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </MirrorCard >
    );
}

