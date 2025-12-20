"use client";

import { useEffect, useState } from "react";
import { MirrorCard } from "@/ui/MirrorCard";
import { Star } from "lucide-react";
import { LlmProvider } from "@/lib/llm/keyStore";
type KeyRow = {
    id: string;
    label: string;
    provider: string;
    created_at: string;
    disabled: boolean;
    daily_limit?: number;
    preferred?: boolean | string | number;
};

const PROVIDER_ORDER: LlmProvider[] = ["openai", "openrouter", "anthropic", "gemini"];

const PROVIDER_META: Record<LlmProvider, { label: string; border: string; text: string; bg: string }> = {
    openai: {
        label: "OpenAI",
        border: "border-emerald-400/70",
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
    },
    openrouter: {
        label: "OpenRouter",
        border: "border-slate-400/70",
        text: "text-slate-400",
        bg: "bg-slate-500/10",
    },
    gemini: {
        label: "Gemini",
        border: "border-sky-400/70",
        text: "text-sky-400",
        bg: "bg-sky-500/10",
    },
    anthropic: {
        label: "Anthropic",
        border: "border-orange-400/70",
        text: "text-orange-400",
        bg: "bg-orange-500/10",
    },
};

const prefers = (target?: KeyRow["preferred"]) =>
    target === true || target === 1 || target === "1";

export default function OpenAiKeyManager() {
    const [keys, setKeys] = useState<KeyRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [preferringKeyId, setPreferringKeyId] = useState<string | null>(null);

    const [newLabel, setNewLabel] = useState("");
    const [newKey, setNewKey] = useState("");
    const [newDailyLimit, setNewDailyLimit] = useState("");
    const [toast, setToast] = useState<string | null>(null);

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

    useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(null), 3200);
        return () => clearTimeout(timer);
    }, [toast]);

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
                    provider: newKey.startsWith("sk-or-") ? "openrouter" : (newKey.startsWith("AIza") ? "gemini" : (newKey.startsWith("sk-ant-") ? "anthropic" : "openai")),
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
        if (preferringKeyId) return;
        setPreferringKeyId(keyId);

        const oldKeys = [...keys];
        const selectedKey = keys.find((k) => k.id === keyId);
        const selectedLabel = selectedKey ? (selectedKey.label || selectedKey.provider) : "selected AI";
        setKeys((prev) =>
            prev.map((k) => ({
                ...k,
                preferred: k.id === keyId,
            })),
        );

        try {
            const res = await fetch("/api/llm/keys/prefer", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ keyId }),
            });

            if (!res.ok) {
                setKeys(oldKeys);
                const errorBody = await res.json().catch(() => null);
                setToast(errorBody?.error ?? "Failed to save preference");
                return;
            }

            await fetchKeys();
            setToast(`Default AI changed to ${selectedLabel}`);
        } catch (e) {
            setKeys(oldKeys);
            setToast("Network error setting preference");
        } finally {
            setPreferringKeyId(null);
        }
    }

    const activeKey = keys.find((k) => prefers(k.preferred));

    return (
        <MirrorCard className="overflow-hidden p-0" tilt={false}>
            <div className="bg-[var(--glass-bg)] px-4 py-3 text-[13px] font-semibold text-[var(--text-secondary)] flex justify-between items-center border-b border-[var(--glass-border)]">
                <div className="flex flex-col gap-1">
                    <span className="text-[var(--text-primary)]">LLM Keys</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-normal">
                        {activeKey
                            ? `Active: ${activeKey.label || activeKey.provider}`
                            : "No primary model selected, pick a key below"}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-normal">
                        {totalTokens > 0 ? `Used ${totalTokens} tokens today` : "No tokens used yet"}
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {PROVIDER_ORDER.map((provider) => {
                            const stat = usage[provider]?.total ?? 0;
                            const meta = PROVIDER_META[provider];
                            return (
                                <span
                                    key={provider}
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.border} ${meta.text} ${meta.bg}`}
                                >
                                    {meta.label}
                                    <span className="font-normal text-[var(--text-secondary)]">{stat} tokens</span>
                                </span>
                            );
                        })}
                    </div>
                    {toast && (
                        <div className="text-xs text-emerald-500 font-semibold">{toast}</div>
                    )}
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
                        const isPreferredRow = prefers(k.preferred);

                        const handleCardSelect = () => {
                            if (isPreferredRow || preferringKeyId || k.disabled) return;
                            setPreferred(k.id);
                        };

                        const prefProvider = (k.provider as LlmProvider) ?? "openai";
                        const providerMeta = PROVIDER_META[prefProvider];
                        const baseCardClasses =
                            "group flex items-center justify-between p-3 rounded-xl transition-all duration-200 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--glass-bg)]";
                        const preferredClasses = `${providerMeta.bg} ${providerMeta.border} shadow-sm hover:shadow-lg`;
                        const defaultClasses =
                            "bg-transparent border-transparent hover:bg-[var(--glass-bg)] hover:border-[var(--glass-border)] hover:shadow-md";
                        const busyClasses = preferringKeyId === k.id ? "opacity-80 cursor-wait" : "";
                        const buttonDisabled = Boolean(preferringKeyId) || k.disabled;
                        const isButtonBusy = preferringKeyId === k.id;
                        const titleTextClass = isPreferredRow ? providerMeta.text : "text-[var(--text-secondary)]";

                        return (
                            <div
                                key={k.id}
                                role="button"
                                tabIndex={0}
                                aria-pressed={isPreferredRow}
                                onClick={handleCardSelect}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        handleCardSelect();
                                    }
                                }}
                                className={`${baseCardClasses} ${isPreferredRow ? `${preferredClasses} ${providerMeta.text}` : defaultClasses} ${busyClasses}`}
                            >
                                {/* Left Info Group */}
                                <div className="flex-1 min-w-0 flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`text-sm font-bold truncate ${titleTextClass}`}>
                                            {k.label || "(No label)"}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span
                                                className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md ${k.provider === "openrouter"
                                                        ? "bg-purple-500/20 text-purple-400"
                                                        : k.provider === "gemini"
                                                            ? "bg-blue-500/20 text-blue-400"
                                                            : k.provider === "anthropic"
                                                                ? "bg-orange-500/20 text-orange-400"
                                                                : "bg-green-500/20 text-green-400"
                                                    }`}
                                            >
                                                {k.provider}
                                            </span>
                                            {isPreferredRow && (
                                                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md bg-[var(--accent-color)] text-white">
                                                    Primary
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
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        disableKey(k.id);
                                                    }}
                                                    className="text-red-400 hover:text-red-300 hover:underline transition-opacity"
                                                >
                                                    Disable
                                                </button>
                                                {!isPreferredRow && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPreferred(k.id);
                                                        }}
                                                        type="button"
                                                        className="px-3 py-1 ml-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold shadow-lg shadow-purple-400/40"
                                                    >
                                                        Set Default
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Right Action Button */}
                                <div className="ml-4 flex-shrink-0 z-20">
                                    {isPreferredRow ? (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!preferringKeyId && !k.disabled) {
                                                    setPreferred(k.id);
                                                }
                                            }}
                                            disabled={Boolean(preferringKeyId) || k.disabled}
                                            className="h-8 px-4 rounded-md bg-green-500 text-white font-bold text-xs shadow flex items-center gap-1 hover:opacity-90 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                            aria-label="Re-apply default key"
                                            title="Click to re-apply default"
                                        >
                                            <Star size={12} fill="currentColor" />
                                            PRIMARY
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!buttonDisabled) {
                                                    setPreferred(k.id);
                                                }
                                            }}
                                            disabled={buttonDisabled}
                                            className="h-8 px-4 rounded-md bg-white border border-gray-200 text-black font-bold text-xs shadow-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 active:scale-95 active:bg-blue-100 transition-all duration-75 cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {isButtonBusy ? "Saving..." : "Make Default"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </MirrorCard >
    );
}
