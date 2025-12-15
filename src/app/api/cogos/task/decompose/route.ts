import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const text: string = body.text ?? "";
  const answers: Record<string, string> = body.answers ?? {};

  if (!text.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const augmented = [
    `Task: ${text}`,
    answers.done ? `Done looks like: ${answers.done}` : "",
    answers.constraints ? `Constraints: ${answers.constraints}` : "",
    answers.deadline ? `Deadline: ${answers.deadline}` : "",
    answers.duration ? `Target duration: ${answers.duration}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(new URL("/api/solve", req.url), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: augmented }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "solve failed", details: err }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ subtasks: data.subtasks ?? [] });
}
