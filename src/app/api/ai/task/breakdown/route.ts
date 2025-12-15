import { NextResponse } from "next/server";

function breakIntoSubtasks(text: string) {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) return [];
  const parts = cleaned
    .split(/(?:\.\s+|;\s+|,\s+and\s+|\s+then\s+|\s+and\s+)/gi)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return [
      "Clarify scope + definition of done",
      "List constraints, dependencies, and risks",
      "Draft the execution plan",
      "Execute the first concrete step",
      "Review + log next action",
    ].map((title) => ({ title }));
  }

  return parts.slice(0, 12).map((title) => ({ title }));
}

export async function POST(req: Request) {
  const body = await req.json();
  const provider = (body?.provider ?? "heuristic") as string;
  const taskTitle = String(body?.task?.title ?? body?.text ?? "").trim();
  const raw = String(body?.task?.raw_text ?? "").trim();
  const answers = body?.answers && typeof body.answers === "object" ? body.answers : {};

  if (!taskTitle) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const augmented = [
    taskTitle,
    raw,
    answers.deliverable ? `Deliverable: ${answers.deliverable}` : "",
    answers.done ? `Done looks like: ${answers.done}` : "",
    answers.constraints ? `Constraints: ${answers.constraints}` : "",
    answers.deadline ? `Deadline: ${answers.deadline}` : "",
    answers.duration ? `Target duration: ${answers.duration}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Currently all providers fall back to the heuristic implementation.
  const subtasks = breakIntoSubtasks(augmented);

  return NextResponse.json({
    provider,
    subtasks,
  });
}
