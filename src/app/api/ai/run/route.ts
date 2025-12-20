import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import {
  AccountSpreadsheetNotFoundError,
  getAccountSpreadsheetId,
} from "@/lib/google/accountSpreadsheet";
import { readAllRows } from "@/lib/google/sheetStore";
import { leaseKey, releaseLlmKey } from "@/lib/llm/router";
import { incrementUserSystemUsage } from "@/lib/admin/adminStore";

import { openAiResponses } from "@/lib/llm/openai";
import { geminiResponses } from "@/lib/llm/gemini";
import { anthropicResponses } from "@/lib/llm/anthropic";
import { mistralResponses } from "@/lib/llm/mistral";

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

  const body = await req.json();
  let { promptId, promptText, provider, model, context, jsonMode } = body;

  if (promptId) {
    const { rows } = await readAllRows({
      spreadsheetId,
      tab: "AI_PROMPTS",
      accessToken,
      refreshToken,
    });
    const row = rows.find((r: any[]) => String(r?.[0] ?? "") === promptId);
    if (!row) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }
    // row: [id, title, template, provider, model, schedule, context_source, created_at, updated_at, json]
    promptText = String(row[2] ?? "");
    provider = provider || String(row[3] ?? "openrouter");
    model = model || String(row[4] ?? "");
  }

  if (!promptText) {
    return NextResponse.json({ error: "Prompt text is required" }, { status: 400 });
  }

  // Replace placeholders
  if (context) {
    for (const [key, value] of Object.entries(context)) {
      promptText = promptText.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    }
  }

  // Lease key
  const leased = await leaseKey(session.user.email, provider as any, spreadsheetId, { accessToken, refreshToken });
  if (!leased) {
    return NextResponse.json({ error: `No active key found for provider: ${provider}` }, { status: 429 });
  }

  try {
    let result;
    if (provider === "gemini" || (leased.apiKey.startsWith("AIza"))) {
      result = await geminiResponses({
        apiKey: leased.apiKey,
        model: model || "gemini-1.5-flash",
        input: promptText,
        jsonMode: jsonMode ?? false,
      });
    } else if (provider === "anthropic" || leased.apiKey.startsWith("sk-ant-")) {
      result = await anthropicResponses({
        apiKey: leased.apiKey,
        model: model || "claude-3-5-sonnet-20240620",
        input: promptText,
        jsonMode: jsonMode ?? false,
      });
    } else if (provider === "mistral") {
      result = await mistralResponses({
        apiKey: leased.apiKey,
        model: model || "mistral-small-latest",
        input: promptText,
        jsonMode: jsonMode ?? false,
      });
    } else {
      let baseURL: string | undefined;
      const isOR = provider === "openrouter" || leased.apiKey.startsWith("sk-or-");
      if (isOR) baseURL = "https://openrouter.ai/api/v1";
      // OpenAI uses default

      result = await openAiResponses({
        apiKey: leased.apiKey,
        model: model || (isOR ? "openai/gpt-3.5-turbo" : "gpt-3.5-turbo"),
        input: promptText,
        baseURL,
        jsonMode: jsonMode ?? false,
      });
    }

    if (leased.isSystem && result.usage?.total_tokens) {
      // Fire and forget usage update
      incrementUserSystemUsage(session.user.email, result.usage.total_tokens).catch(console.error);
    }

    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    console.error("AI Run Error:", error);
    return NextResponse.json({ error: error.message || "AI execution failed" }, { status: 500 });
  } finally {
    await releaseLlmKey(leased.keyId);
  }
}
