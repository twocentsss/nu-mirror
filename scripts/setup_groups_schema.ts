
import { getSqlClient } from "../src/lib/events/client";
import fs from "fs";
import path from "path";

const DB_URL = process.env.DATABASE_URL!;
if (!DB_URL) { console.error("No DATABASE_URL"); process.exit(1); }
const sql = getSqlClient(DB_URL);

async function run() {
    console.log("Applying Groups Schema...");
    const schemaPath = path.join(process.cwd(), "docs/scaling/schema_groups.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");

    try {
        await sql.unsafe(schemaSql);
        console.log("Groups Schema applied successfully.");
    } catch (e) {
        console.error("Migration Failed:", e);
    } finally {
        process.exit(0);
    }
}

run();
