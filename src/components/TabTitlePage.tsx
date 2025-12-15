"use client";

import { MirrorCard } from "@/ui/MirrorCard";

export default function TabTitlePage({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="min-h-screen px-4 py-6 bg-[var(--app-bg)] text-[var(--text-primary)]">
            <MirrorCard className="max-w-2xl mx-auto p-6 sm:p-10">
                <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                {subtitle && <p className="mt-2 text-sm text-[var(--text-secondary)]">{subtitle}</p>}
                <div className="mt-6 text-[var(--text-secondary)] text-sm">
                    This view is intentionally simple for early exploration—stand by for richer UI components soon.
                </div>
            </MirrorCard>
        </div>
    );
}
