import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import {
  AccountSpreadsheetNotFoundError,
  getAccountSpreadsheetId,
} from "@/lib/google/accountSpreadsheet";
import { readAllRows, updateRowById, updateRowByRowNumber } from "@/lib/google/sheetStore";

type PatchBody = {
  id: string;
  _row?: number;
  title?: string;
  raw_text?: string;
  status?: string;
  due_date?: string;
  time_of_day?: string;
  start_at?: string;
  end_at?: string;
  notes?: string;
  duration_min?: number;
  lf?: number;
  priority?: string;
  progress?: number;
  step?: number;
  goal?: string;
  project?: string;
};

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

  const body = (await req.json()) as PatchBody;
  const taskId: string = body.id;
  if (!taskId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  let targetRow: number | null = Number.isFinite(body._row) ? Number(body._row) : null;
  let rowData: any[] | undefined;

  if (targetRow) {
    const { rows, startRow } = await readAllRows({
      spreadsheetId,
      tab: "Tasks",
      accessToken,
      refreshToken,
    });
    const base = startRow ?? 2;
    const idx = targetRow - base;
    if (idx < 0 || idx >= rows.length) {
      targetRow = null;
    } else {
      rowData = rows[idx];
    }
  }

  if (!rowData) {
    const { rows } = await readAllRows({
      spreadsheetId,
      tab: "Tasks",
      accessToken,
      refreshToken,
    });
    rowData = rows.find((r) => String(r?.[0] ?? "") === taskId);
    if (!rowData) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
  }

  const jsonStr = String(rowData[8] ?? "{}");
  const task = JSON.parse(jsonStr);

  if (typeof body.title === "string") task.title = body.title;
  if (typeof body.raw_text === "string") task.raw_text = body.raw_text;
  if (typeof body.status === "string") task.status = body.status;

  task.time = { ...(task.time ?? {}) };
  if (typeof body.due_date === "string") task.time.due_date = body.due_date;
  if (typeof body.time_of_day === "string") task.time.time_of_day = body.time_of_day;
  if (typeof body.start_at === "string") task.time.start_at = body.start_at;
  if (typeof body.end_at === "string") task.time.end_at = body.end_at;

  if (typeof body.notes === "string") task.notes = body.notes;
  if (typeof body.duration_min === "number") task.duration_min = body.duration_min;
  if (typeof body.lf === "number") task.lf = body.lf;
  if (typeof body.priority === "string") task.priority = body.priority;
  if (typeof body.progress === "number") task.progress = body.progress;
  if (typeof body.step === "number") task.step = body.step;
  if (typeof body.goal === "string") task.goal = body.goal;
  if (typeof body.project === "string") task.project = body.project;

  task.updated_at = new Date().toISOString();

  const updatedRow = [
    task.id,
    task.episode_id ?? "",
    task.parent_task_id ?? "",
    task.title ?? "",
    task.status ?? "",
    task.time?.due_date ?? "",
    task.created_at ?? "",
    task.updated_at ?? "",
    JSON.stringify(task),
  ];

  if (targetRow) {
    await updateRowByRowNumber({
      spreadsheetId,
      tab: "Tasks",
      rowNumber: targetRow,
      values: updatedRow,
      accessToken,
      refreshToken,
    });
  } else {
    await updateRowById({
      spreadsheetId,
      tab: "Tasks",
      id: taskId,
      accessToken,
      refreshToken,
      values: updatedRow,
    });
  }

  return NextResponse.json({ ok: true, task });
}
