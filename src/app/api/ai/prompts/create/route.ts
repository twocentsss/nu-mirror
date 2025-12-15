import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import {
  AccountSpreadsheetNotFoundError,
  getAccountSpreadsheetId,
} from "@/lib/google/accountSpreadsheet";
import { appendRow } from "@/lib/google/sheetStore";
import { newUlid } from "@/lib/id";

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
  const { title, template, provider, model, schedule, context_source } = body;

  if (!title || !template) {
    return NextResponse.json({ error: "Title and template are required" }, { status: 400 });
  }

  const id = newUlid();
  const now = new Date().toISOString();

  await appendRow({
    spreadsheetId,
    tab: "AI_PROMPTS",
    accessToken,
    refreshToken,
    values: [
      id,
      title,
      template,
      provider ?? "openrouter",
      model ?? "",
      schedule ?? "",
      context_source ?? "",
      now,
      now,
      JSON.stringify(body),
    ],
  });

  return NextResponse.json({ ok: true, id });
}
