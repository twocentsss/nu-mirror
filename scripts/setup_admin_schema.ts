
import { getSqlClient } from "../src/lib/events/client";
import fs from "fs";
import path from "path";

// Load .env.local if needed (usually next dev handles this, but standalone script might need it)
// We assume checking process.env.DATABASE_URL
const DB_URL = process.env.DATABASE_URL;

async function run() {
    if (!DB_URL) {
        console.error("No DATABASE_URL found.");
        process.exit(1);
    }

    const sql = getSqlClient(DB_URL);
    console.log("Connected to DB...");

    const schemaPath = path.join(process.cwd(), "docs/scaling/schema_admin.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");

    console.log("Applying schema...");
    try {
        await sql.unsafe(schemaSql);
        console.log("Schema applied successfully.");
    } catch (e) {
        console.error("Schema application failed:", e);
    } finally {
        process.exit(0);
    }
}

run();
