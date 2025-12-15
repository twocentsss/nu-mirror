import { google } from "googleapis";
import { mustGetEnv } from "@/lib/env";
import { getServiceAccountClient } from "@/lib/google/svcAuth";

export type SheetTab =
  | "Users"
  | "Episodes"
  | "Tasks"
  | "Worklogs"
  | "DecisionLogs"
  | "CaseBriefs";

const TABS: Record<SheetTab, string[]> = {
  Users: ["userId", "email", "name", "createdAt", "json"],
  Episodes: [
    "id",
    "userId",
    "created_at",
    "meaning_category",
    "action_class",
    "domain",
    "urgency",
    "mood",
    "raw_text",
    "json",
  ],
  Tasks: [
    "id",
    "userId",
    "episode_id",
    "parent_task_id",
    "title",
    "status",
    "dri",
    "decider",
    "due_date",
    "next_action_date",
    "created_at",
    "updated_at",
    "moscow",
    "eisenhower",
    "effort",
    "weight",
    "impact_score",
    "confidence_score",
    "tags",
    "json",
  ],
  Worklogs: [
    "id",
    "userId",
    "task_id",
    "timestamp_start",
    "duration_minutes",
    "status_after",
    "focus",
    "location",
    "notes",
    "tags",
    "json",
  ],
  DecisionLogs: [
    "id",
    "userId",
    "task_id",
    "episode_id",
    "timestamp",
    "dri",
    "decider",
    "question",
    "decision",
    "risk_level",
    "confidence_score",
    "communication_mode",
    "message_summary",
    "options",
    "json",
  ],
  CaseBriefs: [
    "id",
    "userId",
    "task_id",
    "episode_id",
    "timestamp",
    "dri",
    "decider",
    "proposal",
    "ask_type",
    "ask_by_when",
    "bluf",
    "json",
  ],
};

function sheetsClient() {
  const auth = getServiceAccountClient();
  return google.sheets({ version: "v4", auth });
}

export async function bootstrapSheet() {
  const spreadsheetId = mustGetEnv("SHEETS_ID");
  const sheets = sheetsClient();

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = new Set(
    (meta.data.sheets ?? [])
      .map((sheet) => sheet.properties?.title)
      .filter(Boolean) as string[],
  );

  const requests: any[] = [];
  (Object.keys(TABS) as SheetTab[]).forEach((tab) => {
    if (!existing.has(tab)) {
      requests.push({ addSheet: { properties: { title: tab } } });
    }
  });

  if (requests.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }

  for (const tab of Object.keys(TABS) as SheetTab[]) {
    const headers = TABS[tab];
    const range = `${tab}!A1:Z1`;
    const got = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const row1 = got.data.values?.[0] ?? [];

    if (row1.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    }
  }

  return { ok: true, spreadsheetId };
}

export async function appendObject(tab: SheetTab, userId: string, obj: any) {
  const spreadsheetId = mustGetEnv("SHEETS_ID");
  const sheets = sheetsClient();
  const headers = TABS[tab];

  const row = headers.map((header) => {
    if (header === "userId") return userId;
    if (header === "json") return JSON.stringify(obj);
    const value = obj?.[header];
    if (value === undefined || value === null) return "";
    if (Array.isArray(value) || typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tab}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });

  return { ok: true };
}

export async function listByUser(tab: SheetTab, userId: string) {
  const spreadsheetId = mustGetEnv("SHEETS_ID");
  const sheets = sheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!A1:Z`,
  });

  const rows = res.data.values ?? [];
  if (rows.length < 2) return [];

  const headers = rows[0];
  const data = rows.slice(1);

  const idxUserId = headers.indexOf("userId");
  const idxJson = headers.indexOf("json");

  return data
    .filter((r) => (r[idxUserId] ?? "") === userId)
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = r[i] ?? "";
      });
      if (idxJson >= 0 && obj.json) {
        try {
          obj._object = JSON.parse(obj.json);
        } catch {
          obj._object = null;
        }
      }
      return obj;
    });
}
