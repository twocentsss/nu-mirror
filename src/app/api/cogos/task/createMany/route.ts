import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import {
  AccountSpreadsheetNotFoundError,
  getAccountSpreadsheetId,
} from "@/lib/google/accountSpreadsheet";
import { appendRow } from "@/lib/google/sheetStore";
import { id } from "@/lib/cogos/id";

type InputTask = {
  raw_text?: string;
  title?: string;
  due_date?: string;
  time_of_day?: string;
  start_at?: string;
  end_at?: string;
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

  const body = await req.json();
  const parentTaskId: string | undefined = body.parent_task_id;
  const subtasks: InputTask[] = Array.isArray(body.subtasks) ? body.subtasks : [];
  if (subtasks.length === 0) {
    return NextResponse.json({ error: "subtasks required" }, { status: 400 });
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

  const created: any[] = [];
  for (const sub of subtasks) {
    const rawText = (sub.raw_text ?? sub.title ?? "").trim();
    if (!rawText) continue;
    const title = sub.title ?? rawText.slice(0, 80) ?? "Untitled";
    const timeOfDay = (sub.time_of_day ?? "ANYTIME").toUpperCase();
    const dueDate = sub.due_date;
    const startAt = sub.start_at;
    const endAt = sub.end_at;

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
        meaning: { category: "task", weight: 0.6 },
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

    created.push(task);
  }

  return NextResponse.json({ ok: true, created });
}
