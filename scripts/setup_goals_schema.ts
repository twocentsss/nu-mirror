
import { getSqlClient } from "../src/lib/events/client";

const DB_URL = process.env.DATABASE_URL!;

async function run() {
    if (!DB_URL) {
        console.error("No DATABASE_URL");
        process.exit(1);
    }
    const sql = getSqlClient(DB_URL);

    console.log("Applying Goals Schema...");

    await sql`
        create table if not exists nu.group_goals (
            id text primary key,
            group_id text not null references nu.groups(id) on delete cascade,
            title text not null,
            is_completed boolean default false,
            created_at timestamptz default now()
        );
    `;

    await sql`
        create index if not exists goals_group_idx on nu.group_goals(group_id, created_at desc);
    `;

    console.log("Schema applied.");
    process.exit(0);
}

run();
