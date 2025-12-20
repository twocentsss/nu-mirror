import postgres from 'postgres';
import { Event, EvtType } from './types';
const sqlPool = new Map<string, postgres.Sql>();

export function getTenantSchema(email: string): string {
    // Sanitize email: alphabets, numbers, and underscores only.
    const sanitized = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `t_${sanitized}`;
}

export async function ensureTenantSchema(sql: postgres.Sql, schema: string) {
    // In a production app, you might want to cache the fact that it's created
    // or run this only during initialization.
    await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS ${schema}`);

    // We also need to ensure the standard tables exist in this schema.
    // For trial simplicity, we inherit them or clone them.
    // Alternatively, we use the 'nu' schema tables with RLS.
    // User requested "dynamic sql schema" per user, so cloning tables to their schema is best.
    await sql.unsafe(`
        CREATE TABLE IF NOT EXISTS ${schema}.event_log (LIKE nu.event_log INCLUDING ALL);
        CREATE TABLE IF NOT EXISTS ${schema}.projection_tasks (LIKE nu.projection_tasks INCLUDING ALL);
        CREATE TABLE IF NOT EXISTS ${schema}.projection_today (LIKE nu.projection_today INCLUDING ALL);
        CREATE TABLE IF NOT EXISTS ${schema}.projector_cursor (LIKE nu.projector_cursor INCLUDING ALL);
    `);
}

export function getSqlClient(url: string): postgres.Sql {
    if (sqlPool.has(url)) return sqlPool.get(url)!;

    const sql = postgres(url, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false,
    });
    sqlPool.set(url, sql);
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
