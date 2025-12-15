import { makeGoogleClient } from "./googleClient";

type RowValue = string | number | boolean | null | undefined;

function isQuotaError(error: unknown) {
  const code = (error as { code?: number })?.code;
  return code === 429;
}

async function withBackoff<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isQuotaError(error)) throw error;
      const ms = 250 * 2 ** i;
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
  }
  throw lastError;
}

export async function appendRow(params: {
  spreadsheetId: string;
  tab: string;
  values: RowValue[];
  accessToken?: string;
  refreshToken?: string;
}) {
  const { sheets } = makeGoogleClient(params.accessToken, params.refreshToken);
  await withBackoff(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId: params.spreadsheetId,
      range: `${params.tab}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [params.values] },
    }),
  );
}

export async function readAllRows(params: {
  spreadsheetId: string;
  tab: string;
  accessToken?: string;
  refreshToken?: string;
}) {
  const { sheets } = makeGoogleClient(params.accessToken, params.refreshToken);
  const res = await withBackoff(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: params.spreadsheetId,
      range: `${params.tab}!A:Z`,
    }),
  );
  const rows = res.data.values ?? [];
  const header = rows[0] ?? [];
  const data = rows.slice(1);
  return { header, rows: data };
}

export async function updateRowById(params: {
  spreadsheetId: string;
  tab: string;
  id: string;
  values: RowValue[];
  accessToken?: string;
  refreshToken?: string;
}) {
  const { sheets } = makeGoogleClient(params.accessToken, params.refreshToken);
  const res = await withBackoff(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: params.spreadsheetId,
      range: `${params.tab}!A:Z`,
    }),
  );

  const all = res.data.values ?? [];
  const data = all.slice(1);
  const idx = data.findIndex((row) => String(row?.[0] ?? "") === params.id);
  if (idx === -1) throw new Error(`Row not found for id=${params.id}`);

  const rowNumber = idx + 2;
  await withBackoff(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId: params.spreadsheetId,
      range: `${params.tab}!A${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: { values: [params.values] },
    }),
  );
}
