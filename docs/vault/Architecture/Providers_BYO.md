# Providers & BYO Security Model

> **"Bring Your Own" (BYO)** means user empowerment.
> You manage keys, storage, compute. The platform orchestrates.

## 1. Trust Boundary Layers
*   **Client-Only**: Raw notes, journals, private reflections (End-to-End Encrypted).
*   **Server-Orchestrated**: Routing, rule evaluation, aggregation (No raw secrets).
*   **External BYO**: Comic rendering, LLM calls, storage sinks.

## 2. Provider Contract
Providers are pluggable services (Lambda, API, Local).
*   `ComicProvider.render(events[], style) -> Image`
*   `ScoreProvider.score(events[]) -> Points`
*   `LLMProvider.summarize(text) -> Summary`

## 3. Security Rules (The "Non-Negotiable")
1.  **Providers NEVER write FlowEvents.** Only the core API appends truth.
2.  **Providers only submit SIGNED proposals.** `ProposedFlowEvent` + signature.
3.  **Capability Scoping**: Providers declare exactly what they need (e.g., "Read Week Only", "No Raw Text").

## 4. BYO Components
*   **BYO Key**: Encrypt private data with your own keys.
*   **BYO Storage**: S3, GDrive, Local.
*   **BYO Config**: Fork the config sheet and run your own rules.
