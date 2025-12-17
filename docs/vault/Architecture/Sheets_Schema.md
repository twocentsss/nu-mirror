# Google Sheets Architecture Schema

> **The "Database" is Google Sheets.**
> This enables real-time user access, zero-cost storage, and "BYO Config".

## A. System + Versioning
Immutability, replay, and audit.

### `Config_Versions`
| Column | Type | Description |
| :--- | :--- | :--- |
| `config_version` | ID | e.g., `cfg_0001` |
| `published_at` | ISO | Timestamp |
| `published_by` | String | User ID or System |
| `is_active` | Bool | Current active config |

### `Adjustments_Log`
| Column | Type | Description |
| :--- | :--- | :--- |
| `adjustment_id` | ID | ULID |
| `reversal_of_event_id` | ID | The event being corrected |
| `reason` | String | Why it was adjusted |

---

## B. WorldGraph Master Data

### `Worlds`
The 9 Life Focuses (Core, Self, etc.).
*   `world_code`, `name`, `active`.

### `Components` (The Routing Targets)
Channels, reservoirs, leaks.
| Column | Type | Description |
| :--- | :--- | :--- |
| `component_code` | ID | e.g., `C_COOK`, `C_DOOMSCROLL` |
| `world_code` | Ref | Link to World |
| `segment` | Enum | S1..S7 |
| `type` | Enum | spring, channel, reservoir, leak... |
| `default_unit` | Enum | min, usd, kwh, pts |

### `Segment_Values`
Normalized GL segments.
*   `value_code`, `label`, `parent_value_code`.

---

## C. Matching & Routing

### `Matcher_Rules`
Deterministic classification.
*   `match_kind` (keywords_any, regex, evidence).
*   `pattern` (csv keywords).
*   `evidence_kind` (calendar, location).
*   `candidate_component_code`.

### `Routing_Rules`
Candidate → Final Sink + Segments.
*   `if_component_code`.
*   `set_sink_component_code`.
*   `set_entity`, `set_context`, `set_mode`.

---

## D. Spillover & Backpressure

### `Spillover_Rules`
Causality Engine (`Cook` -> `Dishes`).
*   `trigger_component_code`.
*   `emit_backpressure_component_code`.
*   `base_minutes_estimate`.
*   `due_window` (24h, 72h).

### `Gates`
Control flow entry.
*   `gate_id`, `trigger_json`, `action_json`.

---

## E. FlowStore (The Ledger)

### `FlowEvents` (Append-Only)
The Truth.
*   `event_id`, `ts_start`, `ts_end`, `unit`, `amount`.
*   `source`, `sink` (Component Codes).
*   `segments` (entity, context, mode, etc.).
*   `evidence_json`.
*   `version`, `reversal_of_event_id`.

### `BackpressureItems`
Pending obligations.
*   `bp_id`, `created_by_event_id`, `component_code`, `status`.

### `Deltas`
Outcomes.
*   `delta_id`, `delta_type` (ship, learn, etc.), `points`.

---

## F. BYO Providers

### `Providers`
Registry of external services.
*   `provider_id`, `type` (comic, story, score), `endpoint`.
