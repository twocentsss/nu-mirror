# Production Setup Guide: Postgres & Event Log

You have successfully migrated the Application Logic to an Event-Driven Architecture (Phase 1). The application is currently logging events to the console (stub).
To complete the transition to a production-ready state, you need to replace the Stub Client with a real Postgres implementation.

## 1. Database Setup (Supabase/Postgres)

Run the following SQL DDL to create the canonical event log and projection tables.

```sql
-- 1. The Append-Only Event Log
create table events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  body jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  
  -- Aggregation & Indexing
  agg_kind text not null, -- e.g. 'task', 'activity'
  agg_id text not null,   -- e.g. task_uuid
  seq bigint not null,    -- Sequence number for that aggregate root
  
  -- Auditing
  actor_id text,
  tenant_id text,
  created_at timestamptz not null default now(),
  
  -- Constraints
  unique(agg_kind, agg_id, seq)
);

-- Index for fast projection building
create index idx_events_global_chronological on events (created_at asc);
create index idx_events_by_aggregate on events (agg_kind, agg_id, seq asc);

-- 2. Materialized View for Tasks (Optional optimization for Phase 2)
create table projection_tasks (
  task_id text primary key,
  title text,
  status text,
  due_date timestamptz,
  -- ... other fields
  updated_at timestamptz
);
```

## 2. Environment Configuration

Add the following to your `.env` (or Vercel settings):

```bash
# Connection String (Transaction Mode recommended for serverless)
DATABASE_URL="postgres://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true"

# Feature Flags
ENABLE_EVENT_LOG_DB=true
```

## 3. Implement `postgresClient.ts`

Replace `src/lib/events/client.ts` with a real implementation using `postgres.js` or `pg`.

```typescript
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL!);

export const eventClient: EventClient = {
    async append(events) {
        // Use a transaction
        return await sql.begin(async sql => {
            for (const evt of events) {
                await sql`
                  insert into events (id, type, body, agg_kind, agg_id, seq, actor_id, created_at)
                  values (${evt.env.id}, ${evt.type}, ${evt.body}, ${evt.agg.kind}, ${evt.agg.id}, ${evt.seq}, ${evt.env.auth?.actorId}, ${new Date(evt.env.ts)})
                `;
            }
            return { ok: true };
        });
    },
    
    async getEvents(opts) {
        // Implement query logic
        return await sql`select * from events where type = ${opts.type} ...`;
    }
};
```
