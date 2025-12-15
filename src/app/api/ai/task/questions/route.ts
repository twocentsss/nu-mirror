import { NextResponse } from "next/server";

const QUESTIONS = [
  { id: "deliverable", question: "What is the concrete deliverable/output for this?", type: "text" },
  { id: "done", question: "What does 'done' look like (definition of done)?", type: "text" },
  { id: "deadline", question: "When is this due?", type: "text" },
  { id: "constraints", question: "Any constraints (time, budget, people, tools)?", type: "text" },
  { id: "duration", question: "How long should each subtask take (minutes)?", type: "text" },
];

export async function POST(req: Request) {
  const body = await req.json();
  const text = String(body?.text ?? "").trim();

  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  return NextResponse.json({ questions: QUESTIONS });
}
