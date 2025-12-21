import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { resolveStorageUrl } from "@/lib/config/storage";

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

  // 1. Resolve Postgres Storage
  const storageUrl = (await resolveStorageUrl({
    userEmail: session.user.email,
    accessToken,
    refreshToken
  })) ?? process.env.DATABASE_URL ?? null;

  if (!storageUrl) {
    return NextResponse.json({ error: "Storage not available" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start") ?? undefined;
  const end = searchParams.get("end") ?? undefined;

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
      query += ` AND due_ts <= $${params.length + 1}`;
      params.push(end + ' 23:59:59');
    }

    query += ` ORDER BY updated_at DESC`;

    const projectionResults = await sql.unsafe(query, params);

    const tasks = projectionResults.map((row: any) => ({
      id: row.task_id,
      title: row.title,
      status: row.status,
      time: { due_date: row.due_ts ? new Date(row.due_ts).toISOString().split('T')[0] : null },
      duration_min: row.fields?.duration_min,
      priority: row.fields?.priority,
      lf: row.fields?.lf,
      ...(row.fields || {})
    }));

    return NextResponse.json({ tasks, source: 'postgres' });
  } catch (err) {
    console.error("[TaskList] Postgres read failed", err);
    return NextResponse.json({ error: "Unable to load tasks" }, { status: 500 });
  }
}
