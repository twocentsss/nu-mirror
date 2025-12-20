"use client";

import { useState } from "react";

export default function StoryGenerator({ onGenerate }: { onGenerate: () => void }) {
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'period' | 'feature'>('period');
    const [query, setQuery] = useState('');

    async function handleGenerate() {
        try {
            setLoading(true);
            const payload: any = { mode };

            if (mode === 'period') {
                payload.period = 'day';
            } else {
                payload.query = query;
            }

            await fetch('/api/story/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            onGenerate(); // Refresh parent
        } catch (e) {
            console.error(e);
            alert('Failed to generate story');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/50 mb-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Generate Narrative</h3>

            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setMode('period')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === 'period' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-zinc-800 text-zinc-400'
                        }`}
                >
                    Daily Audit
                </button>
                <button
                    onClick={() => setMode('feature')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === 'feature' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'
                        }`}
                >
                    Feature Arc
                </button>
            </div>

            {mode === 'feature' && (
                <input
                    type="text"
                    placeholder="e.g. Login, Dark Mode, T-101"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm mb-4 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                />
            )}

            <button
                onClick={handleGenerate}
                disabled={loading || (mode === 'feature' && !query)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Consulting the Ledger...' : mode === 'period' ? 'Generate Daily Narrative' : 'Trace Feature Journey'}
            </button>
        </div>
    );
}
