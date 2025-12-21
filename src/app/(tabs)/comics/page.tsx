"use client";

import { useState } from "react";
import { BookOpen, Layers } from "lucide-react";
import ComicForgeStudio from "@/components/comics/ComicForgeStudio";

const COMICS_TABS = [
    { id: "forge", label: "Forge", icon: BookOpen, description: "Composer-focused workspace" },
    { id: "library", label: "Library", icon: Layers, description: "Saved beats and references" },
] as const;

const SAMPLE_PROJECTS = [
    {
        title: "Rain Parade",
        palette: "noir",
        layout: "3x2",
        summary: "Stormy morning at the wall where quiet heroes share tea and secrets.",
        beats: ["A brooding watchman scans the horizon.", "A quiet confession beneath a dripping awning.", "A daring sprint captures the storm in exaggerated motion."],
    },
    {
        title: "Courier Sprint",
        palette: "cinematic",
        layout: "2x2",
        summary: "A courier races to deliver data before sundown, dodging holographic guards.",
        beats: ["Quick establishing shot of the city sprawl.", "Close-up on the courier’s determined face.", "Medium shot with the courier leaping over drones."],
    },
    {
        title: "Garden Toast",
        palette: "tinkle",
        layout: "1x2",
        summary: "In the academy garden the trio plans their next heist with pastel flair.",
        beats: ["Wide garden view, afternoon light.", "Detail on characters sharing notes.", "Panel with laughter and floating SFX."],
    },
] as const;

type SampleProject = (typeof SAMPLE_PROJECTS)[number];

type ComicTabId = (typeof COMICS_TABS)[number]["id"];

export default function ComicsPage() {
    const [activeTab, setActiveTab] = useState<ComicTabId>(COMICS_TABS[0].id);
    const [libraryModalProject, setLibraryModalProject] = useState<SampleProject | null>(null);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-12 text-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-8">
                <header className="space-y-3 text-center">
                    <div className="flex items-center justify-center gap-3">
                        <BookOpen className="h-8 w-8 text-cyan-400" />
                        <p className="text-xs uppercase tracking-[0.5em] text-slate-500">ComicForge</p>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">Programmatic Comics</h1>
                        <p className="text-sm text-slate-400">
                            Build cinematic story strips with deterministic seeds, panel layouts, and a simple UI that mirrors the Scriptable generator.
                        </p>
                    </div>
                </header>

                <div className="rounded-3xl border border-white/10 bg-slate-900/70 px-6 py-4 shadow-2xl">
                    <div className="flex flex-wrap items-center gap-3">
                        {COMICS_TABS.map((tab) => {
                            const isActive = tab.id === activeTab;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em] transition ${
                                        isActive
                                            ? "bg-cyan-500 text-slate-950 shadow-lg"
                                            : "border border-white/15 text-slate-200"
                                    }`}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                        <span className="ml-auto text-[11px] uppercase tracking-[0.4em] text-slate-500">
                            {COMICS_TABS.find((tab) => tab.id === activeTab)?.description}
                        </span>
                    </div>
                </div>

                <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-2xl">
                    {activeTab === "forge" ? (
                        <ComicForgeStudio />
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Library</p>
                                    <h2 className="text-2xl font-semibold">Seeded episodes</h2>
                                    <p className="text-sm text-slate-400">
                                        Peek into curated beats and load them back into the Forge when inspiration strikes.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setLibraryModalProject(SAMPLE_PROJECTS[0])}
                                    className="rounded-2xl border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
                                >
                                    Highlight a demo
                                </button>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                {SAMPLE_PROJECTS.map((project) => (
                                    <article key={project.title} className="space-y-2 rounded-3xl border border-white/10 bg-slate-900/60 p-5">
                                        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-slate-400">
                                            <span>{project.palette} palette</span>
                                            <span>{project.layout}</span>
                                        </div>
                                        <h3 className="text-xl font-bold">{project.title}</h3>
                                        <p className="text-sm text-slate-300">{project.summary}</p>
                                        <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.3em]">
                                            {project.beats.map((beat) => (
                                                <span key={beat} className="rounded-full border border-white/10 px-3 py-1 text-slate-200">
                                                    {beat}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setLibraryModalProject(project)}
                                                className="rounded-2xl border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.3em]"
                                            >
                                                View beats
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded-2xl bg-cyan-500 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-950"
                                            >
                                                Use as seed
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {libraryModalProject && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-8">
                        <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-slate-950/95 p-6 shadow-2xl">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Project snapshot</p>
                                    <h3 className="text-2xl font-bold">{libraryModalProject.title}</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setLibraryModalProject(null)}
                                    className="text-xs uppercase tracking-[0.3em] text-cyan-300"
                                >
                                    Close
                                </button>
                            </div>
                            <div className="mt-4 space-y-3 text-sm text-slate-200">
                                <p>{libraryModalProject.summary}</p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-white/10 p-3">
                                        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Palette</p>
                                        <p className="text-lg font-semibold">{libraryModalProject.palette}</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 p-3">
                                        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Layout</p>
                                        <p className="text-lg font-semibold">{libraryModalProject.layout}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Beats</p>
                                    <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-slate-300">
                                        {libraryModalProject.beats.map((beat) => (
                                            <li key={beat}>{beat}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
