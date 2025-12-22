// Creative Report Widget for Scriptable
// - Safe DrawContext usage (no unsupported calls)
// - Rings, Bars, Heatmap + narrative text
// - Tap to open Scriptable and pick categories + period (saved to local file)
// - Mock data now; swap in real data source later (e.g., LF-based task stats pulled from your backend)
//
// Save as a Scriptable script. Add as widget on Home Screen.
// Tap widget -> opens Scriptable where you can choose categories & period.

// ---------- Mock data generator (replace with real data source later) ----------
function generateMockData(mean, variation) {
  const data = {};
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    // weekly pattern + noise
    const weekly = Math.round(Math.sin(i / 7) * (variation / 3));
    const noise = Math.round((Math.random() - 0.5) * variation);
    const val = Math.max(0, Math.round(mean + weekly + noise));
    data[key] = val;
  }
  return data;
}

const dataset = [
  { id: "workouts", title: "Workouts", description: "Minutes of exercise", data: generateMockData(30, 25) },
  { id: "food", title: "Healthy Eating", description: "Healthy-meal score (0-100)", data: generateMockData(75, 15) },
  { id: "sweets", title: "Sweets", description: "Times sweets eaten", data: generateMockData(1, 2) },
  { id: "family", title: "Family Time", description: "Minutes of family time", data: generateMockData(45, 20) },
  { id: "games", title: "Games", description: "Minutes playing games", data: generateMockData(25, 18) }
];

// ---------- Settings persistence ----------
const fm = FileManager.local();
const settingsPath = fm.joinPath(fm.documentsDirectory(), "creative-report-settings.json");

function loadSettings() {
  try {
    if (fm.fileExists(settingsPath)) {
      const raw = fm.readString(settingsPath);
      return JSON.parse(raw);
    }
  } catch (e) { /* ignore */ }
  // default
  return { categories: [dataset[0].id], period: "week" };
}

function saveSettings(s) {
  fm.writeString(settingsPath, JSON.stringify(s));
}

// ---------- Date range helpers ----------
function getDateRange(period) {
  const now = new Date();
  let start, end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "day") {
    start = new Date(end);
  } else if (period === "week") {
    start = new Date(end);
    start.setDate(end.getDate() - 6);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "quarter") {
    const qStart = Math.floor(now.getMonth() / 3) * 3;
    start = new Date(now.getFullYear(), qStart, 1);
  } else if (period === "year") {
    start = new Date(now.getFullYear(), 0, 1);
  } else { // all
    start = new Date(end);
    start.setFullYear(end.getFullYear() - 10);
  }
  // normalize times
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return { start, end };
}

function iterateDays(start, end, fn) {
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    fn(new Date(d));
  }
}

// ---------- Data filtering & stats ----------
function getCategoryById(id) {
  return dataset.find(c => c.id === id);
}

function getSeries(cat, start, end) {
  const series = [];
  iterateDays(start, end, (d) => {
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, value: (cat.data && cat.data[key]) ? cat.data[key] : 0 });
  });
  return series;
}

function statsFromSeries(series) {
  if (!series || series.length === 0) return null;
  const nums = series.map(s => s.value);
  const total = nums.reduce((a, b) => a + b, 0);
  const avg = total / nums.length;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return { total, avg, min, max, days: series.length };
}

function previousRange(start, end) {
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const prevEnd = new Date(start);
  prevEnd.setDate(start.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevEnd.getDate() - (days - 1));
  prevStart.setHours(0, 0, 0, 0);
  prevEnd.setHours(0, 0, 0, 0);
  return { prevStart, prevEnd };
}

function computeTrend(cat, start, end) {
  const series = getSeries(cat, start, end);
  const stats = statsFromSeries(series);
  const prev = previousRange(start, end);
  const prevSeries = getSeries(cat, prev.prevStart, prev.prevEnd);
  const prevStats = statsFromSeries(prevSeries) || { avg: 0 };
  const percentChange = ((stats.avg - prevStats.avg) / (prevStats.avg || 1)) * 100;
  return { series, stats, pctChange: percentChange };
}

// ---------- Color helpers ----------
function heatColor(ratio) {
  // ratio 0..1 -> choose GitHub-like 5-step
  if (ratio <= 0) return new Color("#ebedf0");
  if (ratio < 0.25) return new Color("#9be9a8");
  if (ratio < 0.5) return new Color("#40c463");
  if (ratio < 0.75) return new Color("#30a14e");
  return new Color("#216e39");
}

// ---------- Drawing helpers (safe API) ----------
function drawRings(selectedCats, start, end, width) {
  const margin = 12;
  const spacing = 80;
  const count = selectedCats.length;
  const canvasW = Math.max(width, margin * 2 + (count * spacing));
  const canvasH = 80;
  const dc = new DrawContext();
  dc.size = new Size(canvasW, canvasH);
  dc.opaque = false;

  const avgs = selectedCats.map(c => {
    const { stats } = computeTrend(c, start, end);
    return { id: c.id, title: c.title, avg: stats ? stats.avg : 0 };
  });
  const globalMax = Math.max(1, ...avgs.map(a => a.avg));

  for (let i = 0; i < selectedCats.length; i++) {
    const cat = selectedCats[i];
    const a = avgs.find(x => x.id === cat.id);
    const centerX = margin + i * spacing + 20;
    const centerY = 36;
    const radius = 20;
    const lineWidth = 8;

    // background ring
    dc.setStrokeColor(new Color("#333333"));
    dc.setLineWidth(lineWidth);
    dc.strokeEllipse(new Rect(centerX - radius, centerY - radius, radius * 2, radius * 2));

    // progress arc via small dots
    const progress = Math.min(1, (a.avg / globalMax));
    const steps = 70;
    const endStep = Math.floor(steps * progress);
    dc.setFillColor(new Color("#4CAF50"));
    const dotSize = lineWidth + 0.5;
    for (let s = 0; s <= endStep; s++) {
      const angle = (-Math.PI / 2) + (2 * Math.PI * (s / steps));
      const px = centerX + Math.cos(angle) * radius;
      const py = centerY + Math.sin(angle) * radius;
      dc.fillEllipse(new Rect(px - dotSize / 2, py - dotSize / 2, dotSize, dotSize));
    }
  }
  return dc.getImage();
}

function drawBars(series, width, height, barColor) {
  const dc = new DrawContext();
  dc.size = new Size(width, height);
  dc.opaque = false;

  const values = series.map(s => s.value);
  const maxV = Math.max(1, ...values);
  const barCount = values.length;
  const gap = 4;
  const barWidth = Math.max(6, Math.floor((width - (gap * (barCount + 1))) / barCount));

  for (let i = 0; i < barCount; i++) {
    const v = values[i];
    const h = Math.round((v / maxV) * (height - 8));
    const x = i * (barWidth + gap) + gap;
    const y = height - h - 2;
    dc.setFillColor(new Color("#2b2b2b"));
    dc.fillRect(new Rect(x, 0, barWidth, height));
    dc.setFillColor(barColor);
    dc.fillRect(new Rect(x, y, barWidth, h));
  }
  return dc.getImage();
}

function drawHeatmap(cats, start, end, width) {
  const days = [];
  iterateDays(start, end, (d) => days.push(d.toISOString().slice(0, 10)));
  const cols = days.length;
  const rows = cats.length;
  const cell = 12;
  const gap = 3;
  const canvasW = Math.min(width, cols * (cell + gap));
  const canvasH = rows * (cell + gap);
  const dc = new DrawContext();
  dc.size = new Size(canvasW, canvasH);
  dc.opaque = false;

  for (let r = 0; r < rows; r++) {
    const cat = cats[r];
    const ser = getSeries(cat, start, end);
    const mx = Math.max(1, ...ser.map(s => s.value));
    for (let c = 0; c < cols; c++) {
      const val = ser[c] ? ser[c].value : 0;
      const ratio = val / mx;
      dc.setFillColor(heatColor(ratio));
      const x = c * (cell + gap);
      const y = r * (cell + gap);
      dc.fillRect(new Rect(x, y, cell, cell));
    }
  }
  return dc.getImage();
}

// ---------- Interactive selection ----------
if (!config.runsInWidget) {
  const includeIds = [];
  for (let c of dataset) {
    const a = new Alert();
    a.title = `Include "${c.title}"?`;
    a.message = c.description;
    a.addAction("Yes");
    a.addCancelAction("No");
    const res = await a.present();
    if (res === 0) includeIds.push(c.id);
  }
  if (includeIds.length === 0) includeIds.push(dataset[0].id);

  const periodAlert = new Alert();
  periodAlert.title = "Pick a period";
  const periods = ["day", "week", "month", "quarter", "year", "all"];
  for (let p of periods) periodAlert.addAction(p);
  const pidx = await periodAlert.present();
  const chosenPeriod = periods[pidx] || "week";

  const newSettings = { categories: includeIds, period: chosenPeriod };
  saveSettings(newSettings);

  const done = new Alert();
  done.title = "Saved";
  done.message = `Saved ${includeIds.length} categories for "${chosenPeriod}".\nReturn to Home and refresh widget.`;
  done.addAction("OK");
  await done.present();
  return;
}

// ---------- Widget rendering ----------
const settings = loadSettings();
const family = config.widgetFamily; // "small" | "medium" | "large" | undefined
const { start, end } = getDateRange(settings.period);

const selectedCats = settings.categories.map(id => getCategoryById(id)).filter(Boolean);
if (selectedCats.length === 0) selectedCats.push(dataset[0]);

const computed = selectedCats.map(cat => {
  const t = computeTrend(cat, start, end);
  return { cat, series: t.series, stats: t.stats, pctChange: t.pctChange };
});

const w = new ListWidget();
w.backgroundColor = new Color("#0b0b0b");
w.setPadding(10, 10, 10, 10);

const header = w.addText(`📊 ${settings.period.toUpperCase()} • ${selectedCats.map(c => c.title).join(", ")}`);
header.textColor = Color.white();
header.font = Font.boldSystemFont(13);
w.addSpacer(6);

if (family === "small") {
  const ringsImg = drawRings([selectedCats[0]], start, end, 150);
  w.addImage(ringsImg).centerAlignImage();
  w.addSpacer(6);
  const s0 = computed[0].stats;
  const pct = Math.round(computed[0].pctChange);
  const line = w.addText(`${selectedCats[0].title}: avg ${s0 ? Math.round(s0.avg) : "N/A"} • ${pct>=0? "↑":"↓"} ${Math.abs(pct)}%`);
  line.textColor = Color.white();
  line.font = Font.systemFont(12);
} else if (family === "medium") {
  const ringsImg = drawRings(selectedCats, start, end, 320);
  w.addImage(ringsImg).centerAlignImage();
  w.addSpacer(6);

  const heat = drawHeatmap(selectedCats, start, end, 320);
  w.addImage(heat).centerAlignImage();
  w.addSpacer(6);

  for (let c of computed) {
    const s = c.stats;
    const pct = Math.round(c.pctChange);
    const t = w.addText(`${c.cat.title}: total ${s ? Math.round(s.total) : "N/A"}, avg ${s ? Math.round(s.avg) : "N/A"} • ${pct>=0?"↑":"↓"} ${Math.abs(pct)}%`);
    t.textColor = Color.white();
    t.font = Font.systemFont(11);
  }
} else {
  const ringsImg = drawRings(selectedCats, start, end, 400);
  w.addImage(ringsImg).centerAlignImage();
  w.addSpacer(6);

  if (selectedCats.length > 0) {
    const firstSeries = getSeries(selectedCats[0], start, end);
    const barImg = drawBars(firstSeries, 360, 60, new Color("#4CAF50"));
    w.addImage(barImg).centerAlignImage();
    w.addSpacer(6);
  }

  const heat = drawHeatmap(selectedCats, start, end, 360);
  w.addImage(heat).centerAlignImage();
  w.addSpacer(6);

  for (let c of computed) {
    const s = c.stats;
    const pct = Math.round(c.pctChange);
    const detail = w.addText(`${c.cat.title}: total ${s ? Math.round(s.total) : "N/A"}, avg ${s ? Math.round(s.avg) : "N/A"} • min ${s? s.min:"-"}, max ${s? s.max:"-"} • ${pct>=0?"↑":"↓"} ${Math.abs(pct)}%`);
    detail.textColor = Color.white();
    detail.font = Font.systemFont(11);
  }
}

w.url = URLScheme.forRunningScript();

if (config.runsInWidget) {
  Script.setWidget(w);
} else {
  w.presentMedium();
}
Script.complete();
