
-- Schema for Group Goals

create table if not exists nu.group_goals (
    id text primary key, -- ULID
    group_id text not null references nu.groups(id) on delete cascade,
    title text not null,
    is_completed boolean default false,
    created_at timestamptz default now()
);

create index if not exists goals_group_idx on nu.group_goals(group_id, created_at desc);
