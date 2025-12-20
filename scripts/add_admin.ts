
import { getSqlClient } from "../src/lib/events/client";

const DB_URL = process.env.DATABASE_URL!;
if (!DB_URL) { console.error("No DATABASE_URL"); process.exit(1); }
const sql = getSqlClient(DB_URL);

async function run() {
    const email = process.argv[2];
    if (!email) {
        console.error("Usage: npx tsx scripts/add_admin.ts <email>");
        process.exit(1);
    }

    console.log(`Adding ${email} as Super Admin...`);
    try {
        await sql`
            insert into nu.super_admins (email)
            values (${email})
            on conflict (email) do nothing
        `;
        console.log("Success! User is now a Super Admin.");
        console.log("Please refresh the Admin Dashboard and try adding keys again.");
    } catch (e) {
        console.error("Failed to add admin:", e);
    } finally {
        process.exit(0);
    }
}

run();
