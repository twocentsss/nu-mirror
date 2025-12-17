# Version 2 Strategy: The Growth Loop

**Phases Covered**: Phase 4 (Storytelling/Comics), Phase 5 (Games + Monetization).
**Goal**: Engagement, retention, and "Replay" value.

## Phase 4: Storytelling & Comics
**Objective**: Narrative projections of the truth.

### 1. The Comic Engine
*   **Pipeline**: `FlowEvents` + `Deltas` -> `Comic_Job` -> `Provider (AI)` -> `Comic_Panel`.
*   **Structure**: 3/6/9 panel templates.
*   **Scene Grammar**: Setting (from Context) + Character (User Avatar) + Action (Task) + Caption (Narrative).
*   **Trope Bank**: Procrastination Monster, Meeting Hydra, Laundry Dragon.

### 2. "Replay My Week"
*   **Narrative Arcs**: Setup -> Conflict -> Resolution (Pixar/Freytag templates).
*   **Output**: Sharable weekly summary (PNG strip + metrics footer).

## Phase 5: Games & Monetization
**Objective**: Economy and fun.

### 1. Gamification Layer
*   **Bingo**: Weekly board filled by specific Task/FlowEvent completions.
*   **Quests**: "Tunneling Quests" (2-5 min actions) to clear Backpressure.
*   **XP/Levels**: Rewards for consistency (Streaks) rather than just intensity.

### 2. Economy & Monetization
*   **Dual Currency**:
    *   **FlowPoints**: Earned daily, decays (use it or lose it).
    *   **VaultPoints**: Earned via milestones, permanent status.
*   **Store**: Spend points on Comic Skins, Panel Styles, Fortune Cards.
*   **Entitlements**: Paid features (Advanced Replays, Deeper Analytics).

## Technical Execution (Phase 4 & 5)
*   **Comic Provider API**: Standard interface for rendering (BYO Provider).
*   **Game State Tab**: Persist Bingo board state, Quest progress.
*   **Wallet Tab**: Ledger for Points (Earn/Spend).
