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
};

export default function OpenAiKeyManager() {
    const [keys, setKeys] = useState<KeyRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);

    const [newLabel, setNewLabel] = useState("");
    const [newKey, setNewKey] = useState("");

    async function fetchKeys() {
        setLoading(true);
        try {
            const res = await fetch("/api/llm/keys/list");
            if (res.ok) {
                const data = await res.json();
                setKeys(data.keys ?? []);
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
                    provider: newKey.startsWith("sk-or-") ? "openrouter" : (newKey.startsWith("AIza") ? "gemini" : "openai")
                }),
            });
            if (res.ok) {
                setNewLabel("");
                setNewKey("");
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

    return (
        <MirrorCard className="overflow-hidden p-0">
            <div className="bg-black/5 px-4 py-3 text-[13px] font-semibold text-black/60 flex justify-between items-center">
                <span>LLM Keys</span>
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

                    {keys.map((k) => (
                        <div key={k.id} className="flex items-center justify-between p-2 rounded hover:bg-black/5 transition group">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium text-black/80 truncate">
                                        {k.label || "(No label)"}
                                    </div>
                                    <span className={`text-[10px] px-1 rounded uppercase font-bold ${k.provider === 'openrouter' ? 'bg-purple-100 text-purple-600' : (k.provider === 'gemini' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600')}`}>
                                        {k.provider}
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
                    ))}
                </div>
            </div>
        </MirrorCard>
    );
}
