import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { buildFlowSummary } from "@/lib/flow/summary";
import { getAccountSpreadsheetId } from "@/lib/google/accountSpreadsheet";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accessToken = (session as any)?.accessToken;
  const refreshToken = (session as any)?.refreshToken;
  let spreadsheetId = process.env.SHEETS_ID;

  if (!spreadsheetId) {
    try {
      const account = await getAccountSpreadsheetId({
        accessToken,
        refreshToken,
        userEmail: session.user.email,
      });
      spreadsheetId = account.spreadsheetId;
    } catch (error) {
      console.error("Failed to look up spreadsheet for flow summary", error);
    }
  }

  if (!spreadsheetId) {
    return NextResponse.json({ error: "Spreadsheet not initialized" }, { status: 412 });
  }

  const summary = await buildFlowSummary({
    spreadsheetId,
    accessToken,
    refreshToken,
    userEmail: session.user.email,
  });
  return NextResponse.json({ ok: true, summary });
}
