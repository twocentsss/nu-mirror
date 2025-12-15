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
      const ms = 1000 * 2 ** i;
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
  }
  throw lastError;
}

export async function appendRow(params: {
  spreadsheetId?: string;
  tab: string;
  values: RowValue[];
  accessToken?: string;
  refreshToken?: string;
}) {
  const spreadsheetId = params.spreadsheetId ?? process.env.SHEETS_ID;
  if (!spreadsheetId) throw new Error("Missing SHEETS_ID or spreadsheetId");

  const { sheets } = makeGoogleClient(params.accessToken, params.refreshToken);
  await withBackoff(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${params.tab}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [params.values] },
    }),
  );
}

type ReadAllParams = {
  spreadsheetId?: string;
  tab: string;
  accessToken?: string;
  refreshToken?: string;
};

export async function readAllRows(params: ReadAllParams) {
  const spreadsheetId = params.spreadsheetId ?? process.env.SHEETS_ID;
  if (!spreadsheetId) throw new Error("Missing SHEETS_ID or spreadsheetId");

  const { sheets } = makeGoogleClient(params.accessToken, params.refreshToken);
  const res = await withBackoff(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${params.tab}!A:Z`,
    }),
  );
  const rows = res.data.values ?? [];
  if (rows.length === 0) {
    return { header: [], rows: [], startRow: 2 };
  }
  const headerRow = rows[0] ?? [];
  const data = rows.slice(1);
  return { header: headerRow, rows: data, startRow: 2 };
}

type UpdateByIdParams = {
  spreadsheetId?: string;
  tab: string;
  id: string;
  values: RowValue[];
  accessToken?: string;
  refreshToken?: string;
};

export async function updateRowById(params: UpdateByIdParams) {
  const spreadsheetId = params.spreadsheetId ?? process.env.SHEETS_ID;
  if (!spreadsheetId) throw new Error("Missing SHEETS_ID or spreadsheetId");

  const { sheets } = makeGoogleClient(params.accessToken, params.refreshToken);
  const res = await withBackoff(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${params.tab}!A:Z`,
    }),
  );

  const all = res.data.values ?? [];
  const data = all.slice(1);
  const idx = data.findIndex((row) => String(row?.[0] ?? "") === params.id);
  if (idx === -1) throw new Error(`Row not found for id=${params.id}`);

  const rowNumber = idx + 2;
  await updateRowByRowNumber({
    spreadsheetId,
    tab: params.tab,
    rowNumber,
    values: params.values,
    accessToken: params.accessToken,
    refreshToken: params.refreshToken,
  });
}

async function getSheetId(sheets: any, spreadsheetId: string, tabName: string): Promise<number> {
  const res = await withBackoff(() => sheets.spreadsheets.get({ spreadsheetId })) as any;
  const sheet = res.data.sheets?.find((s: any) => s.properties?.title === tabName);
  if (sheet?.properties?.sheetId === undefined) throw new Error(`Sheet not found: ${tabName}`);
  return sheet.properties.sheetId;
}

export async function deleteRowById(params: {
  spreadsheetId?: string;
  tab: string;
  id: string;
  accessToken?: string;
  refreshToken?: string;
}) {
  const spreadsheetId = params.spreadsheetId ?? process.env.SHEETS_ID;
  if (!spreadsheetId) throw new Error("Missing SHEETS_ID or spreadsheetId");

  const { sheets } = makeGoogleClient(params.accessToken, params.refreshToken);

  // 1. Find the row index
  const res = await withBackoff(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${params.tab}!A:A`, // Only need ID column
    }),
  );

  const rows = res.data.values ?? [];
  const idx = rows.findIndex((row: any) => String(row?.[0] ?? "") === params.id);
  if (idx === -1) throw new Error(`Row not found for id=${params.id}`);

  // 2. Get sheetId
  const sheetId = await getSheetId(sheets, spreadsheetId, params.tab);

  // 3. Delete row
  await withBackoff(() =>
    sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: idx,
                endIndex: idx + 1,
              },
            },
          },
        ],
      },
    }),
  );
}

type UpdateByRowParams = {
  spreadsheetId?: string;
  tab: string;
  rowNumber: number;
  values: RowValue[];
  accessToken?: string;
  refreshToken?: string;
};

export async function updateRowByRowNumber(params: UpdateByRowParams) {
  const spreadsheetId = params.spreadsheetId ?? process.env.SHEETS_ID;
  if (!spreadsheetId) throw new Error("Missing SHEETS_ID or spreadsheetId");

  const { sheets } = makeGoogleClient(params.accessToken, params.refreshToken);
  await withBackoff(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${params.tab}!A${params.rowNumber}:Z${params.rowNumber}`,
      valueInputOption: "RAW",
      requestBody: { values: [params.values] },
    }),
  );
}
