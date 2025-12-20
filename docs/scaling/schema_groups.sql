
-- Groups Table
create table if not exists nu.groups (
    id text primary key,
    name text not null,
    handle text unique, -- Optional friendly handle (e.g. /groups/my-team)
    description text,
    
    owner_email text not null, -- Creator/Owner
    
    created_at timestamptz default now()
);

-- Group Members Table
create table if not exists nu.group_members (
    group_id text not null references nu.groups(id) on delete cascade,
    user_email text not null,
    role text not null default 'member', -- member, admin
    
    joined_at timestamptz default now(),
    
    primary key (group_id, user_email)
);

create index if not exists idx_group_members_user on nu.group_members(user_email);
