import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { newUlid } from "@/lib/id";
import { eventClient } from "@/lib/events/client";
import { taskProjector } from "@/lib/events/projector/taskProjector";
import { resolveStorageUrl } from "@/lib/config/storage";
import { id } from "@/lib/cogos/id";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const accessToken = (session as any).accessToken as string | undefined;
  const refreshToken = (session as any).refreshToken as string | undefined;
  if (!accessToken && !refreshToken) {
    return NextResponse.json({ error: "Missing Google OAuth tokens. Sign out/in again." }, { status: 401 });
  }

  const body = await req.json();
  const parent_task_id = String(body.parent_task_id || "");
  const episode_id = String(body.episode_id || "");
  const due_date = String(body.due_date || "");
  const time_of_day = String(body.time_of_day || "ANYTIME");
  const lf = body.lf ? Number(body.lf) : undefined;
  const goal = body.goal ? String(body.goal) : undefined;
  const project = body.project ? String(body.project) : undefined;
  const items = Array.isArray(body.items) ? body.items : [];

  if (!parent_task_id) return NextResponse.json({ error: "parent_task_id required" }, { status: 400 });
  if (!due_date) return NextResponse.json({ error: "due_date required" }, { status: 400 });
  if (!items.length) return NextResponse.json({ error: "items required" }, { status: 400 });

  const created: any[] = [];
  const events: any[] = [];
  const now = new Date().toISOString();
  const commonEnv = {
    id: id("evt"),
    ts: Date.now(),
    src: 'api',
    ver: '1',
    kind: 'evt' as const,
    trace: { traceId: id("tr"), spanId: id("sp") },
    auth: {
      tenantId: session.user.email,
      actorId: session.user.email
    }
  };

  for (const it of items) {
    const title = String(it.title || "").trim();
    if (!title) continue;

    const task = {
      id: newUlid(),
      episode_id,
      parent_task_id,
      title,
      raw_text: String(it.raw_text ?? title),
      status: "intake",
      lf,
      goal,
      project,
      time: { due_date, time_of_day },
      notes: String(it.notes ?? ""),
      duration_min: Number(it.duration_min ?? 0) || undefined,
      created_at: now,
      updated_at: now,
    };

    events.push({
      env: { ...commonEnv, id: id("evt") },
      type: 'task.created' as const,
      agg: { kind: 'task', id: task.id },
      seq: 1,
      body: task
    });

    created.push(task);
  }

  if (events.length > 0) {
    // 1. Resolve Storage
    const storageUrl = await resolveStorageUrl({
      userEmail: session.user.email,
      accessToken,
      refreshToken
    }) || undefined;

    // 2. Append to Log
    await eventClient.append(events as any, { storageUrl });

    // 3. Project to SQL
    await taskProjector.process(events as any, { storageUrl });
  }

  return NextResponse.json({ ok: true, created });
}
