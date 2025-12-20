
-- ====== Telemetry & Analytics ======

create table if not exists nu.daily_metrics (
  day date not null,
  metric_key text not null, -- e.g. 'dau', 'life.tasks.created', 'story.generated'
  value numeric not null default 0,
  metadata jsonb,
  
  primary key (day, metric_key)
);

-- Index for range queries (e.g. last 30 days)
create index if not exists daily_metrics_by_range
  on nu.daily_metrics (metric_key, day desc);

-- Aggregation function (optional, but good for keeping logic close to data if needed)
-- generally handled by app code in this stack, but schema is ready.
