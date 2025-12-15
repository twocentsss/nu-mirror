import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import {
  AccountSpreadsheetNotFoundError,
  getAccountSpreadsheetId,
} from "@/lib/google/accountSpreadsheet";
import { readAllRows } from "@/lib/google/sheetStore";

function inRange(dateStr: string, start?: string, end?: string) {
  if (!dateStr) return false;
  if (start && dateStr < start) return false;
  if (end && dateStr > end) return false;
  return true;
}

type StoredTask = {
  id?: string;
  title?: string;
  status?: string;
  priority?: { moscow?: string; weight?: number };
  time?: {
    due_date?: string;
    time_of_day?: string;
    start_at?: string;
    end_at?: string;
  };
  [key: string]: unknown;
};

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

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start") ?? undefined;
  const end = searchParams.get("end") ?? undefined;

  const { rows } = await readAllRows({
    spreadsheetId,
    tab: "Tasks",
    accessToken,
    refreshToken,
  });

  const tasks = rows
    .map((row) => {
      const jsonStr = String(row?.[8] ?? "{}");
      try {
        return JSON.parse(jsonStr) as StoredTask;
      } catch {
        return null;
      }
    })
    .filter((task): task is StoredTask => Boolean(task))
    .filter((task) => {
      if (!start && !end) return true;
      const due = typeof task.time?.due_date === "string" ? task.time?.due_date ?? "" : "";
      return inRange(due, start, end);
    });

  return NextResponse.json({ spreadsheetId, tasks });
}
