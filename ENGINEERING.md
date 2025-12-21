# Project Nu: Engineering Deep Dive

## Architecture Overview
Project Nu is built on an **Event-Sourced Headless Brain** with **Zen Projections**. The architecture separates the "Engine" (Logic/Data) from the "Illusion" (UI).

### The Data Spine: Event Sourcing
The **EventLog** is the canonical source of truth. Every user action (Capture, Complete, Edit) is an immutable event.
- **Benefits**: Perfect audit trails, time-travel debugging, and the ability to rebuild any **Projection** (Read Model) from scratch.
- **Storage**: Supports a hybrid model. **Postgres** for high-concurrency/relational queries and **Google Sheets** as a transparent, user-owned persistent backup/data-spine.

---

## Technical Innovation: The 12D Assertion Layer
When a user captures text, it isn't just stored; it is deconstructed into the **Assertion Layer**.
- **12 Dimensions of Meaning**: Every utterance is tagged across: Entity, Action, Context, Intent, Outcome, Time, Meaning, State, Values, Relationships, Principles, and Station.
- **LLM Semantic Parsing**: We utilize a chain of prompts (OpenAI/Gemini/OpenRouter) to transform raw text into these structured dimensions.
- **Sub-Task Inference**: Nu doesn't just store a task; it infers the `LF` (Life Focus) and `EnergyCost` automatically.

---

## The Reasoning Engine
Nu goes beyond CRUD. It implements structural reasoning frameworks:
- **SCQA Frame**: Situation, Complication, Question, Answer. Used to transform "vague problems" into "structured episodes."
- **Issue Trees**: Recursive breakdown of problems into mutually exclusive, collectively exhaustive (MECE) nodes.
- **WorldGraph**: A graph of all entities (Tasks, Goals, Episodes, Characters). Every node in the WorldGraph is influenced by the **EventLog**.

---

## LLM Orchestration & Routing
The `LlmRouter` is a mission-critical component that manages model diversity and reliability.
- **Multi-Provider Support**: Seamless fallback between OpenAI (GPT-4o), Anthropic (Claude 3.5), Gemini (2.0 Flash), and OpenRouter (Llama, Qwen, Gemma).
- **Lease & Cooldown**: Smart key management that tracks rate limits and "cools down" keys on failure.
- **Cost/Performance Logic**: Routes simple classification to fast/cheap models (Gemma/Llama) and complex reasoning to "frontier" models (Claude/GPT-4o).

---

## Innovation in Planning: Quantum Projections
Traditional scheduling is linear. Nu uses **Quantum Planning**:
- **Jar Fitting**: Instead of fixed times, tasks are "fitted" into capacity jars.
- **Net Workload Delta**: A metric that calculates if your life is getting "heavier" or "lighter" based on the ratio of captured items to completed outcomes.

---

## Scalability & Standardization
- **Nu Flow Protocol**: A standardized API for how data flows from Capture -> Assertion -> Event -> Projection.
- **Strategy Templates**: Extensible recipes for common workflows (e.g., "Weekly Review", "Deep Work Sprint").
- **RulePacks**: A declarative logic layer where users (or the system) can define "If-Then" triggers (e.g., "If I capture a chore, suggest pairing it with a podcast").

---

## Implementation Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS (for layout), Framer Motion (for Zen-like micro-animations).
- **Backend**: Next.js API Routes (Edge Runtime where possible).
- **Database**: Supabase (Postgres) + Redis (for LLM rate-limiting/caching).
- **AI**: Multi-LLM Routing (OpenRouter, OpenAI, Gemini).

---

## Zen Gates: Engineering for Calm
Every PR is evaluated against **Zen Gates**:
1. **Choice Reduction**: Does this add a mandatory decision? (Rejection if yes).
2. **Cognitive Load**: Does this increase the "Time to First Relief"?
3. **Headless First**: Can this feature exist without a UI entry point?

---

## Future Roadmap (Scale)
- **Vector Bench**: Implementing vector search across the `EventLog` for "Historical Similarity" (What did I do last time I had this problem?).
- **Local-First Sync**: Moving the EventLog to a local CRDT for instantaneous offline capture.
- **Multi-Agent Simulation**: Simulating your week using LLM "Characters" to find potential bottlenecks before they happen.
