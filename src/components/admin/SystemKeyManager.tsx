
"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

type SystemKey = {
    key_id: string;
    provider: string;
    label: string;
    limit: number;
    is_active: boolean;
};

export function SystemKeyManager() {
    const [keys, setKeys] = useState<SystemKey[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [provider, setProvider] = useState("openai");
    const [apiKey, setApiKey] = useState("");
    const [label, setLabel] = useState("");
    const [limit, setLimit] = useState(10000);

    const loadKeys = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/keys/list");
            const data = await res.json();
            if (data.keys) setKeys(data.keys);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadKeys(); }, []);

    const handleAdd = async () => {
        if (!apiKey) return;
        try {
            const res = await fetch("/api/admin/keys/add", {
                method: "POST",
                body: JSON.stringify({ provider, apiKey, label, limit })
            });
            if (!res.ok) {
                const err = await res.json();
                alert("Failed to add key: " + (err.error || res.statusText));
                return;
            }
            setApiKey("");
            setLabel("");
            loadKeys();
        } catch (e) {
            alert("Failed to add key: Network error");
        }
    };


    const handleDelete = async (id: string) => {
        if (!confirm("Delete this system key?")) return;
        await fetch("/api/admin/keys/delete", {
            method: "POST",
            body: JSON.stringify({ key_id: id })
        });
        loadKeys();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Add System Key</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium mb-1">Provider</label>
                        <select
                            value={provider}
                            onChange={e => setProvider(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-slate-800"
                        >
                            <option value="openai">OpenAI</option>
                            <option value="gemini">Gemini</option>
                            <option value="openrouter">OpenRouter</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Label (Optional)</label>
                        <input
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-slate-800"
                            placeholder="e.g. Primary Backup"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">API Key</label>
                        <input
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            type="password"
                            className="w-full p-2 border rounded dark:bg-slate-800"
                            placeholder="sk-..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Daily Token Limit</label>
                        <input
                            type="number"
                            value={limit}
                            onChange={e => setLimit(Number(e.target.value))}
                            className="w-full p-2 border rounded dark:bg-slate-800"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={!apiKey}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                    >
                        <Plus size={16} /> Add Key
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-semibold mb-4">Active System Keys</h3>
                {loading ? <Loader2 className="animate-spin" /> : (
                    <div className="space-y-2">
                        {keys.map(k => (
                            <div key={k.key_id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded border">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">{k.provider}</span>
                                    <span className="font-medium">{k.label || "Untitled"}</span>
                                    <span className="text-xs text-slate-500">Limit: {k.limit.toLocaleString()}</span>
                                </div>
                                <button onClick={() => handleDelete(k.key_id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {keys.length === 0 && <p className="text-slate-500 italic">No system keys active.</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
