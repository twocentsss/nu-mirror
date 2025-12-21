import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { id } from "@/lib/cogos/id";
import { eventClient } from "@/lib/events/client";
import { taskProjector } from "@/lib/events/projector/taskProjector";
import { resolveStorageUrl } from "@/lib/config/storage";

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

  const body = await req.json();
  const rawText: string = body.raw_text ?? "";
  if (!rawText.trim()) {
    return NextResponse.json({ error: "raw_text required" }, { status: 400 });
  }

  const title: string = body.title ?? rawText.slice(0, 80) ?? "Untitled";
  const dueDate: string | undefined = body.due_date;
  const parentTaskId: string | undefined = body.parent_task_id;
  const timeOfDay: string = (body.time_of_day ?? "ANYTIME").toUpperCase();
  const startAt: string | undefined = body.start_at;
  const endAt: string | undefined = body.end_at;
  const lf: number | undefined = body.lf;
  const durationMin: number | undefined = body.duration_min;
  const goal: string | undefined = body.goal;
  const project: string | undefined = body.project;
  const notes: string | undefined = body.notes;

  const now = new Date().toISOString();
  const episodeId = id("ep");

  const episode = {
    id: episodeId,
    raw_text: rawText,
    created_at: now,
    dims: {
      entity: { type: "person", ref: session.user.email },
      action: { verb: "capture", class: "create" },
      context: { domain: "work", constraints: [], project, goal },
      intent: { goal_type: "complete", goal_text: "Capture & execute task" },
      outcome: { expected: "Task tracked in system" },
      time: {
        when: startAt ? "scheduled" : dueDate ? "date" : "unspecified",
        value: startAt ?? dueDate ?? null,
        slot: timeOfDay,
      },
      meaning: { category: "task", weight: 0.7 },
      station: { phase: "setup", confidence: 0.6 },
    },
  };

  /* Restoring Task Definition */
  const taskId = id("t");
  const task = {
    id: taskId,
    episode_id: episodeId,
    parent_task_id: parentTaskId ?? undefined,
    title,
    raw_text: rawText,
    notes,
    dims_snapshot: episode.dims,
    ownership: {
      dri: session.user.email,
      decider: session.user.email,
      team: "",
      role: "owner",
    },
    status: "intake",
    lf,
    goal,
    project,
    duration_min: durationMin,
    time: {
      due_date: dueDate ?? (startAt ? startAt.slice(0, 10) : undefined),
      time_of_day: timeOfDay,
      start_at: startAt,
      end_at: endAt,
    },
    created_at: now,
    updated_at: now,
  };

  /* MIGRATION: Event-Driven Write */
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

  const events = [
    {
      env: { ...commonEnv, id: id("evt") },
      type: 'activity.created' as const,
      agg: { kind: 'activity', id: episode.id },
      seq: 1,
      body: episode
    },
    {
      env: { ...commonEnv, id: id("evt") },
      type: 'task.created' as const,
      agg: { kind: 'task', id: task.id },
      seq: 1,
      body: task
    }
  ];

  // 1. Resolve Storage (BYODB)
  const storageUrl = await resolveStorageUrl({
    userEmail: session.user.email,
    accessToken,
    refreshToken
  }) || undefined;

  // 2. Append to Log
  await eventClient.append(events as any, { storageUrl });

  // 3. Project to SQL
  await taskProjector.process(events as any, { storageUrl });

  return NextResponse.json({ episode, task });
}
