import postgres from 'postgres';
import { Event, EvtType } from './types';
const sqlPool = new Map<string, postgres.Sql>();
const ensuredSchemas = new Set<string>();

export function getTenantSchema(email: string): string {
    // Sanitize email: alphabets, numbers, and underscores only.
    const sanitized = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `t_${sanitized}`;
}

export async function ensureTenantSchema(sql: postgres.Sql, schema: string) {
    if (ensuredSchemas.has(schema)) return;

    // In a production app, you might want to cache the fact that it's created
    // or run this only during initialization.
    await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS ${schema}`);

    // We also need to ensure the standard tables exist in this schema.
    // For trial simplicity, we inherit them or clone them.
    // Alternatively, we use the 'nu' schema tables with RLS.
    // User requested "dynamic sql schema" per user, so cloning tables to their schema is best.
    // ... existing ensureTenantSchema ...
    await sql.unsafe(`
        CREATE TABLE IF NOT EXISTS ${schema}.event_log (LIKE nu.event_log INCLUDING ALL);
        CREATE TABLE IF NOT EXISTS ${schema}.projection_tasks (LIKE nu.projection_tasks INCLUDING ALL);
        CREATE TABLE IF NOT EXISTS ${schema}.projection_today (LIKE nu.projection_today INCLUDING ALL);
        CREATE TABLE IF NOT EXISTS ${schema}.projector_cursor (LIKE nu.projector_cursor INCLUDING ALL);

        -- Goals & Projects
        CREATE TABLE IF NOT EXISTS ${schema}.goals (
          tenant_id text not null,
          goal_id text primary key,
          lf_id int not null,
          title text not null,
          status text not null,
          rationale text,
          due_date timestamptz,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );
        CREATE INDEX IF NOT EXISTS goals_by_lf_${schema} ON ${schema}.goals (tenant_id, lf_id);

        CREATE TABLE IF NOT EXISTS ${schema}.projects (
          tenant_id text not null,
          project_id text primary key,
          goal_id text not null references ${schema}.goals(goal_id),
          title text not null,
          status text not null,
          description text,
          due_date timestamptz,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );
        CREATE INDEX IF NOT EXISTS projects_by_goal_${schema} ON ${schema}.projects (tenant_id, goal_id);

        -- Migration: Ensure columns exist for existing tables
        ALTER TABLE ${schema}.goals ADD COLUMN IF NOT EXISTS due_date timestamptz;
        ALTER TABLE ${schema}.projects ADD COLUMN IF NOT EXISTS due_date timestamptz;
    `);

    ensuredSchemas.add(schema);
}

export async function ensureGlobalSchema(sql: postgres.Sql) {
    await sql.unsafe(`
        CREATE SCHEMA IF NOT EXISTS nu;
        
        -- Event Log
        CREATE TABLE IF NOT EXISTS nu.event_log (
          event_id text primary key,
          tenant_id text not null,
          actor_id text,
          device_id text,
          trace_id text,
          span_id text,
          parent_span_id text,
          type text not null,
          agg_kind text not null,
          agg_id text not null,
          seq bigint not null,
          ts timestamptz not null,
          ingested_at timestamptz not null default now(),
          idempotency_key text,
          body jsonb not null,
          prev_hash text,
          hash text
        );
        CREATE UNIQUE INDEX IF NOT EXISTS event_log_uniq_agg_seq ON nu.event_log (tenant_id, agg_kind, agg_id, seq);

        -- Projections
        CREATE TABLE IF NOT EXISTS nu.projection_tasks (
          tenant_id text not null,
          task_id text not null,
          activity_id text,
          title text not null,
          status text not null,
          due_ts timestamptz,
          priority smallint,
          tags text[],
          step smallint default 1 check (step >= 1 and step <= 10),
          updated_at timestamptz not null default now(),
          fields jsonb,
          primary key (tenant_id, task_id)
        );

        CREATE TABLE IF NOT EXISTS nu.projection_today (
          tenant_id text not null,
          day date not null,
          task_id text not null,
          status text not null,
          title text not null,
          due_ts timestamptz,
          priority smallint,
          tags text[],
          updated_at timestamptz not null default now(),
          primary key (tenant_id, day, task_id)
        );

        CREATE TABLE IF NOT EXISTS nu.projector_cursor (
           tenant_id text not null,
           projector text not null, 
           last_ingested_at timestamptz not null default '1970-01-01',
           last_event_id text,
           updated_at timestamptz not null default now(),
           primary key (tenant_id, projector)
        );

        -- Goals & Projects
        CREATE TABLE IF NOT EXISTS nu.goals (
          tenant_id text not null,
          goal_id text primary key,
          lf_id int not null,
          title text not null,
          status text not null,
          rationale text,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );
        CREATE INDEX IF NOT EXISTS goals_by_lf ON nu.goals (tenant_id, lf_id);

        CREATE TABLE IF NOT EXISTS nu.projects (
          tenant_id text not null,
          project_id text primary key,
          goal_id text not null references nu.goals(goal_id),
          title text not null,
          status text not null,
          description text,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );
        CREATE INDEX IF NOT EXISTS projects_by_goal ON nu.projects (tenant_id, goal_id);

        -- Daily Metrics
        CREATE TABLE IF NOT EXISTS nu.daily_metrics (
          day date not null,
          metric_key text not null,
          value numeric not null default 0,
          metadata jsonb,
          updated_at timestamptz not null default now(),
          primary key (day, metric_key)
        );
        CREATE INDEX IF NOT EXISTS daily_metrics_by_range ON nu.daily_metrics (day, metric_key);

        -- User LLM Keys
        CREATE TABLE IF NOT EXISTS nu.user_llm_keys (
          key_id text primary key,
          user_email text not null,
          provider text not null,
          label text,
          encrypted_key text not null,
          is_active boolean not null default true,
          is_preferred boolean not null default false,
          daily_limit_tokens bigint default 0,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );
        CREATE INDEX IF NOT EXISTS user_llm_keys_by_user ON nu.user_llm_keys (user_email, provider);

        -- System LLM Keys (Uber Pool)
        CREATE TABLE IF NOT EXISTS nu.system_llm_keys (
          key_id text primary key,
          provider text not null,
          label text,
          encrypted_key text not null,
          is_active boolean not null default true,
          global_daily_limit_tokens bigint default 0,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );

        CREATE TABLE IF NOT EXISTS nu.system_key_usage (
          user_email text not null,
          day date not null,
          tokens_used bigint default 0,
          updated_at timestamptz not null default now(),
          primary key (user_email, day)
        );

        -- Super Admins
        CREATE TABLE IF NOT EXISTS nu.super_admins (
          email text primary key,
          created_at timestamptz not null default now()
        );
    `);
}

export function getSqlClient(url?: string): postgres.Sql {
    const connectionUrl = url || process.env.DATABASE_URL;
    if (!connectionUrl) {
        throw new Error("DATABASE_URL is not defined");
    }
    if (sqlPool.has(connectionUrl)) return sqlPool.get(connectionUrl)!;

    const sql = postgres(connectionUrl, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false,
    });
    sqlPool.set(connectionUrl, sql);
    return sql;
}

export interface GetEventsOptions {
    type?: EvtType;
    after?: string; // ISO date
    before?: string; // ISO date
    limit?: number;
    cursor?: string;
    tenantId?: string;
    aggId?: string;
    storageUrl?: string; // BYODB Support
}

export interface AppendOptions {
    storageUrl?: string; // BYODB Support
}

export interface EventClient {
    append(events: Event[], opts?: AppendOptions): Promise<{ ok: boolean; stats?: any }>;
    getEvents<T = any>(opts: GetEventsOptions): Promise<Event<T>[]>;
}

export const eventClient: EventClient = {
    append: async (events: Event[], opts?: AppendOptions) => {
        const url = opts?.storageUrl || process.env.DATABASE_URL;
        const isTrial = !opts?.storageUrl || url === process.env.DATABASE_URL;

        if (!url) {
            console.warn('[EventClient] No Database URL, logging to console.');
            console.log(JSON.stringify(events, null, 2));
            return { ok: true };
        }

        const sql = getSqlClient(url);

        // If trial, we isolation via Schema
        let schema = 'nu';
        if (isTrial && events[0]?.env.auth?.tenantId) {
            schema = getTenantSchema(events[0].env.auth.tenantId);
            await ensureTenantSchema(sql, schema);
        }

        try {
            return await sql.begin(async sql => {
                for (const evt of events) {
                    await sql.unsafe(`
                        insert into ${schema}.event_log (
                            event_id, 
                            tenant_id, 
                            actor_id, 
                            type, 
                            agg_kind, 
                            agg_id, 
                            seq, 
                            ts, 
                            body,
                            trace_id,
                            span_id
                        )
                        values (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
                        )
                        on conflict (tenant_id, agg_kind, agg_id, seq) do nothing
                    `, [
                        evt.env.id,
                        evt.env.auth?.tenantId || 'global',
                        evt.env.auth?.actorId || null,
                        evt.type,
                        evt.agg.kind,
                        evt.agg.id,
                        evt.seq,
                        new Date(evt.env.ts),
                        sql.json(evt.body),
                        evt.env.trace?.traceId || null,
                        evt.env.trace?.spanId || null
                    ]);
                }
                return { ok: true };
            });
        } catch (err) {
            console.error('[EventClient] Insert Failed:', err);
            throw err;
        }
    },

    getEvents: async (opts) => {
        const url = opts.storageUrl || process.env.DATABASE_URL;
        const isTrial = !opts.storageUrl || url === process.env.DATABASE_URL;
        if (!url) {
            console.warn('[EventClient] No storage URL for results.');
            return [];
        }

        const sql = getSqlClient(url);
        const limit = opts.limit || 100;

        let schema = 'nu';
        if (isTrial && opts.tenantId) {
            schema = getTenantSchema(opts.tenantId);
            await ensureTenantSchema(sql, schema);
        }

        const results = await sql.unsafe(`
            select 
                event_id, type, agg_kind, agg_id, seq, ts, body, tenant_id, actor_id 
            from ${schema}.event_log
            where true
            ${opts.type ? 'and type = $1' : ''}
            ${opts.tenantId ? 'and tenant_id = ' + (opts.type ? '$2' : '$1') : ''}
            ${opts.aggId ? 'and agg_id = ' + (opts.type && opts.tenantId ? '$3' : (opts.type || opts.tenantId ? '$2' : '$1')) : ''}
            order by ts asc
            limit ${limit}
        `, [
            ...(opts.type ? [opts.type] : []),
            ...(opts.tenantId ? [opts.tenantId] : []),
            ...(opts.aggId ? [opts.aggId] : [])
        ].filter(Boolean));

        // Map back to Event<T> structure
        return results.map(row => ({
            env: {
                id: row.event_id,
                ts: new Date(row.ts).getTime(),
                src: 'db',
                ver: '1',
                kind: 'evt',
                trace: { traceId: '', spanId: '' },
                auth: { tenantId: row.tenant_id, actorId: row.actor_id }
            },
            type: row.type as EvtType,
            agg: { kind: row.agg_kind, id: row.agg_id },
            seq: Number(row.seq),
            body: row.body
        }));
    }
};
