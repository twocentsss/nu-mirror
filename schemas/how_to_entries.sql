CREATE TABLE IF NOT EXISTS how_to_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    prerequisite TEXT,
    use_case TEXT,
    share_link TEXT,
    ai_prompt TEXT,
    ai_response TEXT,
    screenshots TEXT[],
    use_cases JSONB,
    admin_steps JSONB,
    templates JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
