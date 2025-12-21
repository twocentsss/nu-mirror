# Project Nu: The Immutable Spine

**"Nu organizes your days so your life can compound."**

Project Nu is not about building a task manager; it is about building the infrastructure for human stability. We have engineered a platform where truth is immutable, days are organized, and progress is visible. By separating the "Engine" of reasoning from the "Illusion" of interface, we provide a sanctuary for the mind to act while the system remembers.

## Architecture Overview
Nu is built on an **Event-Sourced Headless Brain** with **Zen Projections**. Every interaction is an immutable event that feeds into a life that compounds.

### The Data Spine: Event Sourcing
The **EventLog** is the canonical source of truth. Every user action (Capture, Complete, Edit) is an immutable, append-only event.
- **Classical Truth**: The EventLog is the river that did flow. It provides the auditable record a meaningful life deserves.
- **Scalability**: Designed to handle ~1,000 users on a serverless stack with atomic, batched writes.
- **Consistency**: Strong consistency for event appends; eventual consistency for derived behavioral views.

---

## Technical Innovation: The 12D Assertion Layer
When a user captures text, it isn't just stored; it is deconstructed into the **Assertion Layer**.
- **12 Dimensions of Meaning**: Every utterance is tagged across: Entity, Action, Context, Intent, Outcome, Time, Meaning, State, Values, Relationships, Principles, and Station.
- **LLM Semantic Parsing**: We utilize a chain of prompts (OpenAI/Gemini/OpenRouter) to transform raw text into these structured dimensions.
- **Sub-Task Inference**: Nu doesn't just store a task; it infers the `LF` (Life Focus) and `EnergyCost` automatically.

---

## The Quantum Protocol: Engineering Foresight
Nu handles uncertainty through the **Quantum Flow Protocol**. While the EventLog is classical, our planning is quantum.
- **Superposition Events**: A `ProposedFlowEvent` represents a candidate truth with probability mass. "Meeting with Sarah" may be `S6 Social` (30%) or `S6 Grind` (70%) until confirmed.
- **Measurement Ceremony**: The "Daily Close" is a system-wide **Collapse Event**. It measures the day's superposition and collapses probabilistic proposals into clean ledger entries.
- **Scenario Branching**: Week planning creates multiple `ScenarioBranches` (e.g., "Ship Mode" vs. "Recovery"). The engine simulates deltas, reservoir levels, and backpressure growth for each branch.

---

## The Liquid Ledger: Neural Accounting
Nu implements a dual-entry accounting system for non-monetary human capital.
- **Reservoirs & Leaks**: We track `SleepReservoir`, `FocusCredits`, and `DoomscrollLeaks`.
- **Entanglement**: Reservoirs are coupled. A leak in `Chaos` directly impacts the capacity of `Grind` and `Level Up`.
- **Interference**: Habits are modeled as constructive or destructive interference. `Gym` + `Deep Work` creates an amplification effect visible in the productivity metrics.

---

## The Reasoning Engine: Beyond CRUD
Nu implements structural reasoning frameworks as first-class citizens:
- **SCQA Frame**: Situation, Complication, Question, Answer. Used to transform "vague problems" into "structured episodes."
- **Issue Trees**: Recursive breakdown of problems into mutually exclusive, collectively exhaustive (MECE) nodes.
- **WorldGraph**: A directed acyclic graph (DAG) of all entities. Every node is a materialization of its history in the EventLog.

---

## LLM Orchestration & Routing
The `LlmRouter` manages model diversity to ensure 99.9% availability of intelligence.
- **Multi-Provider Failover**: Seamlessly switches between OpenAI, Anthropic, Gemini, and OpenRouter.
- **Context-Aware Routing**: Simple classification is routed to 4B-12B parameter models (Gemma/Llama); complex reasoning (SCQA/Issue Trees) is routed to frontier models.
- **Performance Tracking**: Every LLM call is logged with metadata: tokens, latency, cost, and cache status.

---

## Implementation Stack
- **Frontend**: Next.js 15, Framer Motion, Tailwind CSS.
- **Backend**: Next.js API Routes (Serverless / Edge).
- **Database**: 
  - **Postgres (Supabase)**: Event log and projection tables.
  - **Redis (Upstash)**: High-speed projection caching and rate-limiting.
  - **Google Sheets**: Optional user-owned data spine for transparency.
- **Auth**: NextAuth with Google SSO.

---

## Zen Gates: Engineering for Calm
Every PR is evaluated against **Zen Gates**:
1. **Choice Reduction**: Does this add a mandatory decision? (Rejection if yes).
2. **Cognitive Load**: Does this increase the "Time to First Relief"?
3. **Headless First**: Build power as an API; expose UI only when earned.

---

## Future Roadmap (Scale)
- **Vector Bench**: Vector search across the EventLog for "Historical Similarity."
- **Local-First Sync**: Moving the EventLog to a local CRDT for zero-latency offline capture.
- **Multi-Agent Simulation**: LLM "Characters" that simulate your week to find bottlenecks.
