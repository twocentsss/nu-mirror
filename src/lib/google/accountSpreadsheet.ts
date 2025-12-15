import type { drive_v3, sheets_v4 } from "googleapis";
import { makeGoogleClient } from "./googleClient";

const CACHE_TTL_MS = 10 * 60 * 1000;
const spreadsheetCache = new Map<string, { spreadsheetId: string; ts: number }>();

const TABS = ["Meta", "Episodes", "Tasks", "Worklogs", "DecisionLogs", "CaseBriefs"] as const;

const HEADERS: Record<(typeof TABS)[number], string[]> = {
  Meta: ["key", "value", "updated_at"],
  Episodes: ["id", "created_at", "raw_text", "dims_json"],
  Tasks: [
    "id",
    "episode_id",
    "parent_task_id",
    "title",
    "status",
    "due_date",
    "created_at",
    "updated_at",
    "json",
  ],
  Worklogs: ["id", "task_id", "timestamp_start", "duration_minutes", "status_after", "tags", "json"],
  DecisionLogs: [
    "id",
    "task_id",
    "episode_id",
    "timestamp",
    "question",
    "decision",
    "risk_level",
    "json",
  ],
  CaseBriefs: ["id", "task_id", "episode_id", "timestamp", "bluf", "ask_type", "by_when", "json"],
};

export class AccountSpreadsheetNotFoundError extends Error {
  constructor() {
    super("ACCOUNT_SPREADSHEET_NOT_FOUND");
    this.name = "AccountSpreadsheetNotFoundError";
  }
}

function cacheKey(email: string) {
  return email.trim().toLowerCase();
}

function setCache(userEmail: string, spreadsheetId: string) {
  spreadsheetCache.set(cacheKey(userEmail), { spreadsheetId, ts: Date.now() });
}

function getCachedSpreadsheetId(userEmail: string) {
  const cached = spreadsheetCache.get(cacheKey(userEmail));
  if (!cached) return null;
  if (Date.now() - cached.ts > CACHE_TTL_MS) {
    spreadsheetCache.delete(cacheKey(userEmail));
    return null;
  }
  return cached.spreadsheetId;
}

async function lookupSpreadsheetId(userEmail: string, drive: drive_v3.Drive) {
  const fileName = `NuMirror Account - ${userEmail}`;
  const list = await drive.files.list({
    q: [
      `name='${fileName.replace(/'/g, "\\'")}'`,
      "mimeType='application/vnd.google-apps.spreadsheet'",
      "trashed=false",
    ].join(" and "),
    fields: "files(id,name)",
    pageSize: 5,
  });
  return list.data.files?.[0]?.id ?? null;
}

async function ensureTabsAndHeaders(spreadsheetId: string, sheets: sheets_v4.Sheets) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = new Set((meta.data.sheets ?? []).map((sheet) => sheet.properties?.title));

  const addRequests = TABS.filter((tab) => !existing.has(tab)).map((tab) => ({
    addSheet: { properties: { title: tab } },
  }));

  if (addRequests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: addRequests },
    });
  }

  for (const tab of TABS) {
    const range = `${tab}!A1:Z1`;
    const current = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const row1 = current.data.values?.[0] ?? [];
    const needed = HEADERS[tab];
    const matches =
      row1.length >= needed.length && needed.every((header, idx) => String(row1[idx] ?? "").trim() === header);

    if (!matches) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tab}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [needed] },
      });
    }
  }
}

export async function initAccountSpreadsheet(params: {
  accessToken?: string;
  refreshToken?: string;
  userEmail: string;
}) {
  const { drive, sheets } = makeGoogleClient(params.accessToken, params.refreshToken);
  const fileName = `NuMirror Account - ${params.userEmail}`;

  let spreadsheetId = await lookupSpreadsheetId(params.userEmail, drive);

  if (!spreadsheetId) {
    const created = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: fileName },
        sheets: TABS.map((title) => ({ properties: { title } })),
      },
    });
    spreadsheetId = created.data.spreadsheetId!;
  }

  await ensureTabsAndHeaders(spreadsheetId, sheets);

  const now = new Date().toISOString();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Meta!A2`,
    valueInputOption: "RAW",
    requestBody: {
      values: [
        ["account_spreadsheet_id", spreadsheetId, now],
        ["schema_version", "cogos_v1", now],
      ],
    },
  });

  setCache(params.userEmail, spreadsheetId);
  return { spreadsheetId, fileName };
}

export async function getAccountSpreadsheetId(params: {
  accessToken?: string;
  refreshToken?: string;
  userEmail: string;
}) {
  const cached = getCachedSpreadsheetId(params.userEmail);
  if (cached) return { spreadsheetId: cached };

  const { drive } = makeGoogleClient(params.accessToken, params.refreshToken);
  const spreadsheetId = await lookupSpreadsheetId(params.userEmail, drive);
  if (!spreadsheetId) {
    throw new AccountSpreadsheetNotFoundError();
  }
  setCache(params.userEmail, spreadsheetId);
  return { spreadsheetId };
}
