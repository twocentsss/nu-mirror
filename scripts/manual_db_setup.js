const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
    console.error("Missing DATABASE_URL in .env.local");
    process.exit(1);
}

const sql = postgres(dbUrl, { ssl: false });

async function runSetup() {
    console.log("Starting manual schema setup...");
    try {
        await sql.unsafe(`
            CREATE SCHEMA IF NOT EXISTS nu;
            
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

            -- Projection Tasks
            CREATE TABLE IF NOT EXISTS nu.projection_tasks (
              tenant_id text not null,
              task_id text not null,
              activity_id text,
              title text not null,
              status text not null,
              due_ts timestamptz,
              priority smallint,
              tags text[],
              step smallint default 1,
              updated_at timestamptz not null default now(),
              fields jsonb,
              primary key (tenant_id, task_id)
            );

            -- Today View
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

            -- Event Log
            CREATE TABLE IF NOT EXISTS nu.event_log (
              event_id text primary key,
              tenant_id text not null,
              actor_id text,
              type text not null,
              agg_kind text not null,
              agg_id text not null,
              seq bigint not null,
              ts timestamptz not null,
              ingested_at timestamptz not null default now(),
              body jsonb not null
            );
        `);
        console.log("✅ Database schema initialized successfully!");
    } catch (err) {
        console.error("❌ Schema setup failed:", err);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

runSetup();
