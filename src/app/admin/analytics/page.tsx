import React from 'react';
import { getDailyMetrics, aggregatePlatformMetrics } from "@/lib/analytics/telemetryStore";
import { headers } from "next/headers";

// Force dynamic rendering so we always get fresh data
export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
    // Just to ensure we have headers context if needed (e.g. auth check)
    const _ = await headers();

    // Calculate dates: Last 7 days
    const today = new Date();
    const endDay = today.toISOString().split('T')[0];
    const startDayDate = new Date();
    startDayDate.setDate(today.getDate() - 7);
    const startDay = startDayDate.toISOString().split('T')[0];

    // Trigger aggregation for today on load (simple trigger for demo)
    // In production, this would be a background job.
    try {
        await aggregatePlatformMetrics(endDay);
    } catch (e) {
        console.error("Aggregation failed", e);
    }

    const metrics = await getDailyMetrics(startDay, endDay);

    // Group metrics by day
    const metricsByDay: Record<string, Record<string, number>> = {};
    metrics.forEach(m => {
        if (!metricsByDay[m.day]) metricsByDay[m.day] = {};
        metricsByDay[m.day][m.metric_key] = Number(m.value);
    });

    const dates = Object.keys(metricsByDay).sort();
    const latestDate = dates[dates.length - 1];
    const latestMetrics = metricsByDay[latestDate] || {};

    // Narrative Builders
    const dau = latestMetrics['platform.dau'] || 0;

    // Life
    const tasksCreated = latestMetrics['life.tasks.created'] || 0;
    const tasksCompleted = latestMetrics['life.tasks.completed'] || 0;
    const netTasks = latestMetrics['life.tasks.net'] || 0;
    const goalsClosed = latestMetrics['life.goals.closed'] || 0;
    const projectsClosed = latestMetrics['life.projects.closed'] || 0;

    // Story
    const storiesGen = latestMetrics['story.generated.count'] || 0;
    const storyChars = latestMetrics['story.generated.characters'] || 0;
    const storyEmotions = latestMetrics['story.generated.emotions'] || 0;
    const storyScenes = latestMetrics['story.generated.scenes'] || 0;

    // Social & Games
    const socialActions = latestMetrics['social.actions'] || 0;
    const gameActions = latestMetrics['game.actions'] || 0;


    return (
        <div className="p-8 max-w-6xl mx-auto space-y-12 text-slate-100 bg-slate-950 font-sans">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-indigo-500 bg-clip-text text-transparent mb-2">
                    Platform Telemetry
                </h1>
                <p className="text-slate-400">Observing the narrative of {dau.toLocaleString()} Daily Active Users</p>
            </div>

            {/* Narrative Card - The "Big Story" */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
                <h2 className="text-xl font-semibold text-slate-300 mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live Narrative
                </h2>

                <div className="space-y-6 text-2xl leading-relaxed text-slate-200 font-light">
                    <p>
                        We are serving <b className="text-white font-medium">{dau.toLocaleString()} active users</b> today,
                        who are actively engaged across <span className="text-indigo-400">Life</span>, <span className="text-pink-400">Games</span>, <span className="text-blue-400">Social</span>, and <span className="text-amber-400">Story</span>.
                    </p>

                    <p>
                        In <span className="text-indigo-400 font-medium">Life</span>, our users are taking action. They created <b className="text-white">{tasksCreated.toLocaleString()} tasks</b> today.
                        More importantly, they closed <b className="text-emerald-400">{goalsClosed.toLocaleString()} core goals</b> and finished <b className="text-emerald-400">{projectsClosed.toLocaleString()} projects</b>.
                        We are seeing a net of <b className="text-white">{netTasks > 0 ? '+' : ''}{netTasks.toLocaleString()}</b> task closure velocity.
                    </p>

                    <p>
                        In <span className="text-amber-400 font-medium">Story</span>, imagination is running wild.
                        We generated <b className="text-white">{storiesGen.toLocaleString()} stories</b>, bringing to life <b className="text-amber-200">{storyChars.toLocaleString()} characters</b>
                        who displayed <b className="text-rose-300">{storyEmotions.toLocaleString()} emotions</b> across <b className="text-amber-200">{storyScenes.toLocaleString()} scenes</b>.
                    </p>
                </div>
            </div>

            {/* Domain Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard title="Life Activity" value={tasksCompleted} label="Tasks Done" color="indigo" />
                <MetricCard title="Story Volume" value={storiesGen} label="Stories Gen" color="amber" />
                <MetricCard title="Social Buzz" value={socialActions} label="Interactions" color="blue" />
                <MetricCard title="Game Play" value={gameActions} label="Actions" color="pink" />
            </div>

            {/* Raw Data Table (hidden by default or small) */}
            <div className="mt-12 pt-8 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase">Raw Daily Metrics (Last 7 Days)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="text-xs uppercase bg-slate-900 text-slate-300">
                            <tr>
                                <th className="px-4 py-2">Metric</th>
                                {dates.map(d => <th key={d} className="px-4 py-2">{d.slice(5)}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {[
                                'platform.dau',
                                'life.tasks.created',
                                'life.tasks.completed',
                                'story.generated.count',
                                'social.actions'
                            ].map(key => (
                                <tr key={key} className="hover:bg-slate-900/40">
                                    <td className="px-4 py-2 font-mono text-slate-500">{key}</td>
                                    {dates.map(d => (
                                        <td key={d} className="px-4 py-2">
                                            {(metricsByDay[d][key] || 0).toLocaleString()}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, label, color }: { title: string, value: number, label: string, color: string }) {
    const colorClasses: Record<string, string> = {
        indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
        amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        pink: "bg-pink-500/10 border-pink-500/20 text-pink-400",
    };

    return (
        <div className={`p-6 rounded-xl border backdrop-blur-sm ${colorClasses[color] || colorClasses.indigo}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{title}</h3>
            <div className="text-3xl font-bold text-white mb-1">{value.toLocaleString()}</div>
            <div className="text-sm opacity-60">{label}</div>
        </div>
    );
}
