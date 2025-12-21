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

-- ====== QUANTUM TABLES (New) ======

-- 1. Intent Atoms (Raw Thoughts)
create table if not exists nu.intent_atoms (
  tenant_id text not null,
  atom_id text not null,
  text text not null,
  status text not null,         -- 'floating', 'proposed', 'committed', 'discarded'
  created_at timestamptz not null default now(),
  metadata jsonb,               -- signals, detected words
  
  primary key (tenant_id, atom_id)
);

-- 2. Options (Superposition Candidates)
create table if not exists nu.options (
  tenant_id text not null,
  option_id text not null,
  intent_id text not null,      -- Link to Atom
  title text not null,
  duration_min int,
  energy_cost int,
  value_score int,
  is_selected boolean default false,
  
  primary key (tenant_id, option_id)
);

create index if not exists options_by_intent
  on nu.options (tenant_id, intent_id);

-- 3. Ledger Entries (Accounting)
create table if not exists nu.ledger_entries (
  tenant_id text not null,
  entry_id text primary key,
  related_entity_type text,     -- 'task', 'manual'
  related_entity_id text,
  
  account text not null,        -- 'time', 'energy', 'focus'
  segment text not null,        -- 'work', 'self', 'family', etc.
  direction text not null,      -- 'debit', 'credit'
  amount numeric not null,
  
  occurred_at timestamptz not null default now()
);

create index if not exists ledger_by_day
  on nu.ledger_entries (tenant_id, occurred_at);

-- 4. Abstract Goals (Life Focus Targets)
create table if not exists nu.goals (
  tenant_id text not null,
  goal_id text not null,
  lf_id int not null,           -- 1-9
  title text not null,
  status text not null,         -- 'active', 'completed', 'archived'
  rationale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  primary key (tenant_id, goal_id)
);

create index if not exists goals_by_lf
  on nu.goals (tenant_id, lf_id);

create index if not exists goals_by_status
  on nu.goals (tenant_id, status);

-- 5. Projects (Concrete Undertakings)
create table if not exists nu.projects (
  tenant_id text not null,
  project_id text not null,
  goal_id text not null,
  title text not null,
  status text not null,         -- 'active', 'completed', 'archived'
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  primary key (tenant_id, project_id),
  foreign key (tenant_id, goal_id) references nu.goals(tenant_id, goal_id)
);

create index if not exists projects_by_goal
  on nu.projects (tenant_id, goal_id);

create index if not exists projects_by_status
  on nu.projects (tenant_id, status);


-- 6. Daily Metrics (Telemetry & Analytics)
create table if not exists nu.daily_metrics (
  day date not null,
  metric_key text not null,
  value numeric not null default 0,
  metadata jsonb,
  updated_at timestamptz not null default now(),

  primary key (day, metric_key)
);

create index if not exists daily_metrics_by_range
  on nu.daily_metrics (day, metric_key);
