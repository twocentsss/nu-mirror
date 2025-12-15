"use client";

import { useEffect, useState } from "react";
import { MirrorCard } from "@/ui/MirrorCard";
import TaskRow from "@/ui/TaskRow";
import { Star } from "lucide-react";

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
        // Optimistic update: immediately update local state for snappy feel
        const oldKeys = [...keys];
        setKeys(prev => prev.map(k => ({
            ...k,
            preferred: k.id === keyId
        })));

        try {
            const res = await fetch("/api/llm/keys/prefer", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ keyId }),
            });

            if (res.ok) {
                // Background refresh to ensure sync, but user already sees result
                fetchKeys();
            } else {
                // Revert on failure
                setKeys(oldKeys);
                alert("Failed to save preference");
            }
        } catch (e) {
            setKeys(oldKeys);
            alert("Network error setting preference");
        }
    }

    return (
        <MirrorCard className="overflow-hidden p-0">
            <div className="bg-[var(--glass-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--text-secondary)] flex justify-between items-center border-b border-[var(--glass-border)]">
                <div className="flex flex-col">
                    <span className="text-[var(--text-primary)]">LLM Keys</span>
                    {totalTokens > 0 && <span className="text-[10px] text-[var(--text-secondary)] font-normal">Used {totalTokens} tokens today</span>}
                </div>
                <button
                    onClick={fetchKeys}
                    disabled={loading}
                    className="text-xs text-[var(--accent-color)] hover:opacity-80 disabled:opacity-50"
                >
                    Refresh
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Add Key Form */}
                <div className="bg-[var(--glass-bg)] rounded-lg p-3 space-y-2 border border-[var(--glass-border)]">
                    <div className="text-xs font-medium text-[var(--text-secondary)] uppercase">Add New Key</div>
                    <input
                        className="w-full text-sm rounded bg-transparent border border-[var(--glass-border)] px-2 py-1 outline-none focus:border-[var(--accent-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50"
                        placeholder="Label (e.g. OpenRouter Team)"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                    />
                    <input
                        className="w-full text-sm rounded bg-transparent border border-[var(--glass-border)] px-2 py-1 outline-none focus:border-[var(--accent-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50"
                        placeholder="Daily Token Limit (0 = unlimited)"
                        type="number"
                        value={newDailyLimit}
                        onChange={(e) => setNewDailyLimit(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <input
                            type="password"
                            className="flex-1 text-sm rounded bg-transparent border border-[var(--glass-border)] px-2 py-1 outline-none focus:border-[var(--accent-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50"
                            placeholder="sk-..."
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                        />
                        <button
                            disabled={adding || !newKey}
                            onClick={addKey}
                            className="bg-[var(--accent-color)] text-white text-xs font-semibold px-3 py-1 rounded shadow-sm hover:opacity-80 disabled:opacity-50"
                        >
                            {adding ? "Adding..." : "Add"}
                        </button>
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)]">
                        * Provider detected automatically (sk-or- = OpenRouter, AIza = Gemini, else OpenAI)
                    </div>
                </div>

                {/* Key List */}
                <div className="space-y-2">
                    {loading && keys.length === 0 && <div className="text-xs text-[var(--text-secondary)] p-2">Loading keys...</div>}
                    {!loading && keys.length === 0 && <div className="text-xs text-[var(--text-secondary)] p-2">No keys found. Add one above.</div>}

                    {keys.map((k) => {
                        const used = usageByKey[k.id] || 0;
                        const limit = k.daily_limit || 0;
                        const limitText = limit > 0 ? `${used}/${limit}` : `${used}`;
                        const isOverLimit = limit > 0 && used >= limit;

                        return (
                            <div
                                key={k.id}
                                className={`
                                    flex items-center justify-between p-3 rounded-xl transition-all duration-200 border
                                    ${k.preferred
                                        ? "bg-[var(--accent-color)]/10 border-[var(--accent-color)] shadow-sm"
                                        : "bg-transparent border-transparent hover:bg-[var(--glass-bg)] hover:border-[var(--glass-border)]"
                                    }
                                `}
                            >
                                {/* Left Info Group */}
                                <div className="flex-1 min-w-0 flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`text-sm font-bold truncate ${k.preferred ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                                            {k.label || "(No label)"}
                                        </div>
                                        {/* Badges */}
                                        <div className="flex items-center gap-1">
                                            <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md ${k.provider === 'openrouter' ? 'bg-purple-500/20 text-purple-400' :
                                                    (k.provider === 'gemini' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400')
                                                }`}>
                                                {k.provider}
                                            </span>
                                            {k.preferred && (
                                                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md bg-[var(--accent-color)] text-white">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-[10px] text-[var(--text-secondary)]">
                                        <span className={isOverLimit ? "text-red-400 font-bold" : ""}>
                                            {limitText} tokens used
                                        </span>
                                        <span className="opacity-50">•</span>
                                        <span className="font-mono opacity-70">
                                            {new Date(k.created_at).toLocaleDateString()}
                                        </span>
                                        {!k.disabled && (
                                            <button
                                                onClick={() => disableKey(k.id)}
                                                className="text-red-400 hover:text-red-300 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Disable
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Right Action Button */}
                                <div className="ml-4 flex-shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (!k.preferred) setPreferred(k.id);
                                        }}
                                        disabled={k.preferred}
                                        className={`
                                            h-9 px-5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center min-w-[80px]
                                            ${k.preferred
                                                ? "bg-[var(--accent-color)] text-white cursor-default shadow-md"
                                                : "bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-gradient)]"
                                            }
                                        `}
                                    >
                                        {k.preferred ? "Selected" : "Select"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </MirrorCard >
    );
}

