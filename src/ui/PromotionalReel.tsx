"use client";

import React from 'react';
import Link from 'next/link';

const ADS = [
    { slug: "today", title: "The Horizon", tagline: "Win the day.", invitation: "Begin your ascent.", color: "from-blue-600 to-indigo-600" },
    { slug: "bingo", title: "The Game", tagline: "Chores into wins.", invitation: "Play to progress.", color: "from-purple-600 to-pink-600" },
    { slug: "focus", title: "The Sanctuary", tagline: "The world can wait.", invitation: "Enter the quiet.", color: "from-emerald-600 to-teal-600" },
    { slug: "learning", title: "The Mastery", tagline: "Steps, not leaps.", invitation: "Claim your edge.", color: "from-orange-600 to-red-600" },
    { slug: "social", title: "The Circle", tagline: "Deep ties only.", invitation: "Reconnect now.", color: "from-sky-600 to-blue-600" },
    { slug: "comics", title: "The Story", tagline: "See your growth.", invitation: "Behold your saga.", color: "from-fuchsia-600 to-purple-600" },
    { slug: "reports", title: "The Evidence", tagline: "Pattern recognition.", invitation: "Face the data.", color: "from-slate-600 to-zinc-600" },
    { slug: "solve", title: "The Solution", tagline: "SCQA Mastery.", invitation: "Solve the unsolvable.", color: "from-cyan-600 to-blue-600" },
    { slug: "sprint", title: "The Momentum", tagline: "Unstoppable flow.", invitation: "Ignite your drive.", color: "from-rose-600 to-orange-600" },
    { slug: "stories", title: "The Narrative", tagline: "Life as a masterpiece.", invitation: "Draft your legacy.", color: "from-violet-600 to-indigo-600" },
];

export function PromotionalReel() {
    // Duplicate for seamless scroll
    const reelItems = [...ADS, ...ADS, ...ADS];

    return (
        <div className="relative w-full overflow-hidden py-20 bg-black/50">
            <div className="flex gap-8 animate-scroll whitespace-nowrap">
                {reelItems.map((ad, idx) => (
                    <Link
                        key={`${ad.slug}-${idx}`}
                        href={`/${ad.slug}`}
                        className="group relative inline-block w-[300px] shrink-0"
                    >
                        <div className={`aspect-[9/16] rounded-[2rem] p-8 flex flex-col justify-end gap-2 overflow-hidden bg-gradient-to-br ${ad.color} transition-transform duration-500 group-hover:scale-[1.02] shadow-2xl`}>
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-1">Alfred Protocol</p>
                                <h3 className="text-3xl font-black text-white leading-tight">{ad.title}</h3>
                                <p className="text-sm font-bold text-white/80 lowercase italic mb-4">{ad.tagline}</p>

                                <div className="space-y-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                    <p className="text-xl font-bold text-white tracking-tight">{ad.invitation}</p>
                                    <div className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                                        <span>Enter Horizon</span>
                                        <div className="w-8 h-px bg-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
