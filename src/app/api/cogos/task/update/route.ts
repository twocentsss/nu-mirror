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
  const taskId: string = body.id;
  if (!taskId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { rows } = await readAllRows({
    spreadsheetId,
    tab: "Tasks",
    accessToken,
    refreshToken,
  });
  const row = rows.find((r) => String(r?.[0] ?? "") === taskId);
  if (!row) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const jsonStr = String(row[8] ?? "{}");
  const task = JSON.parse(jsonStr);

  if (body.status) task.status = body.status;
  if (body.title) task.title = body.title;
  if (body.due_date) {
    task.time = { ...(task.time ?? {}), due_date: body.due_date };
  }
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

  await updateRowById({
    spreadsheetId,
    tab: "Tasks",
    id: taskId,
    accessToken,
    refreshToken,
    values: updatedRow,
  });

  return NextResponse.json({ ok: true, task });
}
