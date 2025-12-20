import postgres from "postgres";

/**
 * The Nanny is responsible for cleaning up the Global Database.
 * In the BYODB model, the global database (process.env.DATABASE_URL) 
 * is a "Shared Trial Buffer" where data is stored for only 1 week.
 */
export async function runNannyCleanup() {
    const globalUrl = process.env.DATABASE_URL;
    if (!globalUrl) {
        console.warn("[Nanny] No Global DATABASE_URL found. Skipping cleanup.");
        return;
    }

    const sql = postgres(globalUrl);

    try {
        console.log("[Nanny] Starting cleanup of Global Database...");

        // 1. Get List of Tenant Schemas
        const schemas = await sql`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 't_%'
        `;

        for (const { schema_name } of schemas) {
            // Check if the trial has expired (using TRIAL_START_AT logic or just schema age)
            // For now, we drop everything based on the event log latest activity
            // or we could check the Meta sheet. 
            // Better: Drop any schema created more than 7 days ago.
            // Postgres information_schema doesn't have creation date, so we use the event_log proxy.

            const lastEvent = await sql.unsafe(`
                SELECT max(ts) as last_ts FROM ${schema_name}.event_log
            `).catch(() => []);

            if (lastEvent.length > 0 && lastEvent[0].last_ts) {
                const age = Date.now() - new Date(lastEvent[0].last_ts).getTime();
                if (age > 7 * 24 * 60 * 60 * 1000) {
                    console.log(`[Nanny] Dropping expired schema: ${schema_name}`);
                    await sql.unsafe(`DROP SCHEMA ${schema_name} CASCADE`);
                }
            } else {
                // If no events, check if it was created a long time ago (optional)
                // or just leave it for now.
            }
        }

        console.log(`[Nanny] Cleanup complete.`);
    } catch (err) {
        console.error("[Nanny] Cleanup failed:", err);
    } finally {
        await sql.end();
    }
}
