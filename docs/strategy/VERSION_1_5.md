# Version 1.5 Strategy: The Value Loop

**Phases Covered**: Phase 2 (Scoring + Rollups), Phase 3 (Reporting).
**Goal**: Compute "CEO Dashboards" without expensive reads and implement the Water-Flow Accounting visualization.

## Phase 2: Scoring & Rollups (Derived Truth)
**Objective**: Deterministic performance metrics.

### 1. Scoring Engine
*   **Concepts**:
    *   **TW** (Task Weight): Importance (0-10).
    *   **BPS** (Base Productivity Score): TW * Completion %.
    *   **Multipliers**:
        *   **SM** (Struggle Multiplier): 1.0-1.5 (reward effort).
        *   **QM** (Quality Multiplier): 0.5-1.5.
        *   **SF** (Streak Factor).
*   **Materialized Scores**: `Scores_Daily` tab stores computed `APS` (Adjusted Productivity Score) and `SPS` (Sustained Productivity Score) per day.

### 2. Rollups (Caching Layer)
*   **Why**: CEO dashboards need sub-second load times. We don't query raw FlowEvents live.
*   **Tabs**: `Rollups_Daily`, `Rollups_Weekly`.
*   **Metrics**:
    *   `min_total`, `min_channel` (Direct), `min_leak` (Expense).
    *   `backpressure_open`, `deltas_count`.

## Phase 3: Reporting (CEO Views)
**Objective**: Visual management of the "Liquid Ledger".

### 1. Visual Metaphors
*   **Rings**: Performance vs Global Max (Daily BPS/SPS).
*   **Heatmap**: Consistency holes (Streaks).
*   **Bars**: Volume volatility (Flow variance).

### 2. "Executive Summary" Generator
*   **Input**: Rollups + Deltas + Leaks.
*   **Output**: Text narrative (e.g., "70% efficiency today, major leak in Context Switching (-45m)").

## Technical Execution (Phase 2 & 3)
*   **Batch Jobs**: Nightly or on-Close compute jobs to populate Rollup/Score tabs.
*   **Spillover Graph**: Implement `Trigger -> Backpressure -> SuggestedFlow` causality chain.
