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

type ReadAllParams = {
  spreadsheetId: string;
  tab: string;
  accessToken?: string;
  refreshToken?: string;
};

export async function readAllRows(params: ReadAllParams) {
  const { sheets } = makeGoogleClient(params.accessToken, params.refreshToken);
  const res = await withBackoff(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: params.spreadsheetId,
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
  spreadsheetId: string;
  tab: string;
  id: string;
  values: RowValue[];
  accessToken?: string;
  refreshToken?: string;
};

export async function updateRowById(params: UpdateByIdParams) {
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
  await updateRowByRowNumber({
    spreadsheetId: params.spreadsheetId,
    tab: params.tab,
    rowNumber,
    values: params.values,
    accessToken: params.accessToken,
    refreshToken: params.refreshToken,
  });
}

type UpdateByRowParams = {
  spreadsheetId: string;
  tab: string;
  rowNumber: number;
  values: RowValue[];
  accessToken?: string;
  refreshToken?: string;
};

export async function updateRowByRowNumber(params: UpdateByRowParams) {
  const { sheets } = makeGoogleClient(params.accessToken, params.refreshToken);
  await withBackoff(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId: params.spreadsheetId,
      range: `${params.tab}!A${params.rowNumber}:I${params.rowNumber}`,
      valueInputOption: "RAW",
      requestBody: { values: [params.values] },
    }),
  );
}
