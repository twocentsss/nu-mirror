
-- Schema for Group Messaging

create table if not exists nu.messages (
    id text primary key, -- ULID
    group_id text not null references nu.groups(id) on delete cascade,
    sender_email text not null,
    content text not null,
    created_at timestamptz default now()
);

create index if not exists messages_group_idx on nu.messages(group_id, created_at desc);

-- Grant permissions (if needed, usually handled by service role)
-- grant select, insert on nu.messages to authenticated;
