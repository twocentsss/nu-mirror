"use client";

import { useState } from "react";

import StoryFeed from "@/components/story/StoryFeed";
import StoryStudio from "@/components/story/StoryStudio";
import { StoryHeader, StoryViewMode } from "@/components/story/StoryHeader";

export default function StoriesPage() {
    const [viewMode, setViewMode] = useState<StoryViewMode>("FEED");
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)] pb-20">
            <div className="px-4 py-6 max-w-xl mx-auto">
                <div className="mb-6 flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">Stories</h1>
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">The Narrative Ledger of your work.</p>
                    </div>

                    <StoryHeader mode={viewMode} setMode={setViewMode} />
                </div>

                {viewMode === "STUDIO" ? (
                    <StoryStudio onGenerate={() => {
                        setRefreshTrigger(n => n + 1);
                        setViewMode("FEED"); // Auto-switch to feed to see result
                    }} />
                ) : (
                    <StoryFeed refreshTrigger={refreshTrigger} />
                )}
            </div>
        </div>
    );
}
