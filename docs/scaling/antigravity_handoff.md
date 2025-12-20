# Antigravity ↔ Nu: Coding Handoff (Use TSL as the Canon)

## 0) North Star

Nu is **capabilities-first**, not “tabs-first.”

> “It’s about what the user can do, not what we want them to do.”

Everything is driven by a single canonical object:

**Activity (a.k.a Episode)**
…and **everything else is a projection** (Tasks, Reports, Stories, Comics, Scores, Views).

Your job as Antigravity: implement the **event-sourced spine + projection loop** so the UI can express capabilities reliably and scale to ~1,000 users on Postgres + Vercel + caching.

---

## 1) The Contract: `antigravity.contract.schema.tonl`

This TSL schema is the handshake contract between:

* producers (Nu UI, sync, schedulers, AI tools)
* event log (Postgres)
* consumers (projection workers, indexers, notifications)
* read models (TodayView / TasksView / GraphView)

Key invariants you must honor:

* **Envelope on every message/event** (`Envelope`)
* **Append-only event log** (`Event`)
* **Activity is canonical** (`Activity` + `Utterance`)
* **Projections are derived** (`Task`, `Goal`, etc.)
* **Idempotency + seq** for correctness under retries/offline

**Do not “CRUD mutate” state directly**. “State” is a materialization of event streams.

---

## 2) Capability Map (UI → Events → Views)

Nu UI is simplified to expose capabilities (not 18 tabs). Each capability is powered by events + projections.

### Top Bar

**Create Task**

* Domain: Tasks
* Events: `task.created`, `task.updated` (and/or `activity.created` → projector emits `task.created`)
* Views: `TasksView`, `TodayView`, `TaskGraphView`

**Task Graph**

* Domain: Graph/Links
* Events: `edge.added`, `edge.removed`, `entity.tagged`
* Views: `GraphView`, `DependencyView`

**Search**

* Domain: Index/Search
* Events: `index.created`, `index.upserted` (optional), `search.performed`
* Views: `SearchResultsView`

**Settings / About**

* Domain: Platform + Account
* Events: `acl.changed`, `preference.set`, `consent.updated`, `device.registered`
* Views: `PreferencesView`, `DevicesView`, `PrivacyView`

### Bottom Bar (5–7 items)

**Today** (Focus/Sprint/Bingo are *views* of the same data)

* Views: `TodayView`, `TodoView`, `FocusView`

**Todo**

* Views: `Graph/Projects/Archive` projections

**Assist** (Rant/Chat/AI tools)

* Events: `utterance.added`, `assist.requested`, `llm.call.logged`
* Views: `AssistThreadView`, `ActionPlanView`

**Create (+)** (entry-point into Activity creation)

* Event: `activity.created` always exists before projections

**Me**

* Domain: Account/Privacy/BYOK
* Events: `provider.key.added`, `no_data_ai.toggled`
* Views: `KeysView`, `PrivacyView`, `LifeFocusView`

---

## 3) The Spine: “4 Moving Parts”

1. **Producers**

* UI, Background Sync, Scheduled Jobs, AI Workers (explicit triggers only, not ambient)

2. **Event Log (source of truth)**

* Postgres append-only log
* Each write is an `Event` containing `Envelope` + `type` + `agg` + `seq` + `body`

3. **Consumers**

* projection builders (Today/Tasks/Graph)
* indexers (search)
* notifications (later)

4. **Projections**

* materialized read models optimized for read paths
* “Strong append, eventual views, optimistic UI”

---

## 4) What to Build (Minimum Working System to Load Test 1,000 Users)

### 4.1 Freeze the Client Protocol (the only APIs you need)

**Write**

* `POST /events/append`

  * accepts `Event[]` (batch)
  * enforces idempotency
  * returns `Result` with stats (ms, bytes, cacheHit=false, etc.)

**Read**

* `GET /events/read?cursor=...`

  * for replay/debug/diagnostics
* `GET /views/today?day=YYYY-MM-DD`

  * read model endpoint (cache-backed)

Optional:

* `GET /caps` (capability flags / versioning)

> Design goal: **≤ 1 Postgres write transaction per user action** (batch events).

---

## 5) Postgres Storage Setup (Event Log + Projections + Partition)

You will implement Postgres tables that directly map to TSL.

### 5.1 Event Log table (`event_log`)

Append-only, queryable, dedupable.

Minimum columns:

* `event_id` (uuid) PK
* `tenant_id` (uuid)
* `actor_id` (uuid)
* `trace_id` / `span_id` (uuid)
* `type` (text) — matches `EvtType`
* `agg_kind` (text)
* `agg_id` (uuid)
* `seq` (bigint) — monotonic per aggregate
* `ts` (timestamptz or bigint unix ms)
* `idempotency_key` (uuid) — derived from client or generated
* `body` (jsonb)
* `hash`, `prev_hash` (optional)

Indexes (non-negotiable):

* unique: `(tenant_id, agg_kind, agg_id, seq)`
* unique: `(tenant_id, actor_id, idempotency_key)` (or `(tenant_id, idempotency_key)`)
* read: `(tenant_id, ts desc)`
* read: `(tenant_id, agg_kind, agg_id, ts desc)`

### 5.2 Partition Strategy

Partition `event_log` by time:

* monthly partitions on `ts` (or `ingested_ts`)
* this keeps indexes small and makes heavy ingestion stable

### 5.3 Projection tables

At least:

* `projection_today_tasks` (tenant_id, day, task_id, status, title, dueTs, priority, tags, updatedTs, activityId)
* `projection_tasks` (current task state)
* `projection_activity` (current activity state)
* `projection_edges` (graph edges for views)

Projection tables are allowed to be “CRUD-y” internally, because they are derived.

---

## 6) Caching Setup (Required)

We want load testing to represent real UX, not DB-scan UX.

### 6.1 Redis (Upstash recommended)

Cache keys (example):

* `today:{tenant}:{yyyy-mm-dd}`
* `tasks:{tenant}:{filterHash}`
* `caps:{tenant}`

TTL:

* 10–30 seconds for Today/Tasks during load test

Invalidation:

* on `POST /events/append`, delete/soft-expire the affected tenant keys

Return `Result.stats.cacheHit` in read endpoints.

---

## 7) Projection Engine (How to Build It)

Projection engine is a consumer that:

* reads events in order
* updates derived tables
* updates caches

### 7.1 Basic loop

* Maintain a projector cursor per tenant (and per projection if needed)
* Poll every ~1–2 seconds during load test OR trigger after append

### 7.2 Determinism rules

* Projections must be **idempotent**
* Must handle replays:

  * `rebuildProjection` command exists in TSL for full rebuild
* Must respect per-aggregate event ordering (`seq`)

---

## 8) Activity-first Creation Flow (Canonical)

The Nu platform’s core is **Activity stream**.

### 8.1 New input always becomes an Activity

User typing “rant / plan / todo / thought”:

* append:

  * `activity.created` with `Activity.raw.utterances[0]`
  * optionally `utterance.added` for subsequent lines
* projector derives:

  * `task.created` if it’s actionable
  * or only updates activity semantics if not

### 8.2 Tasks are projections

Task always points back to:

* `activityId`
  so we can regenerate tasks differently later without losing the original “episode”.

---

## 9) How Antigravity should “speak” (TSL-native)

Antigravity must treat TSL as runtime objects, not just docs.

### Commands (write intent)

Send `Command` (`env.kind="cmd"`) for:

* `snapshot`, `diff`, `validate`, `rebuildProjection`, `createIndex`

### Events (source of truth)

Append `Event` objects to `event_log`:

* `type` in `EvtType`
* `agg.kind/id` pointer
* `seq` monotonic per aggregate
* `body` typed by `type`

### Results (auditable)

Respond with `Result`:

* `ok`, `data`, `stats(ms/tokens/bytes/cacheHit)`, `err`

Token-cost and latency must be observable via `stats`.

---

## 10) MVP Acceptance Criteria (So we can load test 1,000)

Antigravity’s “done” means:

1. `POST /events/append` can accept batched events, dedupe safely, return stats
2. Projection worker keeps Today/Tasks consistent (eventual)
3. `GET /views/today` hits cache most of the time (cacheHit true)
4. Replay works: `rebuildProjection` rebuilds from event log
5. The system remains stable under:

   * offline retries (idempotency)
   * out-of-order delivery per device (use seq / server ordering)
   * concurrency (multiple devices)

---

## 11) Implementation Notes (Vercel reality)

* Use Postgres connection pooling (serverless-safe)
* Keep `/events/append` fast: **insert-only** + minimal work
* Heavy work goes to projector/worker (or background route)
