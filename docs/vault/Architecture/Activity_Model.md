# The Activity Model: The Meaning Compiler

> **"Only Activities are stored. Everything else is derived."**
> A single, canonical, versioned, event-sourced object that can be projected into any view.

## 1. The Core Philosophy
We are not building a task app. We are building a **Meaning Compiler**.
*   **Input**: Chaos (Rants, Thoughts, Plans, Actions).
*   **Process**: Compilation (Linguistic -> Intent -> Cohort -> Plan).
*   **Output**: Structure (Tasks, Reports, Comics, Scores).

## 2. The Activity Atom
The immutable source of truth.

```typescript
type Activity = {
  id: string; // ULID
  
  // Phase 0: The Raw Input (Sacred)
  raw_utterances: Array<{
    text: string;
    source: "voice" | "chat" | "calendar" | "import";
    ts: string;
  }>;

  // Phase 1: Linguistic World (Deterministic)
  linguistic: {
    sentences: string[];
    entities: string[]; // "Kitchen", "Mom", "Project X"
    sentiment: number;  // -1.0 to 1.0
  };

  // Phase 2: Intent World (Quantum/Probabilistic)
  intent: {
    rant: number;       // 0.0 - 1.0
    reflection: number;
    planning: number;   // Is this a task?
    execution: number;  // Did it already happen?
  };

  // Phase 3: Cohort World (Semantic Clustering)
  cohorts: Array<{
    id: string;         // e.g., "household_maintenance"
    confidence: number;
  }>;

  // Phase 4: Planning World (Projected View)
  plan?: {
    status: "backlog" | "sprint" | "done";
    effort_est: number; // minutes
    due_date?: string;
    dependencies: string[]; // ActivityIDs
  };

  // Phase 5: Flow World (Ledger Intent)
  ledger_intent?: {
    source: string; // e.g., "Time Spring"
    sink: string;   // e.g., "Kitchen Channel"
    segment: string;// "S6 Channels"
  };

  // Phase 6: Event Sourcing (Mutable State)
  events: Array<{
    type: "CREATED" | "STARTED" | "BLOCKED" | "COMPLETED";
    ts: string;
    payload?: any;
  }>;
};
```

## 3. The Projections (Views)
We never "convert" an activity. We "view" it.

### View 1: The Task
*   **Filter**: `intent.planning > 0.5`
*   **Show**: `plan.status`, `plan.effort`, `linguistic.entities`

### View 2: The Journal
*   **Filter**: `intent.reflection > 0.5` OR `intent.execution > 0.8`
*   **Show**: `raw_utterances`, `sentiment`, `events` (timeline)

### View 3: The Comic
*   **Input**: `linguistic.sentences` + `events`
*   **Render**: Character (Hero) + Setting (Cohort) + Plot (Events)

### View 4: The Ledger (FlowEvent)
*   **When**: `events` contains `COMPLETED`
*   **Emit**: `FlowEvent` derived from `ledger_intent` + `actual_duration`

## 4. Lifecycle (The Compiler Pipeline)
1.  **Ingest**: Capture raw text.
2.  **Parse**: NLP tags entities.
3.  **Classify**: LLM guesses Intent & Cohort.
4.  **Synthesize**: If intent=planning, generate `plan` block.
5.  **Execute**: User interactions append to `events`.
6.  **Collapse**: On completion, emit `FlowEvent` (Truth).
