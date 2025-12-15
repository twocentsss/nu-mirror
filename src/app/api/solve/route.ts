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
      "Define scope + acceptance criteria (DoD)",
      "Implement core flow (happy path)",
      "Add edge cases + error handling",
      "Add tests + verify",
      "Capture integration notes / notify stakeholders",
    ].map((title) => ({ title }));
  }

  return parts.slice(0, 8).map((title) => ({ title }));
}

export async function POST(req: Request) {
  const body = await req.json();
  const text: string = body.text ?? "";
  if (!text.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  return NextResponse.json({ subtasks: breakIntoSubtasks(text) });
}
