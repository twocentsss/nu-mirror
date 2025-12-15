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
  if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const accessToken = (session as any).accessToken as string | undefined;
  const refreshToken = (session as any).refreshToken as string | undefined;
  if (!accessToken && !refreshToken) {
    return NextResponse.json({ error: "Missing Google OAuth tokens. Sign out/in again." }, { status: 401 });
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
      return NextResponse.json({ error: "Account spreadsheet not initialized." }, { status: 412 });
    }
    throw error;
  }

  const body = await req.json();
  const parent_task_id = String(body.parent_task_id || "");
  const due_date = String(body.due_date || "");
  const time_of_day = String(body.time_of_day || "ANYTIME");
  const items = Array.isArray(body.items) ? body.items : [];

  if (!parent_task_id) return NextResponse.json({ error: "parent_task_id required" }, { status: 400 });
  if (!due_date) return NextResponse.json({ error: "due_date required" }, { status: 400 });
  if (!items.length) return NextResponse.json({ error: "items required" }, { status: 400 });

  const created: any[] = [];
  const now = new Date().toISOString();

  for (const it of items) {
    const title = String(it.title || "").trim();
    if (!title) continue;

    const task = {
      id: newUlid(),
      episode_id: "",
      parent_task_id,
      title,
      raw_text: String(it.raw_text ?? title),
      status: "intake",
      time: { due_date, time_of_day },
      notes: String(it.notes ?? ""),
      duration_min: Number(it.duration_min ?? 0) || undefined,
      created_at: now,
      updated_at: now,
    };

    const row = [
      task.id,
      task.episode_id,
      task.parent_task_id,
      task.title,
      task.status,
      task.time.due_date,
      task.created_at,
      task.updated_at,
      JSON.stringify(task),
    ];

    await appendRow({
      spreadsheetId,
      tab: "Tasks",
      accessToken,
      refreshToken,
      values: row,
    });

    created.push(task);
  }

  return NextResponse.json({ ok: true, created });
}
