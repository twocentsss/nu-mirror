import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import {
  AccountSpreadsheetNotFoundError,
  getAccountSpreadsheetId,
} from "@/lib/google/accountSpreadsheet";
import { appendRow } from "@/lib/google/sheetStore";
import { id } from "@/lib/cogos/id";

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

  const now = new Date().toISOString();
  const episodeId = id("ep");

  const episode = {
    id: episodeId,
    raw_text: rawText,
    created_at: now,
    dims: {
      entity: { type: "person", ref: session.user.email },
      action: { verb: "capture", class: "create" },
      context: { domain: "work", constraints: [] },
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

  await appendRow({
    spreadsheetId,
    tab: "Episodes",
    accessToken,
    refreshToken,
    values: [episode.id, episode.created_at, episode.raw_text, JSON.stringify(episode.dims)],
  });

  const taskId = id("t");
  const task = {
    id: taskId,
    episode_id: episodeId,
    parent_task_id: parentTaskId ?? undefined,
    title,
    raw_text: rawText,
    dims_snapshot: episode.dims,
    ownership: {
      dri: session.user.email,
      decider: session.user.email,
      team: "",
      role: "owner",
    },
    status: "intake",
    time: {
      due_date: dueDate ?? (startAt ? startAt.slice(0, 10) : undefined),
      time_of_day: timeOfDay,
      start_at: startAt,
      end_at: endAt,
    },
    created_at: now,
    updated_at: now,
  };

  await appendRow({
    spreadsheetId,
    tab: "Tasks",
    accessToken,
    refreshToken,
    values: [
      task.id,
      task.episode_id,
      task.parent_task_id ?? "",
      task.title,
      task.status,
      dueDate ?? "",
      task.created_at,
      task.updated_at,
      JSON.stringify(task),
    ],
  });

  return NextResponse.json({ spreadsheetId, episode, task });
}
