# Nu Flow Protocol: The Master Strategy

> **"Track your life like money. Reconcile 1440."**

## The Vision: Shape the River, Don't Chase the Clock

Life is not a list. Life is flow.

Time flows. Money flows. Energy flows. Attention flows. most drift isn't caused by laziness—it's caused by invisible flow: leaks, friction, unacknowledged downstream costs, and a lack of "riverbed" structure.

**Nu Flow** is a platform that makes life steerable by doing one thing relentlessly well: returns everything into a governed stream of **FlowEvents**.

*   Every meaningful moment becomes a drop with metadata.
*   Drops route through channels (direct action), fill reservoirs (capacity), create deltas (outcomes), or escape as leaks (loss).
*   The system is configurable (rules), explainable (why it matched), and auditable (append-only with adjustments).

## The Core Philosophy: Liquid Ledger

We operate as a **Liquid Ledger**: a structured, balanced flow system in a graph, with strict invariants.

### 1. The Non-Negotiable Law: Two-Sided Balance
Every FlowEvent obeys the same invariant as double-entry accounting:
**Draw == Pour**.
If something is spent, it went somewhere.

*   **Debit-side (Sink)**: Where value is applied.
*   **Credit-side (Source)**: Where value is sourced from.
*   **Amount**: The quantifiable unit.

### 2. Multi-Currency
We treat each resource as a first-class unit:
*   **Time**: Minutes (Daily spring = 1440 minutes).
*   **Money**: USD (Income springs, cash reservoirs).
*   **Energy**: kWh or Battery points.
*   **Points**: Platform currency (FlowPoints, VaultPoints).

### 3. The Water Metaphor (Seven Segments)
These segments map traditional General Ledger concepts to our hydrology metaphor.

| Segment | Water Name | GL Meaning | Examples |
| :--- | :--- | :--- | :--- |
| **S1** | **Spring** | Sources | 1440m/day, Salary, Energy budget |
| **S2** | **Reservoirs** | Assets/Capacity | Sleep reserve, Skill capital, Savings |
| **S3** | **Backpressure** | Liabilities/Debt | Chores backlog, Admin debt |
| **S4** | **North Star** | Equity/Values | Purpose, Identity, Priorities |
| **S5** | **Deltas** | Returns/Outcomes | Shipped work, Workout done |
| **S6** | **Channels** | COGS/Direct Do | Deep work, Cooking, Mentorship |
| **S7** | **Leaks** | Expenses/Loss | Doomscrolling, Context switching |

**Segment 0: Entity/Context**
The balancing dimension:
*   **Entity**: Self, Household, Work, Community.
*   **Context**: Home, Office, Outside, Commute.
*   **Mode**: Deep, Light, Social, Recovery.

## WorldGraph: The Truth Engine

All data lives in a canonical knowledge graph, the **WorldGraph**.

### The Universal Contract: `FlowEvent`
What ties everything together is one canonical event schema:

```typescript
interface FlowEvent {
  id: string; // ULID
  ts_start: string;
  ts_end: string;
  unit: 'min' | 'usd' | 'kwh' | 'pts';
  amount: number;
  source: string; // Account Code
  sink: string;   // Account Code
  segments: Segments; // The 7 segments + Entity/Context
  raw_text: string;
  matcher_id: string;
  rule_ids: string[];
  evidence: Evidence[]; // Links to calendar, receipt, etc.
  version: string;
  reversal_of?: string; // If adjustment
}
```

### Causality & Spillover
We formalize cause-and-effect into a deterministic graph:
1.  **Trigger**: Event happens (e.g., "Cook Dinner").
2.  **Spillover**: Emits `BackpressureItems` (e.g., "Dirty Dishes").
3.  **Suggestion**: Generates `SuggestedFlow` (e.g., "Wash Dishes").
4.  **Clear**: Action reduces backpressure and produces a Delta.

## Governance: Council of You
We avoid chaos through a structured governance protocol.
*   **Weekly Council**: A ritual meeting to review top leaks, backpressure sources, and performing channels.
*   **Config-Driven**: All changes to rules or structure are "Config Changes" with version bumps.
*   **BYO (Bring Your Own)**: Users own their keys, storage, and compute. The platform orchestrates.

---

## Roadmap Overview

### [Version 1: The Spine (Phase 0-1)](./VERSION_1.md)
*   **Objective**: Trust Loop. Stabilize tasks, establish the Sheet-based spine, and start the "Truth Layer" (FlowEvents).
*   **Key Feature**: "Close the Dam" daily ritual.

### [Version 1.5: The Value Loop (Phase 2-3)](./VERSION_1_5.md)
*   **Objective**: Scoring & Reporting. Compute CEO dashboards, scoring engine (BPS/APS/SPS).
*   **Key Feature**: Automated Scoring & Rollups.

### [Version 2: The Growth Loop (Phase 4-5)](./VERSION_2.md)
*   **Objective**: Engagement & Story. Storytelling, Comics, Games, and Monetization/Economy.
*   **Key Feature**: "Replay My Week" Comic & Gamified Quests.
