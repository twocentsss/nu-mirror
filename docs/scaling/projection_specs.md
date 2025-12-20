# Nu Projection Specifications (v1)

Projections are materialized read models derived from the Event Log. They are optimized for specific UI view paths.

## 1. `today_view`
- **Inputs**: `task.*`, `activity.*`, `game.*`, `audit.*`
- **Output Table**: `projection_today`
- **Cache Key**: `today:{tenant}:{day}`
- **Logic**: Aggregates open tasks, current focus, bingo status, and today's scoring rings.

## 2. `task_graph`
- **Inputs**: `edge.*`, `entity.tagged`, `task.*`
- **Output Table**: `projection_graph_edges`
- **Logic**: Calculates the adjacency matrix/list for nodes (tasks/entities) and their relationships (depends_on, blocked_by, related_to).

## 3. `assist_thread`
- **Inputs**: `utterance.added`, `assist.requested`, `llm.call.logged`, `no_data_ai.toggled`
- **Output Table**: `projection_assist_threads`
- **Logic**: Reconstructs chat history and assists, respecting the `no_data_ai` privacy constraints for display.

## 4. `ledger_flow`
- **Inputs**: `ledger.posted`, `task.status_set`, `task.updated`
- **Output Table**: `projection_ledger_entries`
- **Logic**: Materializes a searchable transaction log of all credits/debits and point movements.

## 5. `audit_segments` (Accountability)
- **Inputs**: `task.*`, `ledger.posted`, `assist.requested`
- **Output Table**: `projection_audit_segments`
- **Logic**: Rollup of the "7-segment accountability" model (who did what, when, device, cost, integrity).

## 6. `social_feed`
- **Inputs**: `social.wall.posted`, `social.space.created`, `social.partner.linked`, `report.generated`
- **Output Table**: `projection_social_feed`
- **Logic**: Combines wall posts and shared reports into a chronological feed, filtered by per-tenant ACLs.

## 7. `platform_metrics`
- **Inputs**: `platform.metric.ingested`, `search.performed`, `events.appended`
- **Output Table**: `projection_platform_metrics`
- **Logic**: Compute DAU, feature usage, and system latency snapshots for the Platform Hub.
