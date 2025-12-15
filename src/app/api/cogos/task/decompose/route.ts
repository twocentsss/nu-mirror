import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

function buildPrompt(params: {
  title: string;
  notes?: string;
  durationMin?: number;
  answers?: Record<string, string>;
}) {
  const answers = params.answers ?? {};
  const answersText = Object.keys(answers).length
    ? Object.entries(answers).map(([k, v]) => `- ${k}: ${v}`).join("\n")
    : "- (none)";

  return `
You are an expert executive assistant and project manager.
Break the task into concrete subtasks that are actionable, specific, and not generic.

TASK:
- title: ${params.title}
- notes: ${params.notes ?? ""}
- duration_minutes: ${params.durationMin ?? ""}

USER ANSWERS:
${answersText}

RULES:
- Output STRICT JSON ONLY. No markdown.
- Subtasks must be specific to this task; avoid generic templates.
- 5 to 12 subtasks.
- Each subtask must include: title, duration_min (int), rationale (short).
- Titles should start with a strong verb.
- If missing info, still produce best-effort subtasks but keep them low-risk and reversible.

JSON SCHEMA:
{
  "subtasks": [
    { "title": "string", "duration_min": number, "rationale": "string" }
  ]
}
`.trim();
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const title = String(body.title || "");
  const notes = String(body.notes || "");
  const durationMin = Number(body.duration_min ?? 0) || undefined;
  const answers = (body.answers ?? {}) as Record<string, string>;

  if (!title.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });

  const prompt = buildPrompt({ title, notes, durationMin, answers });

  const res = await fetch(`${process.env.NEXTAUTH_URL ?? ""}/api/llm/complete`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: req.headers.get("cookie") ?? "" },
    body: JSON.stringify({ model: body.model ?? "gpt-4o-mini", prompt }),
  });

  // If NEXTAUTH_URL isn’t set, fallback to direct call on same host:
  if (!res.ok && !process.env.NEXTAUTH_URL) {
    return NextResponse.json({ error: "Set NEXTAUTH_URL for server-to-server call" }, { status: 500 });
  }

  const data = await res.json();
  if (!data.ok) return NextResponse.json({ error: data.error ?? "LLM failed" }, { status: 502 });

  // data.out is text (Responses API raw) OR object (if parsed by wrapper).
  let parsed: any = null;
  const raw = data.out;
  if (typeof raw === "object" && raw !== null) {
    parsed = raw;
  } else {
    const text = String(raw ?? "");
    try {
      parsed = JSON.parse(text);
    } catch {
      // some responses contain surrounding text; salvage JSON object range
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start >= 0 && end > start) parsed = JSON.parse(text.slice(start, end + 1));
    }
  }

  const subtasks = Array.isArray(parsed?.subtasks) ? parsed.subtasks : [];
  return NextResponse.json({ ok: true, subtasks });
}
