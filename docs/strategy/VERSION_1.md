# Version 1 Strategy: The Spine & Trust Loop

**Phases Covered**: Phase 0 (Task Spine), Phase 0.5 (Routing), Phase 1 (Truth Layer).
**Goal**: Stop mixing "plans" with "what actually happened" and establish the append-only Truth Layer.

## Phase 0: Stabilize the Task Spine
**Objective**: Robust "Plan Objects".

### 1. Unified Task Schema
We lock the schema for the `Tasks` sheet. Do not rename columns, only append.
*   **Core Fields**: `id`, `title`, `status` (open|doing|blocked|done|canceled), `stage` (capture|plan|execute|close).
*   **Timestamps**: `created_at`, `updated_at`, `closed_at`, `archived_at`.
*   **Version**: `schema_version`, `config_version`.
*   **Linkage**: `parent_task_id`, `_row`.

### 2. Archival Workflow
*   **Move-to-Archive**: Closed tasks move to `Tasks_Archive` sheet to keep the active sheet lightweight.
*   **Immutable References**: IDs remain valid even after archiving.

## Phase 0.5: Routing & BYOK (Provider Layer)
**Objective**: Future-proof AI interaction.

### 1. Provider Registry
*   **Providers Tab**: `provider_id`, `enabled`, `model`, `quota`, `priority`.
*   **Routing Rules**: choose provider by `job_type` (decompose, summarize, story).
*   **BYOK (Bring Your Own Key)**: User stores keys securely (e.g., in Env/Sheets/Drive), never on our servers.

## Phase 1: The Truth Layer (FlowEvents)
**Objective**: The "Liquid Ledger" implementation.

### 1. Chart of Accounts (CoA)
*   **CoA Tab**: `account_code` (e.g., 5102.01.03), `name`, `focus`, `segment_type`.
*   **Structure**: 3-part code (Series + Focus + Sub-focus).
    *   Series: 1xxx (Assets), 2xxx (Liabilities), 5xxx (COGS), etc.
    *   Focus: F01-F09 (Spiritual, Personal, Work, etc).

### 2. FlowEvents (The Ledger)
*   **Append-Only Log**: No mutations. Corrections via `reversal_of_event_id`.
*   **Schema**:
    *   `event_id`, `ts_start`, `ts_end`
    *   `unit` (min/usd/pts), `amount`
    *   `source_code`, `sink_code` (CoA references)
    *   `segments` (JSON: entity, context, mode)
    *   `evidence_json` (links to calendar, etc.)

### 3. "Close the Dam" Ritual (Daily Close)
*   **1440 Minute Reconciliation**: Everyone gets 1440 minutes. Where did they go?
*   **Ritual UI**:
    1.  **Review**: See captured Events vs 1440 target.
    2.  **Categorize**: Drag "Untracked" time into CoA buckets (or "Leak").
    3.  **Reflect**: 1 sentence reflection.
    4.  **Close**: Locks the day's events.

## Technical Execution (Phase 1)
1.  **Sheets Adapter**: Robust `GoogleSheetsService` with typing.
2.  **Flow API**: `POST /api/flow/event` (append), `POST /api/task/archive`.
3.  **Matcher Logic**: Simple regex/keyword matching first, then LLM-based.
