import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { bootstrapSheet, appendObject } from "@/lib/sheets/sheetsDb";
import { geminiExtractCogos } from "@/lib/ai/gemini";
import { newUlid } from "@/lib/id";

export const runtime = "nodejs";

function ensureBundle(bundle: any, rawText: string, userEmail: string) {
  const now = new Date().toISOString();
  if (!bundle.episode) {
    bundle.episode = {
      id: newUlid(),
      raw_text: rawText,
      created_at: now,
      dims: {
        entity: { type: "concept", ref: "unknown" },
        action: { verb: "unknown", class: "unknown" },
        context: { domain: "misc", constraints: [] },
        intent: { goal_type: "unknown", goal_text: "" },
        outcome: { expected: "" },
        time: { when: "unspecified", value: null },
        meaning: { category: "note", weight: 0.3 },
        station: { phase: "transition", confidence: 0.3 },
      },
    };
  }
  bundle.episode.id = bundle.episode.id || newUlid();
  bundle.episode.created_at = bundle.episode.created_at || now;
  bundle.episode.raw_text = bundle.episode.raw_text || rawText;

  const episodeId = bundle.episode.id;

  const tasks = Array.isArray(bundle.tasks) ? bundle.tasks : [];
  bundle.tasks = tasks.map((task: any) => {
    const id = task.id || newUlid();
    const created_at = task.created_at || now;
    const updated_at = task.updated_at || now;
    const ownership = task.ownership || {
      dri: userEmail,
      decider: userEmail,
    };
    return {
      ...task,
      id,
      episode_id: task.episode_id || episodeId,
      created_at,
      updated_at,
      ownership,
    };
  });

  bundle.worklogs = Array.isArray(bundle.worklogs) ? bundle.worklogs : [];
  bundle.decisionLogs = Array.isArray(bundle.decisionLogs) ? bundle.decisionLogs : [];
  bundle.caseBriefs = Array.isArray(bundle.caseBriefs) ? bundle.caseBriefs : [];

  return bundle;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { text } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  await bootstrapSheet();

  let bundle = await geminiExtractCogos(text, userId);
  bundle.raw_text = text;
  bundle = ensureBundle(bundle, text, userId);

  const episode = bundle.episode;
  await appendObject("Episodes", userId, {
    id: episode.id,
    userId,
    created_at: episode.created_at,
    meaning_category: episode?.dims?.meaning?.category ?? "",
    action_class: episode?.dims?.action?.class ?? "",
    domain: episode?.dims?.context?.domain ?? "",
    urgency: episode?.dims?.state?.urgency ?? "",
    mood: episode?.dims?.state?.mood ?? "",
    raw_text: episode.raw_text,
    json: episode,
  });

  for (const task of bundle.tasks) {
    await appendObject("Tasks", userId, {
      id: task.id,
      userId,
      episode_id: task.episode_id,
      parent_task_id: task.parent_task_id ?? "",
      title: task.title,
      status: task.status ?? "intake",
      dri: task?.ownership?.dri ?? userId,
      decider: task?.ownership?.decider ?? userId,
      due_date: task?.time?.due_date ?? "",
      next_action_date: task?.time?.next_action_date ?? "",
      created_at: task.created_at,
      updated_at: task.updated_at,
      moscow: task?.priority?.moscow ?? "",
      eisenhower: task?.priority?.eisenhower ?? "",
      effort: task?.priority?.effort ?? "",
      weight: task?.priority?.weight ?? "",
      impact_score: task?.priority?.impact_score ?? "",
      confidence_score: task?.priority?.confidence_score ?? "",
      tags: Array.isArray(task.tags) ? task.tags.join(",") : "",
      json: task,
    });
  }

  for (const worklog of bundle.worklogs ?? []) {
    await appendObject("Worklogs", userId, worklog);
  }
  for (const decision of bundle.decisionLogs ?? []) {
    await appendObject("DecisionLogs", userId, decision);
  }
  for (const brief of bundle.caseBriefs ?? []) {
    await appendObject("CaseBriefs", userId, brief);
  }

  return NextResponse.json({
    ok: true,
    episodeId: episode.id,
    counts: {
      tasks: bundle.tasks.length,
      worklogs: (bundle.worklogs ?? []).length,
      decisionLogs: (bundle.decisionLogs ?? []).length,
      caseBriefs: (bundle.caseBriefs ?? []).length,
    },
    bundle,
  });
}
