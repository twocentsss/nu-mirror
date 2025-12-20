import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import {
  AccountSpreadsheetNotFoundError,
  getAccountSpreadsheetId,
} from "@/lib/google/accountSpreadsheet";
import { readAllRows } from "@/lib/google/sheetStore";
import { resolveStorageUrl } from "@/lib/config/storage";

function inRange(dateStr: string, start?: string, end?: string) {
  if (!dateStr) return false;
  if (start && dateStr < start) return false;
  if (end && dateStr > end) return false;
  return true;
}

type StoredTask = {
  id?: string;
  _row?: number;
  title?: string;
  raw_text?: string;
  status?: string;
  parent_task_id?: string;
  episode_id?: string;
  notes?: string;
  duration_minutes?: number;
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

  // 1. Resolve Resources
  const storageUrl = await resolveStorageUrl({
    userEmail: session.user.email,
    accessToken,
    refreshToken
  });

  let spreadsheetId: string | undefined;
  try {
    const account = await getAccountSpreadsheetId({
      accessToken,
      refreshToken,
      userEmail: session.user.email,
    });
    spreadsheetId = account.spreadsheetId;
  } catch (error) {
    spreadsheetId = process.env.SHEETS_ID;
  }

  if (!spreadsheetId) {
    return NextResponse.json({ error: "Spreadsheet not initialized" }, { status: 412 });
  }

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start") ?? undefined;
  const end = searchParams.get("end") ?? undefined;

  // 2. Postgres Projection (Trial / BYODB)
  if (storageUrl) {
    try {
      const { getSqlClient, getTenantSchema } = await import("@/lib/events/client");
      const sql = getSqlClient(storageUrl);
      const schema = getTenantSchema(session.user.email);

      let query = `SELECT * FROM ${schema}.projection_tasks WHERE tenant_id = $1`;
      const params: any[] = [session.user.email];

      if (start) {
        query += ` AND due_ts >= $${params.length + 1}`;
        params.push(start);
      }
      if (end) {
        // End date from frontend is usually YYYY-MM-DD, so we set it to end of day for safety if no time component
        // But if it's strictly YYYY-MM-DD comparison, casting via date might vary.
        // Assuming simple string comparison or standard timestamp behavior.
        // Let's add ' 23:59:59' if it looks like a plain date, or rely on client sending full ISO.
        // Actually, start/end from TodayPage are formatted as YYYY-MM-DD.
        query += ` AND due_ts <= $${params.length + 1}`;
        params.push(end + ' 23:59:59');
      }

      query += ` ORDER BY updated_at DESC`;

      const projectionResults = await sql.unsafe(query, params).catch(() => []);

      if (projectionResults.length > 0) {
        const tasks = projectionResults.map((row: any) => ({
          id: row.task_id,
          title: row.title,
          status: row.status,
          time: { due_date: row.due_ts ? new Date(row.due_ts).toISOString().split('T')[0] : null },
          // Flatten field JSON tasks for compatibility
          duration_min: row.fields?.duration_min,
          priority: row.fields?.priority,
          lf: row.fields?.lf,
          ...(row.fields || {})
        }));
        return NextResponse.json({ spreadsheetId, tasks, source: 'postgres' });
      }
    } catch (err) {
      console.warn("[TaskList] Postgres read failed, falling back to Sheets", err);
    }
  }

  // 3. Sheets Fallback
  const { rows, startRow } = await readAllRows({
    spreadsheetId,
    tab: "Tasks",
    accessToken,
    refreshToken,
  });

  const tasks = rows
    .map((row, idx) => {
      const jsonStr = String(row?.[8] ?? "{}");
      try {
        const parsed = JSON.parse(jsonStr) as StoredTask;
        parsed._row = (startRow ?? 2) + idx;
        return parsed;
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

  return NextResponse.json({ spreadsheetId, tasks, source: 'sheets' });
}
