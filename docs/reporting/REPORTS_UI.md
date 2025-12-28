# Reports UI — AppleStyle x HybridProtocol

Scope: Reports tab (`src/app/(tabs)/reports/page.tsx` + `src/components/ReportTabs.tsx`), matching the calm, high-polish Apple tone with the structured HybridProtocol choreography.

## Surfaces
- Tabs: Randomized Deck, LF Rings, Bars, Line, Pie, Heatmap. All share period + category filters.
- Filters: period pill (Day/Week/Month/Quarter/Year/All), settings modal for category selection, persisted to `localStorage` (`creative-report-settings`).
- Cards: bold title, muted body, micro-labels with wide tracking, subtle dividers, no noisy chrome.
- Tooling: hover tooltips on bars/heatmap, safe SVG rings with clamped arcs and NaN-safe values.

## Data choreography
- Input: `ordered: { metric, chart }[]` built from ledger events on the server.
- Windowing: `computeSeriesStats(metric, period)` slices by date, recomputes total/avg/min/max/days, derives fill%.
- Display: charts render filtered series; stats always match the active window, not global totals.

## Visual grammar (AppleStyle)
- Canvas: translucent slate/black, soft borders (`border-white/10`), large radii (rounded-3xl), gentle shadows.
- Type: uppercase micro-labels with generous tracking; bold display heads; body in `text-slate-300/400`; period pill in soft contrast.
- Color: metric color for strokes/fills; neutrals for scaffolding; avoid rainbow noise; keep gradients minimal.
- Motion: light hover/scale on dense elements; no jitter or over-animated transitions.
- Layout: breathing room via p-4..p-6; responsive grids (`lg:grid-cols-2/3`); consistent spacers.

## Extension hooks
- Add chart families by extending TAB_DEFS + `renderChart`.
- Swap localStorage for server/user-profile preferences if multi-device sync is needed.
- Align the Scriptable widget (`scripts/creative-report-widget.js`) with the same period/category semantics for mobile parity.

## File map
- `src/app/(tabs)/reports/page.tsx` — server loader + metric assembly.
- `src/components/ReportTabs.tsx` — tabs, filters, settings modal, chart rendering.
- `scripts/creative-report-widget.js` — home-screen parity (rings/bars/heatmap narrative).
