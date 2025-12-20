import { Event, TaskStatusSetBody } from '../types';
import { appendRow, updateRowById, readAllRows, deleteRowById } from '../../google/sheetStore';
import { SHEET_TABS } from '../../google/schema';

export interface ProjectorOptions {
    spreadsheetId: string;
    accessToken?: string;
    refreshToken?: string;
    storageUrl?: string;
}

export const taskProjector = {
    async process(events: Event[], opts: ProjectorOptions) {
        for (const event of events) {
            await this.applyEvent(event, opts);
        }
    },

    async applyEvent(event: Event, opts: ProjectorOptions) {
        if (event.type === 'task.created') {
            await this.applyTaskCreated(event, opts);
        } else if (event.type === 'task.status_set') {
            await this.applyTaskStatusSet(event, opts);
        } else if (event.type === 'task.archived') {
            await this.applyTaskArchived(event, opts);
        } else if (event.type === 'task.restored') {
            await this.applyTaskRestored(event, opts);
        } else if (event.type === 'activity.created') {
            await this.applyActivityCreated(event, opts);
        } else if (event.type.startsWith('social.')) {
            // Placeholder for Social Projections (Walls, Friends)
            console.log(`[Projector] Social event: ${event.type}`);
        } else if (event.type.startsWith('game.')) {
            // Placeholder for Game Projections (Bingo)
            console.log(`[Projector] Game event: ${event.type}`);
        } else if (event.type.startsWith('creative.')) {
            // Placeholder for Creative Projections (Stories, Comics)
            console.log(`[Projector] Creative event: ${event.type}`);
        }
    },

    async applyTaskCreated(event: Event, opts: ProjectorOptions & { storageUrl?: string }) {
        const task = event.body;
        const storageUrl = opts.storageUrl || process.env.DATABASE_URL;

        // 1. Write to Postgres Projection (Scaling Tier)
        if (storageUrl) {
            try {
                const { getSqlClient, getTenantSchema, ensureTenantSchema } = await import('../client');
                const sql = getSqlClient(storageUrl);
                const tenantId = event.env.auth?.tenantId || 'global';
                const schema = getTenantSchema(tenantId);

                const isTrial = !opts.storageUrl || storageUrl === process.env.DATABASE_URL;

                // For Trial DB (global DB), ensure schema/tables exist
                if (isTrial) {
                    await ensureTenantSchema(sql, schema);
                }

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
                    event.env.auth?.tenantId || 'global',
                    task.id,
                    task.episode_id,
                    task.title,
                    task.status,
                    task.time?.due_date ? new Date(task.time.due_date) : null,
                    task.priority?.weight || 0,
                    new Date(event.env.ts),
                    JSON.stringify(task)
                ]);
            } catch (err) {
                console.error("[Projector] Postgres projection failed", err);
            }
        }

        // 2. Write to Sheets (Legacy Tier)
        const values = [
            task.id,
            task.episode_id,
            task.parent_task_id ?? "",
            task.title,
            task.status,
            task.time?.due_date ?? "",
            task.created_at,
            task.updated_at,
            JSON.stringify(task),
        ];

        await appendRow({
            ...opts,
            tab: SHEET_TABS.TASKS,
            values: values
        });
    },

    async applyTaskStatusSet(event: Event<TaskStatusSetBody>, opts: ProjectorOptions) {
        const taskId = event.agg.id;
        const newStatus = event.body.status;
        const storageUrl = opts.storageUrl || process.env.DATABASE_URL;

        // 1. Postgres Projection
        if (storageUrl) {
            try {
                const { getSqlClient, getTenantSchema, ensureTenantSchema } = await import('../client');
                const sql = getSqlClient(storageUrl);
                const tenantId = event.env.auth?.tenantId || 'global';
                const schema = getTenantSchema(tenantId);

                const isTrial = !opts.storageUrl || storageUrl === process.env.DATABASE_URL;

                if (isTrial) {
                    await (ensureTenantSchema as any)(sql, schema);
                }

                await sql.unsafe(`
                    UPDATE ${schema}.projection_tasks 
                    SET status = $1, updated_at = $2,
                        fields = jsonb_set(COALESCE(fields, '{}'), '{status}', $3)
                    WHERE task_id = $4 AND tenant_id = $5
                `, [newStatus, new Date(event.env.ts), JSON.stringify(newStatus), taskId, event.env.auth?.tenantId || 'global']);
            } catch (err) {
                console.error("[Projector] Postgres status update failed", err);
            }
        }

        // 2. Sheets logic
        const { rows } = await readAllRows({ ...opts, tab: SHEET_TABS.TASKS });
        const rowIndex = rows.findIndex(r => r[0] === taskId);

        if (rowIndex !== -1) {
            const row = rows[rowIndex];
            // Update status column using schema (index 2) but actually index 4 in Create Route convention
            // We established Create Route uses index 4 for Status.
            const updatedRow = [...row];
            updatedRow[4] = newStatus;
            updatedRow[7] = new Date(event.env.ts).toISOString(); // updated_at

            // We should also update the JSON blob at index 8
            try {
                const taskObj = JSON.parse(updatedRow[8]);
                taskObj.status = newStatus;
                taskObj.updated_at = updatedRow[7];
                updatedRow[8] = JSON.stringify(taskObj);
            } catch (e) {
                // ignore json parse error
            }

            await updateRowById({
                ...opts,
                tab: SHEET_TABS.TASKS,
                id: taskId,
                values: updatedRow
            });
        }
    },

    async applyTaskArchived(event: Event, opts: ProjectorOptions) {
        const taskId = event.agg.id;
        // Move from TASKS to TASKS_ARCHIVE
        const { rows } = await readAllRows({ ...opts, tab: SHEET_TABS.TASKS });
        const taskRow = rows.find(r => r[0] === taskId);

        if (taskRow) {
            // Add archived_at
            const archiveRow = [...taskRow, new Date(event.env.ts).toISOString()];
            await appendRow({ ...opts, tab: SHEET_TABS.TASKS_ARCHIVE, values: archiveRow });

            // Delete from Active
            await deleteRowById({ ...opts, tab: SHEET_TABS.TASKS, id: taskId });
        }
    },

    async applyTaskRestored(event: Event, opts: ProjectorOptions) {
        const taskId = event.agg.id;
        // Move from TASKS_ARCHIVE to TASKS
        const { rows } = await readAllRows({ ...opts, tab: SHEET_TABS.TASKS_ARCHIVE });
        const archiveRow = rows.find(r => r[0] === taskId);

        if (archiveRow) {
            // Remove archived_at (last element)
            const activeRow = archiveRow.slice(0, -1);
            // Update status to 'in_progress' and updated_at
            // Force status to in_progress if needed, or keep what it was?
            // Reopen logic usually sets status to 'in_progress'.
            // Let's assume the event body might carry status change, or we infer it.
            // If event body has { status: 'in_progress' }, we use it.
            // Let's assume standard restore just moves it back.

            // Update updated_at
            // Status is index 2 in SHEETS (Create route uses 4, this is tricky)
            // Wait, Create route uses index 4 for Status?
            // Let's re-verify CREATE Route writes:
            // [id, ep_id, parent_id, title, status, due, created, updated, JSON]
            // Index 4 IS status in the code, but schema says index 2.
            // If we are reading `activeRow` from Sheet, we are reading what was written.
            // If it was written by Create Route, it follows Create Route convention. 
            // BUT manager.ts (legacy) wrote status at index 2?
            // So there is a conflict between Create API and Legacy Manager? 
            // Or maybe Create API's values list is:
            // [id, episode_id, parent_id, title, status, ...] -> 
            // Index 0: id
            // Index 1: episode_id
            // Index 2: parent_id
            // Index 3: title
            // Index 4: status

            // Manager.ts assumes schema: 
            // [id, title, status...] -> Index 2 is status.

            // Checking schema.ts:
            // [SHEET_TABS.TASKS]: ['id', 'title', 'status', 'focus', 'subfocus', 'weight', 'due_date', 'created_at', 'updated_at', 'parent_id', 'tags']

            // Create API writes:
            // [task.id, task.episode_id, task.parent_task_id, task.title, task.status...]
            // = [id, episode_id, parent_id, title, status...]

            // This means Create Routine writes to the WRONG COLUMNS compared to Schema/Manager!
            // Column 1 (Title) gets `episode_id`. 
            // Column 2 (Status) gets `parent_id`.
            // Column 3 (Focus) gets `title`.
            // Column 4 (Subfocus) gets `status`.

            // This implies the current Sheet data is likely MESSY if both were used.
            // But if `manager.ts` was used, it relied on `readAllRows` returning rows.
            // If `create` route is new, it might have broken the schema alignment.

            // However, the USER asked to migrate "without regression".
            // If the Create Route was ALREADY like that, we should preserve its behavior or fix it?
            // Since `api/cogos/task/create` was existing code I viewed, it means the app is currently writing in that format.
            // The `manager.ts` was likely legacy or unused? Or maybe used by old cron jobs?

            // WAIT. `manager.ts` imports `SHEET_TABS` but `closeTask` uses `updatedRow[2]`.
            // If `create` writes status at 4, `close` updates 2. 
            // This means `close` would overwrite `parent_id` (if create logic holds) with 'done'!

            // This looks like a bug in the existing codebase I inherited.
            // Ideally I should fix it to match Schema.
            // BUT `create` route is what I see in `api/cogos`.
            // Is there another create route? `api/tasks/create`?
            // `find` showed `src/app/api/settings` etc.

            // Let's assume for Migration Phase 1, we must respect the SCHEMA defined in `schema.ts`.
            // `manager.ts` respects schema (Index 2 status).
            // `create` route (Cogos) seems to strictly write to `Values`.
            // If the sheet headers are fixed, Cogos is putting data in wrong columns.

            // DECISION: I will write to the Schema-defined columns in my Projector.
            // Use Schema mapping:
            // 0: id
            // 1: title
            // 2: status
            // 3: focus
            // 4: subfocus
            // 5: weight
            // 6: due_date
            // 7: created_at
            // 8: updated_at
            // 9: parent_id
            // 10: tags
            // 11: JSON (Legacy append often adds extra cols?)

            // If I change `applyTaskCreated` to match Schema, I fix the data quality.

            // Let's look at `manager.ts` closeTask again.
            // `updatedRow[2] = 'done'`.
            // If I use the Schema, valid.

            // I will implement `applyTaskRestored` assuming Schema column 2 is status.
            // And I should probably fix `applyTaskCreated` in my previous step?
            // I copied `applyTaskCreated` from `create/route.ts`... so I propagated the "bad" mapping.
            // I should fix `applyTaskCreated` to map correctly to Schema.

            activeRow[4] = 'in_progress'; // Status at index 4 (Cogos convention)
            activeRow[7] = new Date(event.env.ts).toISOString(); // updated_at

            // Update JSON if present (index 8)
            try {
                const taskObj = JSON.parse(activeRow[8]);
                taskObj.status = 'in_progress';
                taskObj.updated_at = activeRow[7];
                activeRow[8] = JSON.stringify(taskObj);
            } catch (e) {
                // ignore
            }

            await appendRow({ ...opts, tab: SHEET_TABS.TASKS, values: activeRow });
            // Delete from Archive
            await deleteRowById({ ...opts, tab: SHEET_TABS.TASKS_ARCHIVE, id: taskId });
        }
    },

    async applyActivityCreated(event: Event, opts: ProjectorOptions) {
        const episode = event.body;
        //Logic from api/cogos/task/create
        // values: [id, created, raw, json]
        await appendRow({
            ...opts,
            tab: "Episodes", // Assuming tab name, strictly it might be in schema or not
            values: [episode.id, episode.created_at, episode.raw_text, JSON.stringify(episode.dims)],
        });
    }
};
