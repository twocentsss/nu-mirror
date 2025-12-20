"use client";

import { useEffect, useState } from "react";

interface Story {
    id: string;
    date: string;
    narrative: string;
    type: string;
    model: string;
}

export default function StoryFeed({ refreshTrigger }: { refreshTrigger: number }) {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/story/instances')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStories(data.stories);
                }
            })
            .finally(() => setLoading(false));
    }, [refreshTrigger]);

    if (loading && stories.length === 0) {
        return <div className="text-zinc-500 text-sm p-4 text-center animate-pulse">Loading Ledger...</div>;
    }

    if (stories.length === 0) {
        return <div className="text-zinc-600 text-sm p-8 text-center border border-dashed border-zinc-800 rounded-xl">No stories recorded yet.</div>;
    }

    return (
        <div className="space-y-4">
            {stories.map(story => (
                <div key={story.id} className="p-5 border border-zinc-800 rounded-xl bg-zinc-950 hover:border-zinc-700 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${story.type === 'feature'
                                    ? 'bg-emerald-900/30 text-emerald-400'
                                    : 'bg-indigo-900/30 text-indigo-400'
                                }`}>
                                {story.type === 'day' ? 'Daily Audit' : story.type}
                            </span>
                            <span className="text-xs text-zinc-500 font-mono">
                                {new Date(story.date).toLocaleDateString()}
                            </span>
                        </div>
                        <span className="text-[10px] text-zinc-600 font-mono">{story.model}</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed indent-4 font-serif">
                        {story.narrative}
                    </p>
                </div>
            ))}
        </div>
    );
}
