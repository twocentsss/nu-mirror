
import { loadEnvConfig } from "@next/env";
import { getSqlClient } from "../src/lib/events/client";
import fs from "fs";
import path from "path";

// Load env vars
loadEnvConfig(process.cwd());

async function run() {
    console.log("Setting up Telemetry schema...");
    const sql = getSqlClient();

    try {
        const schemaPath = path.join(process.cwd(), "docs/scaling/schema_telemetry.sql");
        const schemaSql = fs.readFileSync(schemaPath, "utf-8");

        // Split by semicolons simple approach, or just run whole block if driver supports it.
        // Postgres.js file usually supports executing multiple statements.
        await sql.file(schemaPath);

        console.log("Telemetry schema applied successfully.");
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

run();
