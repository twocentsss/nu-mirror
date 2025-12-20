-- ====== Super Admin & System Keys Schema ======

-- 1. Super Admins
-- Simple list of emails that have super admin privileges.
create table if not exists nu.super_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

-- 2. System LLM Keys
-- Fallback keys provided by the platform (admin).
create table if not exists nu.system_llm_keys (
  key_id text primary key,      -- e.g. 'sys_key_...'
  provider text not null,       -- 'openai', 'gemini', 'openrouter'
  encrypted_key text not null,  -- Encrypted using same mechanism as user keys
  label text,
  is_active boolean default true,
  global_daily_limit_tokens int default 1000000, -- Safety cap for the key itself (optional)
  created_at timestamptz not null default now()
);

-- 3. System Key Usage Tracking
-- Tracks usage per user per day to enforce the 10k limit.
create table if not exists nu.system_key_usage (
  user_email text not null,     -- relying on email as identity for now
  day date not null,            -- YYYY-MM-DD
  tokens_used int not null default 0,
  
  primary key (user_email, day)
);

create index if not exists system_key_usage_by_day 
  on nu.system_key_usage (day);
