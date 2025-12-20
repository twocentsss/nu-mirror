-- ====== Extensions (optional but useful) ======
create extension if not exists pgcrypto;

-- ====== Core schema ======
create schema if not exists nu;

-- ====== Event Log (append-only) ======
create table if not exists nu.event_log (
  event_id text primary key,   -- Changed from uuid to text
  tenant_id text not null,     -- Changed from uuid to text
  actor_id text,               -- Changed from uuid to text
  device_id text,
  trace_id text,               -- Changed from uuid to text
  span_id text,                -- Changed from uuid to text
  parent_span_id text,         -- Changed from uuid to text

  type text not null,          -- matches EvtType (e.g. activity.created)
  agg_kind text not null,      -- "activity" | "task" | ...
  agg_id text not null,        -- Changed from uuid to text
  seq bigint not null,         -- monotonic per aggregate

  ts timestamptz not null,     -- event time (client or server)
  ingested_at timestamptz not null default now(),

  idempotency_key text,        -- Changed from uuid to text
  body jsonb not null,

  prev_hash text,
  hash text
);

-- Uniqueness + fast reads
create unique index if not exists event_log_uniq_agg_seq
  on nu.event_log (tenant_id, agg_kind, agg_id, seq);

create unique index if not exists event_log_uniq_idem
  on nu.event_log (tenant_id, actor_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists event_log_by_tenant_ts
  on nu.event_log (tenant_id, ts desc);

create index if not exists event_log_by_tenant_agg_ts
  on nu.event_log (tenant_id, agg_kind, agg_id, ts desc);

create index if not exists event_log_by_type_ts
  on nu.event_log (tenant_id, type, ts desc);

-- ====== Projection: tasks (current state) ======
create table if not exists nu.projection_tasks (
  tenant_id text not null,     -- Changed from uuid to text
  task_id text not null,       -- Changed from uuid to text
  activity_id text,            -- Changed from uuid to text
  title text not null,
  status text not null,
  due_ts timestamptz,
  priority smallint,
  tags text[],
  updated_at timestamptz not null default now(),
  fields jsonb,

  primary key (tenant_id, task_id)
);

create index if not exists projection_tasks_by_status
  on nu.projection_tasks (tenant_id, status);

-- ====== Projection: today view (denormalized for fast reads) ======
create table if not exists nu.projection_today (
  tenant_id text not null,     -- Changed from uuid to text
  day date not null,
  task_id text not null,       -- Changed from uuid to text
  status text not null,
  title text not null,
  due_ts timestamptz,
  priority smallint,
  tags text[],
  updated_at timestamptz not null default now(),

  primary key (tenant_id, day, task_id)
);

create index if not exists projection_today_by_status
  on nu.projection_today (tenant_id, day, status);

-- ====== Projector cursor (so we know what we've processed) ======
create table if not exists nu.projector_cursor (
  tenant_id text not null,     -- Changed from uuid to text
  projector text not null,            -- e.g. "tasks", "today"
  last_ingested_at timestamptz not null default '1970-01-01',
  last_event_id text,          -- Changed from uuid to text
  updated_at timestamptz not null default now(),
  primary key (tenant_id, projector)
);
