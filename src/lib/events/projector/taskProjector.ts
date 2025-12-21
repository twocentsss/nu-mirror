import { Event, TaskStatusSetBody } from '../types';

export interface ProjectorOptions {
  storageUrl?: string;
}

const getStorageClient = async (storageUrl?: string) => {
  const url = storageUrl || process.env.DATABASE_URL;
  if (!url) return null;
  const { getSqlClient, getTenantSchema, ensureTenantSchema } = await import('../client');
  const sql = getSqlClient(url);
  return { sql, getTenantSchema, ensureTenantSchema };
};

export const taskProjector = {
  async process(events: Event[], opts: ProjectorOptions = {}) {
    for (const event of events) {
      await this.applyEvent(event, opts);
    }
  },

  async applyEvent(event: Event, opts: ProjectorOptions) {
    if (event.type === 'task.created') {
      await this.applyTaskCreated(event, opts);
    } else if (event.type === 'task.status_set') {
      await this.applyTaskStatusSet(event as Event<TaskStatusSetBody>, opts);
    } else if (event.type === 'task.archived') {
      await this.applyTaskArchived(event, opts);
    } else if (event.type === 'task.restored') {
      await this.applyTaskRestored(event, opts);
    } else if (event.type.startsWith('social.')) {
      console.log(`[Projector] Social event: ${event.type}`);
    } else if (event.type.startsWith('game.')) {
      console.log(`[Projector] Game event: ${event.type}`);
    } else if (event.type.startsWith('creative.')) {
      console.log(`[Projector] Creative event: ${event.type}`);
    }
  },

  async applyTaskCreated(event: Event, opts: ProjectorOptions) {
    const storageClient = await getStorageClient(opts.storageUrl);
    if (!storageClient) return;

    const { sql, getTenantSchema, ensureTenantSchema } = storageClient;
    const tenantId = event.env.auth?.tenantId || 'global';
    const schema = getTenantSchema(tenantId);
    await ensureTenantSchema(sql, schema);

    const task = event.body;
    await sql.unsafe(`
      INSERT INTO ${schema}.projection_tasks (
        tenant_id, task_id, activity_id, title, status, due_ts, priority, updated_at, fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (tenant_id, task_id) DO UPDATE SET
        title = EXCLUDED.title,
        status = EXCLUDED.status,
        due_ts = EXCLUDED.due_ts,
        updated_at = EXCLUDED.updated_at,
        fields = EXCLUDED.fields
    `, [
      tenantId,
      task.id,
      task.episode_id,
      task.title,
      task.status,
      task.time?.due_date ? new Date(task.time.due_date) : null,
      task.priority?.weight || 0,
      new Date(event.env.ts),
      JSON.stringify(task),
    ]);
  },

  async applyTaskStatusSet(event: Event<TaskStatusSetBody>, opts: ProjectorOptions) {
    const storageClient = await getStorageClient(opts.storageUrl);
    if (!storageClient) return;

    const { sql, getTenantSchema, ensureTenantSchema } = storageClient;
    const tenantId = event.env.auth?.tenantId || 'global';
    const schema = getTenantSchema(tenantId);
    await ensureTenantSchema(sql, schema);

    const taskId = event.agg.id;
    const newStatus = event.body.status;
    await sql.unsafe(`
      UPDATE ${schema}.projection_tasks
      SET status = $1,
          updated_at = $2,
          fields = jsonb_set(COALESCE(fields, '{}'), '{status}', $3, true)
      WHERE task_id = $4 AND tenant_id = $5
    `, [
      newStatus,
      new Date(event.env.ts),
      JSON.stringify(newStatus),
      taskId,
      tenantId,
    ]);
  },

  async applyTaskArchived(event: Event, opts: ProjectorOptions) {
    const storageClient = await getStorageClient(opts.storageUrl);
    if (!storageClient) return;

    const { sql, getTenantSchema, ensureTenantSchema } = storageClient;
    const tenantId = event.env.auth?.tenantId || 'global';
    const schema = getTenantSchema(tenantId);
    await ensureTenantSchema(sql, schema);

    await sql.unsafe(`
      DELETE FROM ${schema}.projection_tasks
      WHERE task_id = $1 AND tenant_id = $2
    `, [event.agg.id, tenantId]);
  },

  async applyTaskRestored(event: Event, opts: ProjectorOptions) {
    console.warn("[Projector] task.restored received; no Postgres action defined.");
  },
};
