"use client";

import { useState, useEffect } from "react";
import { MirrorCard } from "@/ui/MirrorCard";
import { Database, Copy, Check, ExternalLink, Info } from "lucide-react";

const SQL_SCHEMA = `-- ====== Extensions (optional but useful) ======
create extension if not exists pgcrypto;

-- ====== Core schema ======
create schema if not exists nu;

-- ====== Event Log (append-only) ======
create table if not exists nu.event_log (
  event_id text primary key,
  tenant_id text not null,
  actor_id text,
  device_id text,
  trace_id text,
  span_id text,
  parent_span_id text,

  type text not null,
  agg_kind text not null,
  agg_id text not null,
  seq bigint not null,

  ts timestamptz not null,
  ingested_at timestamptz not null default now(),

  idempotency_key text,
  body jsonb not null,

  prev_hash text,
  hash text
);

-- Uniqueness + fast reads
create unique index if not exists event_log_uniq_agg_seq
  on nu.event_log (tenant_id, agg_kind, agg_id, seq);

create unique index if not exists event_log_uniq_idem
  on nu.event_log (tenant_id, actor_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists event_log_by_tenant_ts
  on nu.event_log (tenant_id, ts desc);

-- ====== Projection: tasks (current state) ======
create table if not exists nu.projection_tasks (
  tenant_id text not null,
  task_id text not null,
  activity_id text,
  title text not null,
  status text not null,
  due_ts timestamptz,
  priority smallint,
  tags text[],
  step smallint default 1 check (step >= 1 and step <= 10),
  updated_at timestamptz not null default now(),
  fields jsonb,

  primary key (tenant_id, task_id)
);

-- ====== Projector cursor ======
create table if not exists nu.projector_cursor (
  tenant_id text not null,
  projector text not null,
  last_ingested_at timestamptz not null default '1970-01-01',
  last_event_id text,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, projector)
);
`;

export default function PostgresSetupManager() {
    const [copied, setCopied] = useState(false);
    const [status, setStatus] = useState<{ isByo: boolean; daysLeft?: number } | null>(null);

    useEffect(() => {
        fetch("/api/me/storage/status")
            .then(res => res.json())
            .then(data => setStatus(data))
            .catch(() => { });
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(SQL_SCHEMA);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <MirrorCard className="overflow-hidden">
            {status && !status.isByo && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 p-3 flex items-center gap-3">
                    <Info size={16} className="text-amber-500" />
                    <div className="text-[12px] text-amber-600 dark:text-amber-400 font-medium">
                        Trial Mode: Data deleted in {status.daysLeft ?? '...'} days. Set up Postgres for persistence.
                    </div>
                </div>
            )}
            <div className="px-4 pt-4 pb-2 flex items-center gap-2 text-[13px] font-semibold text-[var(--text-secondary)]">
                <Database size={14} />
                Database
            </div>

            <div className="p-4 space-y-4">
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                    Own your data. Connect your private Postgres instance (Supabase, Neon, etc.)
                    to store your Event Log and Projections directly in your own cloud account.
                </p>

                <div className="space-y-4">
                    <Step
                        number={1}
                        title="Create a Database"
                        description="Create a free project on Supabase.com and get your connection string (use the pooled / port 6543 one)."
                    />

                    <div className="pl-7 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">SQL Schema</span>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--accent-color)] hover:opacity-80 transition"
                            >
                                {copied ? <Check size={12} /> : <Copy size={12} />}
                                {copied ? "Copied!" : "Copy SQL"}
                            </button>
                        </div>
                        <pre className="text-[10px] p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-[var(--glass-border)] max-h-32 overflow-y-auto font-mono text-[var(--text-secondary)]">
                            {SQL_SCHEMA}
                        </pre>
                    </div>

                    <Step
                        number={2}
                        title="Configure Discovery"
                        description="Open your private Google Sheet ('NuMirror Account - [Your Email]') and go to the 'Meta' tab."
                    />

                    <Step
                        number={3}
                        title="Set Connection String"
                        description="Add a new row: key='DATABASE_URL', value='your_postgres_url_here'. Nu will now prefer this storage."
                    />
                </div>

                <div className="pt-2">
                    <a
                        href="https://supabase.com"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-[12px] font-medium text-[var(--accent-color)] hover:underline"
                    >
                        Go to Supabase <ExternalLink size={12} />
                    </a>
                </div>
            </div>

            <div className="bg-[var(--accent-color)]/5 border-t border-[var(--glass-border)] p-4 flex gap-3">
                <div className="text-[var(--accent-color)] shrink-0 py-0.5">
                    <Info size={16} />
                </div>
                <p className="text-[11px] italic text-[var(--text-secondary)] leading-normal">
                    Note: Once configured, your task history will be stored in your own database.
                    Personal keys and local overrides take precedence over system defaults.
                </p>
            </div>
        </MirrorCard>
    );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
    return (
        <div className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--accent-color)] shrink-0">
                {number}
            </div>
            <div className="space-y-0.5">
                <div className="text-[13px] font-medium text-[var(--text-primary)]">{title}</div>
                <p className="text-[12px] text-[var(--text-secondary)] leading-snug">{description}</p>
            </div>
        </div>
    );
}
