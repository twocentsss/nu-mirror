import { NextRequest, NextResponse } from "next/server";
import { leaseKey, releaseLlmKey } from "@/lib/llm/router";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { anthropicResponses } from "@/lib/llm/anthropic";
import { openAiResponses } from "@/lib/llm/openai";
import { geminiResponses } from "@/lib/llm/gemini";
import { mistralResponses } from "@/lib/llm/mistral";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { rant } = await req.json();
        if (!rant) {
            return NextResponse.json({ error: "Rant is required" }, { status: 400 });
        }

        const userEmail = session.user.email;

        // We use a high-end model for this complex parsing
        const lease = await leaseKey(userEmail, "anthropic");
        if (!lease) {
            return NextResponse.json({ error: "No AI key available" }, { status: 502 });
        }

        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() + (day === 0 ? 0 : 7 - day); // Distance to Sunday
        const sunday = new Date(now.setDate(diff));
        const defaultDueDate = sunday.toISOString().slice(0, 10);

        const prompt = `You are an expert personal assistant and task manager.
Listen to this "rant" from a user and extract a structured task.

USER RANT:
"${rant}"

Current Date: ${new Date().toISOString()}
Default Due Date (end of week): ${defaultDueDate}

RULES:
1. Title: Create a concise but descriptive title (max 2 lines).
2. Notes: Summarize any context, thoughts, or extra details provided.
3. Due Date: If a date is mentioned, use it. Otherwise, use "${defaultDueDate}".
4. LF (Life Focus): Choose a category from 1-9. Default to 9 (Chaos) if unsure.
   1: Core (Soul), 2: Self (Body/Mind), 3: Circle (Family/Friends), 4: Grind (Work), 
   5: Level Up (Skills/Growth), 6: Impact (Community), 7: Play (Joy/Travel), 
   8: Insight (Wisdom), 9: Chaos (Unexpected).
5. Estimated Effort: Duration in minutes. Default to 30 if not specified.
6. Goal: Identify a high-level goal this task serves (e.g. "Launch Product", "Health", "Social Growth").
7. Project: Categorize this into a project name (e.g. "Work", "Home", "Side Project").
8. Subtasks: Breakdown the task into 3-7 actionable subtasks. Each subtask should have a title and duration_min.

RESPONSE FORMAT:
Return ONLY a JSON object with this structure:
{
  "title": "Task title",
  "notes": "Summarized notes",
  "due_date": "YYYY-MM-DD",
  "lf": number,
  "duration_min": number,
  "goal": "Goal name",
  "project": "Project name",
  "subtasks": [
    { "title": "Subtask title", "duration_min": number }
  ]
}
`;

        let result;
        const effectiveProvider = lease.keyProvider;
        const isOR = effectiveProvider === "openrouter";

        if (effectiveProvider === "gemini") {
            result = await geminiResponses({
                apiKey: lease.apiKey,
                model: "gemini-1.5-flash",
                input: prompt,
                jsonMode: true
            });
        } else if (effectiveProvider === "anthropic") {
            result = await anthropicResponses({
                apiKey: lease.apiKey,
                model: "claude-3-5-sonnet-20240620",
                input: prompt,
                jsonMode: true
            });
        } else if (effectiveProvider === "mistral") {
            result = await mistralResponses({
                apiKey: lease.apiKey,
                model: "mistral-small-latest",
                input: prompt,
                jsonMode: true
            });
        } else {
            result = await openAiResponses({
                apiKey: lease.apiKey,
                model: isOR ? "openai/gpt-4o-mini" : "gpt-4o",
                input: prompt,
                baseURL: isOR ? "https://openrouter.ai/api/v1" : undefined,
                jsonMode: true
            });
        }

        await releaseLlmKey(lease.keyId);

        if (!result || !result.content) {
            return NextResponse.json({ error: "AI failed to respond" }, { status: 500 });
        }

        let taskData: any;
        if (typeof result.content === "string") {
            let jsonStr = result.content;
            if (jsonStr.includes("```json")) {
                jsonStr = jsonStr.split("```json")[1].split("```")[0];
            } else if (jsonStr.includes("```")) {
                jsonStr = jsonStr.split("```")[1].split("```")[0];
            }
            taskData = JSON.parse(jsonStr.trim());
        } else {
            taskData = result.content;
        }

        return NextResponse.json({
            ok: true,
            task: taskData
        });

    } catch (e: any) {
        console.error("[RantAPI] Error:", e);
        return NextResponse.json({ error: e.message || "Failed to process rant" }, { status: 500 });
    }
}
