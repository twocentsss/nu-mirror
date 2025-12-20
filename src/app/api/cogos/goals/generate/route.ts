import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

function buildPrompt(params: {
    lfName: string;
    lfDesc: string;
    context?: string;
}) {
    return `
You are an expert Life Coach and Strategic Planner specializing in the domain of "${params.lfName}" (${params.lfDesc}).
Your goal is to help the user identify high-impact Abstract Goals and concrete Projects to achieve them.

USER CONTEXT/RANT:
"${params.context || "No specific context provided. Suggest general high-impact goals for this domain."}"

INSTRUCTIONS:
1. Analyze the context (or the nature of the domain if context is sparse).
2. Propose 3 distinct "Abstract Goals" (High-level targets).
3. For each Goal, propose 2-3 "Projects" (Concrete, multi-step undertakings).
4. Output STRICT JSON.

JSON SCHEMA:
{
  "goals": [
    {
      "title": "string (Goal Title)",
      "rationale": "string (Why this matters)",
      "projects": [
        { "title": "string (Project Title)", "description": "string (Brief scope)" }
      ]
    }
  ]
}
`.trim();
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const lfName = String(body.lfName || "General");
    const lfDesc = String(body.lfDesc || "");
    const context = body.context ? String(body.context) : undefined;

    const prompt = buildPrompt({ lfName, lfDesc, context });

    // Call the LLM (using same pattern as task decompose)
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? ""}/api/llm/complete`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie: req.headers.get("cookie") ?? "" },
        body: JSON.stringify({ model: "gpt-4o-mini", prompt }),
    });

    if (!res.ok && !process.env.NEXTAUTH_URL) {
        return NextResponse.json({ error: "Set NEXTAUTH_URL for server-to-server call" }, { status: 500 });
    }

    const data = await res.json();
    if (!data.ok) return NextResponse.json({ error: data.error ?? "LLM failed" }, { status: 502 });

    // Parse Output
    let parsed: any = null;
    const content = data.out;

    if (typeof content === "object" && content !== null) {
        parsed = content;
    } else {
        let text = String(content ?? "");
        // cleanup markdown
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        try {
            parsed = JSON.parse(text);
        } catch {
            const start = text.indexOf("{");
            const end = text.lastIndexOf("}");
            if (start >= 0 && end > start) {
                try {
                    parsed = JSON.parse(text.slice(start, end + 1));
                } catch (e) {
                    console.error("JSON Parse failed:", text);
                }
            }
        }
    }

    const goals = Array.isArray(parsed?.goals) ? parsed.goals : [];
    return NextResponse.json({ ok: true, goals });
}
