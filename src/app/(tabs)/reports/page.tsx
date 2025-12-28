"use server";

import { FlowEvent } from "@/lib/core/types";
import { computeTrend } from "@/lib/reporting/stats";
import { getFlowEvents } from "@/lib/features/ledger/accounting";
import { getAccountSpreadsheetId } from "@/lib/google/accountSpreadsheet";
import { authOptions } from "@/app/api/auth/authOptions";
import { getServerSession, type Session } from "next-auth";
import ReportControls from "@/components/ReportControls";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import ReportTabs from "@/components/ReportTabs";

type MetricDefinition = {
  id: string;
  label: string;
  unit: string;
  description: string;
  focus: string;
  color: string;
  filter: (event: FlowEvent) => boolean;
  insight: (trend: { percent: number; label: string }) => string;
  lfId: number;
};

type MetricData = {
  id: string;
  label: string;
  unit: string;
  description: string;
  focus: string;
  color: string;
  series: { date: string; value: number }[];
  stats: {
    total: number;
    avg: number;
    min: number;
    max: number;
    days: number;
  };
  trendPercent: number;
  trendLabel: string;
  narrative: string;
  globalMax: number;
};

const LIFE_FOCUS_METRICS: Array<{
  lfId: number;
  id: string;
  label: string;
  description: string;
  color: string;
}> = [
    { lfId: 1, id: "core", label: "Core", description: "Identity, faith, meaning, and scripts.", color: "#f43f5e" },
    { lfId: 2, id: "self", label: "Self", description: "Heart, body, mind, recovery systems.", color: "#a855f7" },
    { lfId: 3, id: "circle", label: "Circle", description: "Family, marriage, friends, and social capital.", color: "#22d3ee" },
    { lfId: 4, id: "grind", label: "Grind", description: "Work, responsibilities, and the economic engine.", color: "#475569" },
    { lfId: 5, id: "level_up", label: "Level Up", description: "Skills, business building, and growth investments.", color: "#10b981" },
    { lfId: 6, id: "impact", label: "Impact", description: "Giving back, community, and nature.", color: "#14b8a6" },
    { lfId: 7, id: "play", label: "Play", description: "Creativity, exploration, travel, and joy.", color: "#f97316" },
    { lfId: 8, id: "insight", label: "Insight", description: "Knowledge, philosophy, and strategic thinking.", color: "#f59e0b" },
    { lfId: 9, id: "chaos", label: "Chaos", description: "The unexpected, entropy, and systems resilience.", color: "#ef4444" },
  ];

const METRIC_DEFINITIONS: MetricDefinition[] = buildLifeFocusMetrics();

const chartFamilies = ["rings", "bars", "heatmap", "pie", "line", "swimlane"];

export default async function ReportsPage() {
  const session = (await getServerSession(authOptions)) as
    | (Session & { accessToken?: string; refreshToken?: string })
    | null;
  const accessToken = session?.accessToken;
  const refreshToken = session?.refreshToken;
  let spreadsheetId = process.env.SHEETS_ID;

  // Try to get spreadsheet ID but don't fail if not available
  if (session?.user?.email) {
    const account = await getAccountSpreadsheetId({
      accessToken,
      refreshToken,
      userEmail: session.user.email,
    }).catch((error) => {
      console.error("Failed to resolve spreadsheet ID on Reports page", error);
      return null;
    });
    if (account?.spreadsheetId) {
      spreadsheetId = account.spreadsheetId;
    }
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now);
  const { prevStart, prevEnd } = getPreviousRange(startOfMonth, endOfMonth);

  const userEmail = session?.user?.email ?? undefined;
  const fetchOpts = { spreadsheetId, accessToken, refreshToken, userEmail };

  // Fetch events - if spreadsheetId is undefined, getFlowEvents will use database
  const currentEvents = await getFlowEvents(startOfMonth.toISOString(), endOfMonth.toISOString(), fetchOpts).catch(() => []);
  const previousEvents = await getFlowEvents(prevStart.toISOString(), prevEnd.toISOString(), fetchOpts).catch(() => []);

  const metrics = METRIC_DEFINITIONS.map((definition) =>
    buildMetricData(definition, currentEvents, previousEvents, startOfMonth, endOfMonth, prevStart, prevEnd)
  );

  const ordered = metrics
    .map((metric, index) => ({
      metric,
      chart: chartFamilies[(hashString(metric.id) + index) % chartFamilies.length],
    }))
    .sort((a, b) => a.metric.id.localeCompare(b.metric.id));

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white space-y-10">
      <header className="max-w-4xl space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">CEO Visual Randomizer</p>
        <h1 className="text-4xl font-black">Randomized Report Lab</h1>
        <p className="text-2xl font-medium text-slate-100 italic">9 areas. Infinite intersections.</p>
        <ReportControls />
      </header>

      <ReportTabs ordered={ordered} />
    </div>
  );
}

function RandomChartCard({ metric, chartFamily }: { metric: MetricData; chartFamily: string }) {
  const normalizedMax = Math.max(metric.globalMax, 1);
  const fillPercent = Math.min(1, normalizedMax ? metric.stats.avg / normalizedMax : 0);
  const TrendIcon = metric.trendPercent > 0 ? TrendingUp : metric.trendPercent < 0 ? TrendingDown : Minus;
  const trendColor =
    metric.trendPercent > 0 ? "text-emerald-300" : metric.trendPercent < 0 ? "text-rose-300" : "text-slate-400";

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl">
      <header className="flex justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400">{metric.focus}</p>
          <h2 className="text-2xl font-black">{metric.label}</h2>
          <p className="text-xs text-slate-300">{metric.description}</p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
          {TrendIcon && <TrendIcon className="h-4 w-4" />}
          <span>{Math.round(metric.trendPercent)}%</span>
        </div>
      </header>

      <div className="mt-6">{renderChart(chartFamily, metric, normalizedMax, fillPercent)}</div>

      <footer className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-300 space-y-1">
        <p>Total <span className="font-semibold">{Math.round(metric.stats.total)}</span> {metric.unit}</p>
        <p>Avg <span className="font-semibold">{Math.round(metric.stats.avg)}</span> {metric.unit}</p>
        <p className="italic text-slate-400">“{metric.narrative}”</p>
      </footer>
    </article>
  );
}

function renderChart(chartFamily: string, metric: MetricData, normalizedMax: number, fillPercent: number) {
  switch (chartFamily) {
    case "rings":
      return (
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24">
            <div
              className="absolute inset-0 rounded-full border-2 border-white/10"
              style={{
                background: `conic-gradient(${metric.color} ${fillPercent * 360}deg, rgba(255,255,255,0.08) 0deg)`,
              }}
            />
            <div className="absolute inset-4 flex flex-col items-center justify-center text-base font-black">
              <span>{Math.round(metric.stats.avg)}</span>
              <span className="text-[10px] uppercase tracking-[0.3em]">{metric.unit}</span>
            </div>
          </div>
          <div className="text-xs text-slate-300">
            Global max <span className="font-semibold">{Math.round(normalizedMax)}</span>
            <br />
            {metric.series.length} days captured
          </div>
        </div>
      );
    case "bars":
      return (
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Volume</div>
          <div className="flex items-end gap-1 h-24">
            {metric.series.map((point) => (
              <div
                key={point.date}
                className="flex-1 rounded-full bg-gradient-to-t from-white/30 to-white"
                style={{ height: `${Math.max(2, (point.value / normalizedMax) * 100)}%` }}
                title={`${point.date}: ${Math.round(point.value)}`}
              />
            ))}
          </div>
        </div>
      );
    case "heatmap":
      return (
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Consistency</div>
          <div className="grid grid-cols-7 gap-1">
            {metric.series.map((point) => (
              <div key={point.date} className="h-5 rounded-sm" style={{ backgroundColor: heatColor(point.value / normalizedMax) }} />
            ))}
          </div>
        </div>
      );
    case "pie":
      const percent = normalizedMax ? Math.min(1, metric.stats.avg / normalizedMax) : 0;
      return (
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-900 to-slate-800" />
            <div
              className="absolute inset-3 rounded-full border border-white/10"
              style={{
                background: `conic-gradient(${metric.color} ${percent * 360}deg, rgba(255,255,255,0.08) 0deg)`,
              }}
            />
            <div className="absolute inset-4 flex items-center justify-center text-lg font-black">
              {Math.round(percent * 100)}%
            </div>
          </div>
          <p className="text-xs text-slate-300">Avg vs peak ratio</p>
        </div>
      );
    case "line":
      const points = metric.series.map((point, idx) => ({
        x: (idx / Math.max(1, metric.series.length - 1)) * 100,
        y: Math.min(100, (point.value / normalizedMax) * 100),
      }));
      const path = points.map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x} ${100 - point.y}`).join(" ");
      return (
        <svg viewBox="0 0 100 100" className="h-28 w-full">
          <path d={path} fill="none" stroke="white" strokeWidth="1.5" />
        </svg>
      );
    case "swimlane":
      return (
        <div className="space-y-1 text-[10px] text-slate-400">
          {metric.series.slice(-5).map((point) => (
            <div key={point.date} className="flex items-center justify-between gap-2">
              <span>{point.date.slice(5)}</span>
              <div className="h-2 flex-1 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  style={{ width: `${Math.min(100, (point.value / normalizedMax) * 100)}%` }}
                />
              </div>
              <span>{Math.round(point.value)}</span>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function buildLifeFocusMetrics(): MetricDefinition[] {
  const insightFor = (label: string) => (trend: { percent: number; label: string }) => {
    if (trend.percent <= -20) return `${label} is sliding—reinvest this period.`;
    if (trend.percent < 0) return `${label} softened; tighten routines and goals.`;
    if (trend.percent >= 20) return `${label} is accelerating—lock in the gains.`;
    return `${label} is steady; keep the cadence.`;
  };

  return LIFE_FOCUS_METRICS.map((meta) => ({
    id: meta.id,
    label: meta.label,
    unit: "min",
    description: meta.description,
    focus: `LF${meta.lfId} • ${meta.label}`,
    color: meta.color,
    filter: (event) => matchesLifeFocus(event, meta.lfId),
    insight: insightFor(meta.label),
    lfId: meta.lfId,
  }));
}

function matchesLifeFocus(event: FlowEvent, lfId: number) {
  const lfFromEvent = extractLfId(event);
  return lfFromEvent === lfId;
}

function extractLfId(event: FlowEvent): number | null {
  const direct = normalizeLfId(
    event.segments?.lf_id ??
    event.segments?.lf ??
    event.segments?.life_focus ??
    event.segments?.lifeFocus ??
    event.segments?.pillar
  );
  if (direct) return direct;

  const goalLf = normalizeLfId(
    event.segments?.goal?.lf_id ??
    event.segments?.goal?.lfId ??
    event.segments?.goal_lf_id ??
    event.segments?.goal_lf
  );
  if (goalLf) return goalLf;

  return null;
}

function normalizeLfId(value: any): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    const n = Math.round(value);
    return n >= 1 && n <= 9 ? n : null;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const lfTag = raw.toUpperCase();
  const nameMap: Record<string, number> = {
    CORE: 1,
    SELF: 2,
    CIRCLE: 3,
    GRIND: 4,
    LEVEL_UP: 5,
    IMPACT: 6,
    PLAY: 7,
    INSIGHT: 8,
    CHAOS: 9,
  };
  if (nameMap[lfTag]) return nameMap[lfTag];

  if (lfTag.startsWith("LF")) {
    const parsed = Number(lfTag.slice(2));
    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 9 ? parsed : null;
  }

  const numeric = Number(raw.replace(/[^0-9]/g, ""));
  return Number.isFinite(numeric) && numeric >= 1 && numeric <= 9 ? numeric : null;
}

function buildMetricData(
  definition: MetricDefinition,
  current: FlowEvent[],
  previous: FlowEvent[],
  start: Date,
  end: Date,
  prevStart: Date,
  prevEnd: Date
): MetricData {
  const series = buildSeries(current, definition.filter, start, end);
  const prevSeries = buildSeries(previous, definition.filter, prevStart, prevEnd);
  const stats = summarizeSeries(series);
  const prevStats = summarizeSeries(prevSeries);
  const trend = computeTrend(stats.avg, prevStats.avg);
  const narrative = definition.insight(trend);
  const globalMax = Math.max(1, stats.max, prevStats.max);

  return {
    id: definition.id,
    label: definition.label,
    unit: definition.unit,
    description: definition.description,
    focus: definition.focus,
    color: definition.color,
    series,
    stats,
    trendPercent: trend.percent,
    trendLabel: trend.label,
    narrative,
    globalMax,
  };
}

function buildSeries(events: FlowEvent[], filter: (event: FlowEvent) => boolean, start: Date, end: Date) {
  const map = new Map<string, number>();
  events.forEach((event) => {
    if (!filter(event)) return;
    const key = event.timestamp.slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + event.amount);
  });

  const series = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const limit = new Date(end);
  limit.setHours(0, 0, 0, 0);

  while (cursor <= limit) {
    const key = cursor.toISOString().slice(0, 10);
    series.push({ date: key, value: map.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return series;
}

function summarizeSeries(series: { value: number }[]) {
  if (!series.length) {
    return { total: 0, avg: 0, min: 0, max: 0, days: 0 };
  }
  const values = series.map((entry) => entry.value);
  const total = values.reduce((acc, value) => acc + value, 0);
  const avg = values.length ? total / values.length : 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { total, avg, min, max, days: values.length };
}

function getPreviousRange(start: Date, end: Date) {
  const dayMs = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((end.getTime() - start.getTime()) / dayMs) + 1;
  const prevEnd = new Date(start);
  prevEnd.setDate(start.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevEnd.getDate() - (diffDays - 1));

  prevStart.setHours(0, 0, 0, 0);
  prevEnd.setHours(23, 59, 59, 999);
  return { prevStart, prevEnd };
}

function heatColor(ratio: number) {
  if (ratio <= 0) return "#0f172a";
  if (ratio < 0.25) return "#22c55e";
  if (ratio < 0.5) return "#16a34a";
  if (ratio < 0.75) return "#15803d";
  return "#0f766e";
}

function hashString(value: string) {
  return Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}
