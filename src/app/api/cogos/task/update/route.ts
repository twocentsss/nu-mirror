import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { resolveStorageUrl } from "@/lib/config/storage";

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
  recurrence?: any;
  is_routine?: boolean;
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

  const storageUrl = (await resolveStorageUrl({
    userEmail: session.user.email,
    accessToken,
    refreshToken
  })) ?? process.env.DATABASE_URL ?? null;

  if (!storageUrl) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const body = (await req.json()) as PatchBody;
  const taskId: string = body.id;
  if (!taskId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { getSqlClient, getTenantSchema, ensureTenantSchema } = await import("@/lib/events/client");
  const sql = getSqlClient(storageUrl);
  const tenantId = session.user.email;
  const schema = getTenantSchema(tenantId);
  await ensureTenantSchema(sql, schema);

  const existingRows = await sql.unsafe(
    `SELECT fields FROM ${schema}.projection_tasks WHERE tenant_id = $1 AND task_id = $2`,
    [tenantId, taskId],
  );
  if (!existingRows || existingRows.length === 0) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  const storedFields = existingRows[0].fields;
  const task = typeof storedFields === "string" ? JSON.parse(storedFields) : { ...(storedFields ?? {}) };

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
  if (body.recurrence) task.recurrence = body.recurrence;
  if (typeof body.is_routine === "boolean") task.is_routine = body.is_routine;

  task.updated_at = new Date().toISOString();

  // Map priority string to numeric weight for database
  let priorityWeight = 0;
  if (typeof task.priority === "object" && typeof task.priority?.weight === "number") {
    priorityWeight = Number(task.priority.weight);
  } else if (typeof task.priority === "string") {
    // Map string priority to numeric weight
    const priorityMap: Record<string, number> = { low: 1, medium: 5, high: 10 };
    priorityWeight = priorityMap[task.priority] ?? 0;
  } else if (typeof task.priority === "number") {
    priorityWeight = task.priority;
  }

  // Safety check for NaN
  if (isNaN(priorityWeight)) priorityWeight = 0;

  try {
    await sql.unsafe(`
      UPDATE ${schema}.projection_tasks 
      SET title = $1, status = $2, due_ts = $3, priority = $4, updated_at = $5, fields = $6
      WHERE task_id = $7 AND tenant_id = $8
    `, [
      task.title,
      task.status,
      task.time?.due_date ? new Date(task.time.due_date) : null,
      priorityWeight,
      new Date(task.updated_at),
      task,
      taskId,
      tenantId
    ]);
  } catch (err) {
    console.warn("[UpdateRoute] Postgres update failed", err);
    return NextResponse.json({ error: "Unable to update task" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, task });
}
