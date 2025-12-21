"use server";

import { getSqlClient } from "@/lib/events/client";

const ensureTableQuery = `
CREATE TABLE IF NOT EXISTS how_to_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  prerequisite TEXT,
  use_case TEXT,
  share_link TEXT,
  ai_prompt TEXT,
  ai_response TEXT,
  screenshots TEXT[],
  screenshots_meta JSONB,
  use_cases JSONB,
  admin_steps JSONB,
  templates JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

type UseCaseMap = { scenario: string; response: string }[];
type AdminStep = { label: string; detail: string }[];
type TemplateCards = { label: string; prompt: string }[];
type ScreenshotMeta = { name: string; subtitle?: string };

export type HowToEntry = {
  id: string;
  title: string;
  prerequisite: string | null;
  use_case: string | null;
  share_link: string | null;
  ai_prompt: string | null;
  ai_response: string | null;
  screenshots: string[] | null;
  screenshots_meta: ScreenshotMeta[] | null;
  use_cases: UseCaseMap | null;
  admin_steps: AdminStep | null;
  templates: TemplateCards | null;
  created_at: string;
};

async function ensureTable() {
  const sql = getSqlClient();
  await sql.unsafe(ensureTableQuery);
  await sql.unsafe(`ALTER TABLE how_to_entries ADD COLUMN IF NOT EXISTS screenshots_meta JSONB;`);
  return sql;
}

export type HowToPayload = Omit<HowToEntry, "id" | "created_at">;

export async function upsertHowToEntry(payload: HowToPayload) {
  const sql = await ensureTable();
  await sql`
    INSERT INTO how_to_entries (
      title, prerequisite, use_case, share_link, ai_prompt, ai_response,
      screenshots, screenshots_meta, use_cases, admin_steps, templates
    ) VALUES (
      ${payload.title}, 
      ${payload.prerequisite}, 
      ${payload.use_case}, 
      ${payload.share_link},
      ${payload.ai_prompt}, 
      ${payload.ai_response}, 
      ${payload.screenshots ? sql.array(payload.screenshots) : null},
      ${payload.screenshots_meta ? sql.json(payload.screenshots_meta) : null},
      ${payload.use_cases ? sql.json(payload.use_cases) : null}, 
      ${payload.admin_steps ? sql.json(payload.admin_steps) : null}, 
      ${payload.templates ? sql.json(payload.templates) : null}
    )
  `;
}

export async function loadLatestHowToEntry() {
  const sql = await ensureTable();
  const result = await sql`
    SELECT *
    FROM how_to_entries
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (!result.length) return null;
  const row = result[0];
  return {
    id: row.id,
    title: row.title,
    prerequisite: row.prerequisite,
    use_case: row.use_case,
    share_link: row.share_link,
    ai_prompt: row.ai_prompt,
    ai_response: row.ai_response,
    screenshots: row.screenshots ?? [],
    screenshots_meta: row.screenshots_meta ?? [],
    use_cases: row.use_cases ?? [],
    admin_steps: row.admin_steps ?? [],
    templates: row.templates ?? [],
    created_at: row.created_at,
  } as HowToEntry;
}

export async function deleteAllHowToEntries() {
  const sql = await ensureTable();
  await sql`DELETE FROM how_to_entries`;
}
