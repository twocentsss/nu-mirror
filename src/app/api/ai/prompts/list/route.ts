import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import {
  AccountSpreadsheetNotFoundError,
  getAccountSpreadsheetId,
} from "@/lib/google/accountSpreadsheet";
import { readAllRows } from "@/lib/google/sheetStore";

export async function GET(req: Request) {
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

  const { rows } = await readAllRows({
    spreadsheetId,
    tab: "AI_PROMPTS",
    accessToken,
    refreshToken,
  });

  const prompts = rows.map((r) => ({
    id: String(r?.[0] ?? ""),
    title: String(r?.[1] ?? ""),
    template: String(r?.[2] ?? ""),
    provider: String(r?.[3] ?? ""),
    model: String(r?.[4] ?? ""),
    schedule: String(r?.[5] ?? ""),
    context_source: String(r?.[6] ?? ""),
    created_at: String(r?.[7] ?? ""),
    updated_at: String(r?.[8] ?? ""),
    json: String(r?.[9] ?? "{}"),
  })).filter(p => p.id);

  return NextResponse.json({ prompts });
}
