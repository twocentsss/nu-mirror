import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { getAccountSpreadsheetId } from "@/lib/google/accountSpreadsheet";
import { resolveStorageUrl } from "@/lib/config/storage";
import { getFlowEvents } from "@/lib/features/ledger/accounting";
import { generateDepartmentReports } from "@/lib/reporting/aggregator";
import { eventClient } from "@/lib/events/client";
import { LedgerPostedBody } from "@/lib/events/types";
import { mapLedgerEventsToFlowEvents } from "@/lib/reporting/mapper";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accessToken = (session as any)?.accessToken;
  const refreshToken = (session as any)?.refreshToken;

  let spreadsheetId: string | undefined = process.env.SHEETS_ID;
  if (!spreadsheetId) {
    try {
      const account = await getAccountSpreadsheetId({
        accessToken,
        refreshToken,
        userEmail: session.user.email,
      });
      spreadsheetId = account.spreadsheetId;
    } catch (error) {
      console.error("Unable to resolve spreadsheet for report refresh", error);
    }
  }

  if (!spreadsheetId) {
    return NextResponse.json({ error: "Spreadsheet not initialized" }, { status: 412 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = now.toISOString();
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  // Migration: Use EventClient instead of Sheets DB
  // const fetchOpts = { spreadsheetId, accessToken, refreshToken, userEmail: session.user.email };
  // const currentEvents = await getFlowEvents(startOfMonth, endOfMonth, fetchOpts);
  // const prevEvents = await getFlowEvents(startOfPrevMonth, endOfPrevMonth, fetchOpts);

  // Resolve Storage (BYODB)
  const storageUrl = await resolveStorageUrl({
    userEmail: session.user.email,
    accessToken,
    refreshToken
  }) || undefined;

  // New Event Path
  const currentLedgerEvents = await eventClient.getEvents<LedgerPostedBody>({
    type: 'ledger.posted',
    after: startOfMonth,
    before: endOfMonth,
    tenantId: session.user.email,
    storageUrl
  });
  const prevLedgerEvents = await eventClient.getEvents<LedgerPostedBody>({
    type: 'ledger.posted',
    after: startOfPrevMonth,
    before: endOfPrevMonth,
    tenantId: session.user.email,
    storageUrl
  });

  const currentEvents = mapLedgerEventsToFlowEvents(currentLedgerEvents);
  const prevEvents = mapLedgerEventsToFlowEvents(prevLedgerEvents);

  const reports = generateDepartmentReports(currentEvents, prevEvents);

  return NextResponse.json({ ok: true, reports });
}
