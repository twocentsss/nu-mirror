"use client";

import { useEffect, useMemo, useState } from "react";
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
type Period = "day" | "week" | "sprint" | "month" | "quarter" | "year";

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
  const lfOrdered = useMemo(() => ordered.slice(0, 9), [ordered]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(lfOrdered.map((item) => item.metric.id));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("creative-report-settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.categories)) {
          const valid = parsed.categories.filter((id: string) => lfOrdered.some((item) => item.metric.id === id));
          setSelectedCategories(valid.length ? valid : lfOrdered.map((item) => item.metric.id));
        }
        if (parsed.period && ["day", "week", "sprint", "month", "quarter", "year"].includes(parsed.period)) {
          setPeriod(parsed.period);
        }
      }
    } catch (e) {
      console.error("Failed to load report settings", e);
    }
  }, [lfOrdered]);

  const saveSettings = () => {
    if (typeof window === "undefined") return;
    const settings = { categories: selectedCategories, period };
    window.localStorage.setItem("creative-report-settings", JSON.stringify(settings));
    setSettingsOpen(false);
  };

  const filteredOrdered = useMemo(
    () => lfOrdered.filter((item) => selectedCategories.includes(item.metric.id)),
    [lfOrdered, selectedCategories]
  );

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
      case "sprint":
        start = new Date(end);
        start.setDate(end.getDate() - 13);
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
      default:
        start = new Date(now.getFullYear(), 0, 1);
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
    const cellSize = Math.min(16, Math.max(6, Math.floor(380 / Math.max(days, 1))));

    return (
      <div className="space-y-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[14px] font-bold uppercase tracking-[0.6em] text-blue-500">
              THE STANCE
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tighter leading-[1.05]">
              Activity Heatmap
            </h3>
            <p className="text-xs text-white/60 mt-2 max-w-xl">
              Each band is a metric. Each cell is a day. Darkness is absence; intensity is presence.
              Hover to reveal the day’s truth.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
              {period.toUpperCase()} VIEW
            </span>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredOrdered.map(({ metric }) => {
            const filteredSeries = filterSeriesByPeriod(metric.series);
            const maxVal = Math.max(1, ...filteredSeries.map((s) => s.value));
            return (
              <div
                key={metric.id}
                className="rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-[240px]">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/50">
                      {metric.focus}
                    </p>
                    <p className="text-lg font-extrabold tracking-tight mt-1">{metric.label}</p>
                    <p className="text-xs text-white/55 mt-1">{metric.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: metric.color }}
                      aria-hidden
                    />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/45">
                      {filteredSeries.length} days
                    </p>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <div className="flex gap-1 min-w-max">
                    {filteredSeries.map((s, idx) => {
                      const ratio = s.value / maxVal;
                      const shades = ["#0b1220", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
                      const color = shades[Math.min(shades.length - 1, Math.floor(ratio * shades.length))];
                      return (
                        <div
                          key={idx}
                          className="rounded-md relative group transition-transform duration-500 hover:scale-110"
                          style={{
                            width: `${cellSize}px`,
                            height: `${cellSize}px`,
                            backgroundColor: color,
                            boxShadow: ratio > 0 ? "0 0 0 1px rgba(255,255,255,0.06) inset" : "none",
                          }}
                        >
                          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-black/90 border border-white/10 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                            {new Date(s.date).toLocaleDateString()}: {s.value} {metric.unit}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Apple-style ambient frame */}
      <div className="rounded-[4rem] border border-white/10 bg-black p-6 sm:p-10 shadow-[0_60px_140px_rgba(0,0,0,0.65)] overflow-hidden relative">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background:
              "radial-gradient(1200px 600px at 20% 10%, rgba(59,130,246,0.28), transparent 55%), radial-gradient(1000px 600px at 80% 20%, rgba(168,85,247,0.22), transparent 55%), radial-gradient(900px 600px at 50% 100%, rgba(16,185,129,0.14), transparent 55%)",
          }}
        />
        <div className="relative space-y-8">
          {/* Header / stance */}
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div className="space-y-3">
              <div className="text-[14px] font-bold uppercase tracking-[0.6em] text-blue-500">
                REPORTS
              </div>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tighter leading-[1.05]">
                The Stance of Your Life.
              </h1>
              <p className="text-sm text-white/60 max-w-2xl">
                High-contrast. Zero noise. Every metric becomes a story beat—tracked, compared, and made
                undeniable.
              </p>
              <p className="text-xs text-white/50">
                Today · {todayLabel}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/45">
                Periods: Day / Week / Sprint / Month / Quarter
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="px-4 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-full text-white/80 focus:outline-none focus:ring-1 focus:ring-white/30 backdrop-blur-xl"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="sprint">Sprint</option>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>

              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2.5 rounded-full border border-white/10 bg-white/[0.06] hover:bg-white/[0.09] transition duration-500"
                aria-label="Report settings"
              >
                <Settings className="h-4 w-4 text-white/80" />
              </button>
            </div>
          </div>

          {/* The Reel (tabs) */}
          <div className="relative">
            <div className="absolute -inset-x-6 -top-6 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {TAB_DEFS.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={[
                      "shrink-0 rounded-full px-5 py-3 text-[11px] font-black uppercase tracking-[0.25em] transition duration-500",
                      "border border-white/10 backdrop-blur-xl",
                      active
                        ? "text-black bg-gradient-to-r from-white via-white to-white/70 shadow-[0_20px_60px_rgba(255,255,255,0.08)]"
                        : "text-white/70 bg-white/[0.04] hover:bg-white/[0.07] hover:text-white",
                    ].join(" ")}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings modal */}
          {settingsOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
              <div className="w-full max-w-md mx-4 rounded-[2.5rem] border border-white/10 bg-black shadow-[0_60px_140px_rgba(0,0,0,0.7)] overflow-hidden">
                <div className="p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[14px] font-bold uppercase tracking-[0.6em] text-blue-500">
                        SETTINGS
                      </div>
                      <h3 className="text-2xl font-extrabold tracking-tight mt-2 flex items-center gap-2">
                        <Settings className="h-5 w-5 text-white/80" />
                        Report Settings
                      </h3>
                      <p className="text-xs text-white/60 mt-2">
                        Choose what appears in your report deck and lock the time stance.
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/45 mt-1">
                        9 LFs
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">
                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-white/90">
                        <Filter className="h-4 w-4" />
                        Select LFs
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {lfOrdered.map(({ metric }) => (
                          <label
                            key={metric.id}
                            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.05] cursor-pointer transition"
                          >
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
                              className="rounded border-white/20 bg-black"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-white/90">{metric.label}</p>
                              <p className="text-xs text-white/55">{metric.description}</p>
                            </div>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metric.color }} />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-white/90">
                        <Calendar className="h-4 w-4" />
                        Time Period
                      </h4>
                      <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as Period)}
                        className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-2xl text-white/80 focus:outline-none focus:ring-1 focus:ring-white/30"
                      >
                        <option value="day">Last Day</option>
                        <option value="week">Last Week</option>
                        <option value="sprint">Last Sprint</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                      <div className="flex gap-3 mt-5">
                        <button
                          onClick={saveSettings}
                          className="flex-1 px-5 py-3 rounded-2xl font-semibold text-black bg-gradient-to-r from-white via-white to-white/70 hover:from-white hover:to-white transition duration-500"
                        >
                          Save Settings
                        </button>
                        <button
                          onClick={() => setSettingsOpen(false)}
                          className="px-5 py-3 rounded-2xl border border-white/15 text-white/80 font-semibold hover:bg-white/[0.06] transition duration-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Body */}
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
                    className="rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl flex items-center gap-5 hover:bg-white/[0.045] transition duration-500"
                  >
                    <RingVisual
                      color={metric.color}
                      percent={fillPercent}
                      value={Math.round(stats.avg)}
                      unit={metric.unit}
                    />
                    <div className="text-xs text-white/85 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/55">{metric.focus}</p>
                      <p className="text-lg font-extrabold tracking-tight">{metric.label}</p>
                      <p className="text-white/55 text-[11px]">{metric.description}</p>
                      <p>
                        Total <span className="font-semibold">{Math.round(stats.total)}</span> {metric.unit}
                      </p>
                      <p>
                        Min/Max <span className="font-semibold">{Math.round(stats.min)}</span> /{" "}
                        <span className="font-semibold">{Math.round(stats.max)}</span>
                      </p>
                      <p className="text-[10px] text-white/45">
                        {stats.days || 0} days in {period}
                      </p>
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
            <section className="rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
              {renderHeatmap()}
            </section>
          )}

          {/* Jobs-ian footer */}
          <div className="pt-6">
            <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="flex items-center justify-between gap-4 flex-wrap mt-6">
              <p className="text-xs text-white/55">
                The point isn’t to track. The point is to *shift your stance*—and keep it.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/45">
                  {filteredOrdered.length} metrics active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RandomChartCard({
  metric,
  chartFamily,
  period,
}: {
  metric: MetricData;
  chartFamily: string;
  period: Period;
}) {
  const { filteredSeries, stats, normalizedMax, fillPercent } = computeSeriesStats(metric, period);
  const TrendIcon = metric.trendPercent > 0 ? TrendingUp : metric.trendPercent < 0 ? TrendingDown : Minus;
  const trendColor =
    metric.trendPercent > 0 ? "text-emerald-300" : metric.trendPercent < 0 ? "text-rose-300" : "text-white/50";

  return (
    <article className="rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur-xl hover:bg-white/[0.045] transition duration-500">
      <header className="flex justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/55">{metric.focus}</p>
            <span className="text-[10px] px-2.5 py-1 bg-white/[0.06] border border-white/10 rounded-full text-white/70">
              {period}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-[1.05]">
            <span
              className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent"
              style={{ WebkitTextFillColor: "transparent" }}
            >
              {metric.label}
            </span>
          </h2>
          <p className="text-xs text-white/60">{metric.description}</p>
        </div>

        <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
          {TrendIcon && <TrendIcon className="h-4 w-4" />}
          <span>{Math.round(metric.trendPercent)}%</span>
        </div>
      </header>

      <div className="mt-6">{renderChart(chartFamily, metric, normalizedMax, fillPercent, filteredSeries)}</div>

      <footer className="mt-6 pt-5">
        <div className="h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
        <div className="mt-4 text-xs text-white/70 space-y-1">
          <p>
            Total <span className="font-semibold text-white/90">{Math.round(stats.total)}</span> {metric.unit}
          </p>
          <p>
            Avg <span className="font-semibold text-white/90">{Math.round(stats.avg)}</span> {metric.unit}
          </p>
          <p className="italic text-white/55">“{metric.narrative}”</p>
        </div>
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
  const avgFromSeries = safeSeries.length > 0 ? safeSeries.reduce((sum, s) => sum + s.value, 0) / safeSeries.length : 0;

  switch (chartFamily) {
    case "rings":
      return (
        <div className="flex items-center gap-4">
          <RingVisual color={metric.color} percent={fillPercent} value={Math.round(avgFromSeries)} unit={metric.unit} />
          <div className="text-xs text-white/65">
            Global max <span className="font-semibold text-white/90">{Math.round(normalizedMax)}</span>
            <br />
            {safeSeries.length} days captured
          </div>
        </div>
      );

    case "bars":
      return (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-4">
          <div className="flex h-28 items-end gap-1.5">
            {safeSeries.slice(-30).map((s, idx) => {
              const h = Math.round((s.value / Math.max(normalizedMax, 1)) * 100);
              return (
                <div
                  key={idx}
                  className="w-2.5 rounded-full"
                  style={{
                    height: `${h + 6}px`,
                    backgroundColor: metric.color,
                    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                    opacity: 0.9,
                  }}
                />
              );
            })}
          </div>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/45">
            last 30 samples
          </p>
        </div>
      );

    case "line":
      return (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-4">
          <div className="h-28 w-full flex items-end gap-1">
            {safeSeries.slice(-30).map((s, idx) => {
              const h = Math.round((s.value / Math.max(normalizedMax, 1)) * 100);
              return (
                <div key={idx} className="flex-1 flex items-end">
                  <div
                    className="w-full rounded-full"
                    style={{
                      height: 2,
                      backgroundColor: metric.color,
                      opacity: 0.9,
                      boxShadow: `0 0 18px ${metric.color}55`,
                      transform: `translateY(${-Math.max(0, 120 - h) / 30}px)`,
                      transition: "transform 600ms cubic-bezier(0.2,0.8,0.2,1)",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/45">
            drift line
          </p>
        </div>
      );

    case "pie":
      return (
        <div className="flex items-center gap-5">
          <div className="relative h-28 w-28">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(${metric.color} ${fillPercent * 360}deg, rgba(255,255,255,0.08) 0deg)`,
                boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
              }}
            />
            <div className="absolute inset-[18px] rounded-full bg-black/80 border border-white/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xl font-extrabold text-white/90">{Math.round(fillPercent * 100)}%</div>
                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/45">stance</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-white/65">
            Avg <span className="font-semibold text-white/90">{Math.round(avgFromSeries)}</span> {metric.unit}
            <br />
            Max <span className="font-semibold text-white/90">{Math.round(normalizedMax)}</span> {metric.unit}
          </div>
        </div>
      );

    case "heatmap":
      return (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-4">
          <div className="grid grid-cols-7 gap-1.5">
            {safeSeries.slice(-35).map((s, idx) => {
              const ratio = s.value / Math.max(1, normalizedMax);
              const shades = ["#0b1220", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
              const color = shades[Math.min(shades.length - 1, Math.floor(ratio * shades.length))];
              return (
                <div
                  key={idx}
                  className="h-3.5 w-3.5 rounded-md"
                  style={{
                    backgroundColor: color,
                    boxShadow: ratio > 0 ? "0 0 0 1px rgba(255,255,255,0.06) inset" : "none",
                  }}
                />
              );
            })}
          </div>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/45">
            last 35 days
          </p>
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
  const p = Math.max(0, Math.min(1, percent));
  return (
    <div className="relative h-20 w-20">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${p * 251} 251`}
          transform="rotate(-90 50 50)"
          style={{
            filter: `drop-shadow(0 0 14px ${color}66) drop-shadow(0 20px 60px rgba(0,0,0,0.35))`,
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-black">
        <span className="text-lg text-white/90">{isFinite(value) ? value : 0}</span>
        <span className="text-[9px] uppercase tracking-[0.3em] text-white/45">{unit}</span>
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
    case "sprint":
      start = new Date(end);
      start.setDate(end.getDate() - 13);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter": {
      const qStart = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qStart, 1);
      break;
    }
    default:
      start = new Date(now.getFullYear(), 0, 1);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return { start, end };
}
