"use client";

import { useEffect, useState } from "react";
import { Minus, TrendingDown, TrendingUp, Settings, Calendar, Filter } from "lucide-react";

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

type OrderedMetric = { metric: MetricData; chart: string };
type Period = "day" | "week" | "month" | "quarter" | "year" | "all";

const TAB_DEFS = [
  { id: "random", label: "Randomized Deck" },
  { id: "rings", label: "LF Rings" },
  { id: "bars", label: "Bars" },
  { id: "line", label: "Lines" },
  { id: "pie", label: "Pie" },
  { id: "heatmap", label: "Heatmap" },
] as const;

type TabId = (typeof TAB_DEFS)[number]["id"];

export default function ReportTabs({ ordered }: { ordered: OrderedMetric[] }) {
  const [tab, setTab] = useState<TabId>("random");
  const [period, setPeriod] = useState<Period>("week");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(ordered.map((item) => item.metric.id));
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("creative-report-settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.categories)) setSelectedCategories(parsed.categories);
        if (parsed.period) setPeriod(parsed.period);
      }
    } catch (e) {
      console.error("Failed to load report settings", e);
    }
  }, []);

  const saveSettings = () => {
    if (typeof window === "undefined") return;
    const settings = { categories: selectedCategories, period };
    window.localStorage.setItem("creative-report-settings", JSON.stringify(settings));
    setSettingsOpen(false);
  };

  const filteredOrdered = ordered.filter((item) => selectedCategories.includes(item.metric.id));

  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    let start: Date;
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case "day":
        start = new Date(end);
        break;
      case "week":
        start = new Date(end);
        start.setDate(end.getDate() - 6);
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter": {
        const qStart = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), qStart, 1);
        break;
      }
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(end);
        start.setFullYear(end.getFullYear() - 10);
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return { start, end };
  };

  const filterSeriesByPeriod = (series: { date: string; value: number }[]) => {
    const { start, end } = getDateRange();
    return series.filter((s) => {
      const d = new Date(s.date);
      return d >= start && d <= end;
    });
  };

  const renderHeatmap = () => {
    const { start, end } = getDateRange();
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const cellSize = Math.min(16, Math.max(6, Math.floor(360 / Math.max(days, 1))));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Activity Heatmap</h3>
          <span className="text-xs text-slate-400">{period.toUpperCase()} VIEW</span>
        </div>

        <div className="grid gap-3">
          {filteredOrdered.map(({ metric }) => {
            const filteredSeries = filterSeriesByPeriod(metric.series);
            const maxVal = Math.max(1, ...filteredSeries.map((s) => s.value));
            return (
              <div key={metric.id} className="flex items-center gap-4">
                <div className="w-32 text-xs">
                  <p className="font-semibold truncate">{metric.label}</p>
                  <p className="text-slate-400 text-[10px]">{metric.description}</p>
                </div>
                <div className="flex-1 flex gap-1">
                  {filteredSeries.map((s, idx) => {
                    const ratio = s.value / maxVal;
                    const shades = ["#1f2937", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
                    const color = shades[Math.min(shades.length - 1, Math.floor(ratio * shades.length))];
                    return (
                      <div
                        key={idx}
                        className="rounded-sm transition-all hover:scale-110 hover:z-10 relative group"
                        style={{
                          width: `${cellSize}px`,
                          height: `${cellSize}px`,
                          backgroundColor: color,
                        }}
                      >
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          {new Date(s.date).toLocaleDateString()}: {s.value} {metric.unit}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex rounded-full border border-white/10 bg-slate-900/40 p-1 flex-wrap">
          {TAB_DEFS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-black uppercase tracking-[0.25em] rounded-full transition ${
                tab === t.id ? "bg-white text-black" : "text-slate-300 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="px-3 py-1.5 text-xs bg-slate-900/60 border border-white/10 rounded-full text-slate-300 focus:outline-none focus:ring-1 focus:ring-white/30"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
            <option value="year">Year</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-full border border-white/10 bg-slate-900/40 hover:bg-slate-800/60 transition"
            aria-label="Report settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Report Settings
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Select Categories
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {ordered.map(({ metric }) => (
                    <label key={metric.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/40 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(metric.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, metric.id]);
                          } else {
                            setSelectedCategories(selectedCategories.filter((id) => id !== metric.id));
                          }
                        }}
                        className="rounded border-white/20 bg-slate-800"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{metric.label}</p>
                        <p className="text-xs text-slate-400">{metric.description}</p>
                      </div>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metric.color }} />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Time Period
                </h4>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as Period)}
                  className="w-full px-3 py-2 bg-slate-800/60 border border-white/10 rounded-lg text-slate-300 focus:outline-none focus:ring-1 focus:ring-white/30"
                >
                  <option value="day">Last Day</option>
                  <option value="week">Last Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={saveSettings}
                  className="flex-1 px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
                >
                  Save Settings
                </button>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="px-4 py-2 border border-white/20 font-semibold rounded-lg hover:bg-slate-800/40 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "random" && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredOrdered.map(({ metric, chart }) => (
            <RandomChartCard key={metric.id} metric={metric} chartFamily={chart} period={period} />
          ))}
        </section>
      )}

      {tab === "rings" && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrdered.map(({ metric }) => {
            const filteredSeries = filterSeriesByPeriod(metric.series);
            const values = filteredSeries.map((s) => s.value);
            const len = values.length || 1;
            const stats = {
              total: values.reduce((sum, v) => sum + v, 0),
              avg: values.reduce((sum, v) => sum + v, 0) / len,
              min: values.length ? Math.min(...values) : 0,
              max: values.length ? Math.max(...values) : 0,
              days: values.length,
            };
            const normalizedMax = Math.max(metric.globalMax, 1);
            const fillPercent = Math.min(1, normalizedMax ? stats.avg / normalizedMax : 0);

            return (
              <article
                key={`ring-${metric.id}`}
                className="rounded-3xl border border-white/10 bg-slate-900/40 p-4 shadow-xl backdrop-blur-xl flex items-center gap-4"
              >
                <RingVisual color={metric.color} percent={fillPercent} value={Math.round(stats.avg)} unit={metric.unit} />
                <div className="text-xs text-slate-200 space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">{metric.focus}</p>
                  <p className="text-base font-black">{metric.label}</p>
                  <p className="text-slate-400 text-[11px]">{metric.description}</p>
                  <p>
                    Total <span className="font-semibold">{Math.round(stats.total)}</span> {metric.unit}
                  </p>
                  <p>
                    Min/Max <span className="font-semibold">{Math.round(stats.min)}</span> /{" "}
                    <span className="font-semibold">{Math.round(stats.max)}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">{stats.days || 0} days in {period}</p>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {tab !== "random" && tab !== "rings" && tab !== "heatmap" && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredOrdered.map(({ metric }) => (
            <RandomChartCard key={`${tab}-${metric.id}`} metric={metric} chartFamily={tab} period={period} />
          ))}
        </section>
      )}

      {tab === "heatmap" && (
        <section className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl">
          {renderHeatmap()}
        </section>
      )}
    </div>
  );
}

function RandomChartCard({ metric, chartFamily, period }: { metric: MetricData; chartFamily: string; period: Period }) {
  const { filteredSeries, stats, normalizedMax, fillPercent } = computeSeriesStats(metric, period);
  const TrendIcon = metric.trendPercent > 0 ? TrendingUp : metric.trendPercent < 0 ? TrendingDown : Minus;
  const trendColor =
    metric.trendPercent > 0 ? "text-emerald-300" : metric.trendPercent < 0 ? "text-rose-300" : "text-slate-400";

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl">
      <header className="flex justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400">{metric.focus}</p>
            <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full">{period}</span>
          </div>
          <h2 className="text-2xl font-black">{metric.label}</h2>
          <p className="text-xs text-slate-300">{metric.description}</p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
          {TrendIcon && <TrendIcon className="h-4 w-4" />}
          <span>{Math.round(metric.trendPercent)}%</span>
        </div>
      </header>

      <div className="mt-6">{renderChart(chartFamily, metric, normalizedMax, fillPercent, filteredSeries)}</div>

      <footer className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-300 space-y-1">
        <p>Total <span className="font-semibold">{Math.round(stats.total)}</span> {metric.unit}</p>
        <p>Avg <span className="font-semibold">{Math.round(stats.avg)}</span> {metric.unit}</p>
        <p className="italic text-slate-400">“{metric.narrative}”</p>
      </footer>
    </article>
  );
}

function renderChart(
  chartFamily: string,
  metric: MetricData,
  normalizedMax: number,
  fillPercent: number,
  series: { date: string; value: number }[]
) {
  const safeSeries = series.length ? series : metric.series;
  const avgFromSeries =
    safeSeries.length > 0 ? safeSeries.reduce((sum, s) => sum + s.value, 0) / safeSeries.length : 0;

  switch (chartFamily) {
    case "rings":
      return (
        <div className="flex items-center gap-4">
          <RingVisual color={metric.color} percent={fillPercent} value={Math.round(avgFromSeries)} unit={metric.unit} />
          <div className="text-xs text-slate-300">
            Global max <span className="font-semibold">{Math.round(normalizedMax)}</span>
            <br />
            {safeSeries.length} days captured
          </div>
        </div>
      );
    case "bars":
      return (
        <div className="flex h-24 items-end gap-1">
          {safeSeries.slice(-30).map((s, idx) => {
            const h = Math.round((s.value / Math.max(normalizedMax, 1)) * 90);
            return <div key={idx} className="w-2 rounded-t bg-white/10" style={{ height: `${h + 4}px`, backgroundColor: metric.color }} />;
          })}
        </div>
      );
    case "line":
      return (
        <div className="h-24 w-full rounded-2xl bg-slate-900/60 border border-white/10 flex items-end px-2">
          {safeSeries.slice(-30).map((s, idx) => {
            const h = Math.round((s.value / Math.max(normalizedMax, 1)) * 90);
            return <div key={idx} className="flex-1" style={{ height: `${h}px` }}>
              <div className="w-full rounded-full" style={{ height: 2, backgroundColor: metric.color }} />
            </div>;
          })}
        </div>
      );
    case "pie":
      return (
        <div className="relative h-24 w-24">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(${metric.color} ${fillPercent * 360}deg, rgba(255,255,255,0.1) 0deg)`,
            }}
          />
          <div className="absolute inset-6 rounded-full bg-slate-900/80" />
        </div>
      );
    case "heatmap":
      return (
        <div className="grid grid-cols-7 gap-1">
          {safeSeries.slice(-35).map((s, idx) => {
            const ratio = s.value / Math.max(1, normalizedMax);
            const shades = ["#1f2937", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
            const color = shades[Math.min(shades.length - 1, Math.floor(ratio * shades.length))];
            return <div key={idx} className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />;
          })}
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-4">
          <RingVisual color={metric.color} percent={fillPercent} value={Math.round(avgFromSeries)} unit={metric.unit} />
        </div>
      );
  }
}

function RingVisual({ color, percent, value, unit }: { color: string; percent: number; value: number; unit: string }) {
  return (
    <div className="relative h-20 w-20">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${Math.max(0, Math.min(1, percent)) * 251} 251`}
          transform="rotate(-90 50 50)"
          className="drop-shadow-glow"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-black">
        <span className="text-lg">{isFinite(value) ? value : 0}</span>
        <span className="text-[9px] uppercase tracking-[0.3em] text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

function computeSeriesStats(metric: MetricData, period: Period) {
  const { start, end } = getDateRangeStatic(period);
  const filteredSeries = metric.series.filter((s) => {
    const d = new Date(s.date);
    return d >= start && d <= end;
  });
  const values = filteredSeries.map((s) => s.value);
  const len = values.length || 1;
  const total = values.reduce((sum, v) => sum + v, 0);
  const avg = total / len;
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const normalizedMax = Math.max(metric.globalMax, 1);
  const fillPercent = Math.min(1, normalizedMax ? avg / normalizedMax : 0);
  return { filteredSeries, stats: { total, avg, min, max, days: values.length }, normalizedMax, fillPercent };
}

function getDateRangeStatic(period: Period): { start: Date; end: Date } {
  const now = new Date();
  let start: Date;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "day":
      start = new Date(end);
      break;
    case "week":
      start = new Date(end);
      start.setDate(end.getDate() - 6);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter": {
      const qStart = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qStart, 1);
      break;
    }
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(end);
      start.setFullYear(end.getFullYear() - 10);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return { start, end };
}
