# Nu Event-Driven Architecture & Scaling Strategy

## 1. Principles: Capabilities vs Modules

"It’s about what the user can do, not what we want them to do."

### IA Strategy
Instead of 18 tabs, the UI exposes **capabilities**. Each capability is powered by **events + projections**.

- **Capture**
- **Organize**
- **Act**
- **Reflect**
- **Create**
- **Connect**
- **Control**

### Domain Mapping (UI -> Events -> Views)

#### Top Bar
*   **Create Task**
    *   Domain: Tasks
    *   Events: `TASK_CREATED`, `TASK_UPDATED`, `TASK_STATUS_SET`, `TASK_ARCHIVED`
    *   Views: `TasksView`, `TodayView`, `TaskGraphView`
*   **Task Graph**
    *   Domain: Graph/Links
    *   Events: `EDGE_ADDED`, `EDGE_REMOVED`, `ENTITY_TAGGED`
    *   Views: `GraphView`, `DependencyView`
*   **Search**
    *   Domain: Index/Search
    *   Events: `INDEX_UPSERTED`, `SEARCH_PERFORMED`
    *   Views: `SearchResultsView`
*   **Settings / About**
    *   Domain: Platform + Account
    *   Events: `PREFERENCE_SET`, `CONSENT_UPDATED`, `DEVICE_REGISTERED`
    *   Views: `PreferencesView`, `DevicesView`

#### Bottom Bar (Simplified to 5-7 items)
1.  **Today** (Focus, Sprint, Bingo)
    *   Domain: Projections
    *   Views: `TodayView`, `TodoView`, `FocusView`
2.  **Todo** (Graph, Projects, Archive)
3.  **Assist** (Rant, Chat, AI Tools)
    *   Domain: Assist
    *   Events: `UTTERANCE_CAPTURED`, `ASSIST_REQUESTED`, `LLM_CALL_LOGGED`
    *   Views: `AssistThreadView`, `ActionPlanView`
4.  **Create** (+)
5.  **Me** (Reports, Stories, Social, Store, Platform)
    *   Domain: Account / Privacy / BYOK
    *   Events: `PROVIDER_KEY_ADDED`, `NO_DATA_AI_TOGGLED`
    *   Views: `KeysView`, `PrivacyView`, `LifeFocusView`

---

## 2. Architecture: Event-Driven Core

### The 4 Moving Parts
1.  **Producers**: UI, Background Sync, Scheduled Jobs, AI Workers.
2.  **Event Log (Source of Truth)**: Append-only storage (Sheets rows initially -> Postgres/R2 later).
3.  **Consumers**: Projection builders, Indexers, Notifications.
4.  **Projections (Read Models)**: Materialized tables optimized for reads (e.g., `TodayView`, `Scoreboard`).

### The Event Envelope
Every event should standardize on:
```json
{
  "eventId": "uuid",
  "type": "string",
  "entityId": "taskId_etc",
  "ts": "timestamp",
  "actor": "userId_deviceId",
  "seq": "monotonic_per_device",
  "payload": {},
  "schemaVersion": 1,
  "idempotencyKey": "uuid"
}
```

### Consistency Model
*   **Strong** for event append.
*   **Eventual** for derived views.
*   **Optimistic UI** for instant user feedback.

---

## 3. Scaling Ladder

### Phase 0: 1-10 Users (Current)
*   **Bottleneck**: Latency.
*   **Storage**: Direct Google Sheets R/W.
*   **Action**: Batch Sheets calls. Add basic retries.

### Phase 1: 10-100 Users
*   **Bottleneck**: Sheets API Quota (300 req/min).
*   **Action**:
    *   Client write-behind (buffer 15-60s).
    *   Server-side read caching (Today/Week views cached 10-30s).
    *   Collapse APIs into `POST /events/append`.
    *   Target: **<= 1 Sheets call per user action**.

### Phase 2: 100-1,000 Users
*   **Bottleneck**: Sheets writes.
*   **Action**:
    *   Sheets becomes **Log + Rollup Cache** (not CRUD).
    *   One event batch row per flush.
    *   AI triggers explicitly, not ambiently.

### Phase 3: 1,000-10,000 Users
*   **Bottleneck**: Sheets is too slow for hot path.
*   **Action**:
    *   **Nu Node v0**: Postgres / Turso / Durable Objects.
    *   Sheets becomes backup/export/personal sink.
    *   Vercel handles Auth/Gateway; Node handles Data.

---

## 4. Immediate Implementation Plan (To get to 100x)

1.  **Freeze Client Protocol**:
    *   `POST /events/append`
    *   `GET /events/read?cursor=`
    *   `GET /views/today`
    *   `GET /caps`
2.  **Convert Writes to Events**: Define the single event envelope.
3.  **Sync Engine v1**:
    *   Local queue (IndexedDB).
    *   Coalesce changes.
    *   Flush interval (15-60s) + `visibilitychange`.
