import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import {
  AccountSpreadsheetNotFoundError,
  getAccountSpreadsheetId,
} from "@/lib/google/accountSpreadsheet";
import { readAllRows, updateRowById } from "@/lib/google/sheetStore";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string | undefined;
  const refreshToken = (session as any).refreshToken as string | undefined;
  if (!accessToken && !refreshToken) {
    return NextResponse.json(
      { error: "Missing Google OAuth tokens. Sign out/in again." },
      { status: 401 },
    );
  }

  let spreadsheetId: string;
  try {
    ({ spreadsheetId } = await getAccountSpreadsheetId({
      accessToken,
      refreshToken,
      userEmail: session.user.email,
    }));
  } catch (error) {
    if (error instanceof AccountSpreadsheetNotFoundError) {
      return NextResponse.json(
        { error: "Account spreadsheet not initialized. Run /api/google/account/init first." },
        { status: 412 },
      );
    }
    throw error;
  }

  const body = await req.json();
  const { id, title, template, provider, model, schedule, context_source } = body;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const { rows } = await readAllRows({
    spreadsheetId,
    tab: "AI_PROMPTS",
    accessToken,
    refreshToken,
  });

  const row = rows.find((r) => String(r?.[0] ?? "") === id);
  if (!row) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const updatedRow = [...row];

  if (title !== undefined) updatedRow[1] = title;
  if (template !== undefined) updatedRow[2] = template;
  if (provider !== undefined) updatedRow[3] = provider;
  if (model !== undefined) updatedRow[4] = model;
  if (schedule !== undefined) updatedRow[5] = schedule;
  if (context_source !== undefined) updatedRow[6] = context_source;
  updatedRow[8] = now;
  updatedRow[9] = JSON.stringify({ ...JSON.parse(String(row[9] ?? "{}")), ...body });

  await updateRowById({
    spreadsheetId,
    tab: "AI_PROMPTS",
    id,
    accessToken,
    refreshToken,
    values: updatedRow,
  });

  return NextResponse.json({ ok: true });
}
