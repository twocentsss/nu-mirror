import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { leaseKey, releaseOpenAiKey, cooldownOpenAiKey } from "@/lib/llm/router";
import { openAiResponses } from "@/lib/llm/openai";
import { geminiResponses } from "@/lib/llm/gemini";
import { logLlmUsage } from "@/lib/llm/logging";


import {
    AccountSpreadsheetNotFoundError,
    getAccountSpreadsheetId,
} from "@/lib/google/accountSpreadsheet";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const accessToken = (session as any).accessToken as string | undefined;
    const refreshToken = (session as any).refreshToken as string | undefined;
    if (!accessToken && !refreshToken) {
        return NextResponse.json({ error: "Missing Google OAuth tokens. Sign out/in again." }, { status: 401 });
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
            return NextResponse.json({ error: "Account spreadsheet not initialized." }, { status: 412 });
        }
        throw error;
    }

    const body = await req.json();
    let model = String(body.model || "gpt-4.1-mini");
    let provider = String(body.provider || (model.includes("/") ? "openrouter" : (model.includes("gemini") ? "gemini" : "openai"))) as "openai" | "openrouter" | "gemini";
    const prompt = String(body.prompt || "");

    if (!prompt.trim()) return NextResponse.json({ error: "prompt required" }, { status: 400 });

    let attempt = 0;
    let lastErr: any = null;

    while (attempt < 3) {
        attempt++;
        let lease = await leaseKey(session.user.email, provider, spreadsheetId, {
            accessToken,
            refreshToken,
        });

        // Fallback Logic
        if (!lease) {
            // If OpenAI failed, try OpenRouter or Gemini fallback depending on context
            if (provider === "openai") {
                // Try OpenRouter
                let orLease = await leaseKey(session.user.email, "openrouter", spreadsheetId, { accessToken, refreshToken });
                if (orLease) {
                    lease = orLease;
                    provider = "openrouter";
                    model = model.includes("/") ? model : `openai/${model}`;
                } else {
                    // Try Gemini as last resort
                    let gemLease = await leaseKey(session.user.email, "gemini", spreadsheetId, { accessToken, refreshToken });
                    if (gemLease) {
                        lease = gemLease;
                        provider = "gemini";
                        model = "gemini-1.5-flash"; // Switch to equivalent efficient model
                    }
                }
            }
        }

        if (!lease) return NextResponse.json({ error: `No ${provider} keys available` }, { status: 412 });

        try {
            const isOpenRouterKey = lease.apiKey.startsWith("sk-or-");
            // Safety: if it's an OpenRouter key, force provider to OpenRouter
            const effectiveProvider = isOpenRouterKey ? "openrouter" : provider;

            let out;
            if (effectiveProvider === "gemini") {
                out = await geminiResponses({
                    apiKey: lease.apiKey,
                    model: model.startsWith("gemini") ? model : "gemini-1.5-flash",
                    input: prompt
                });
            } else {
                out = await openAiResponses({
                    apiKey: lease.apiKey,
                    model: effectiveProvider === "openrouter" && !model.startsWith("openai/") && !model.includes("/")
                        ? `openai/${model}`
                        : model,
                    input: prompt,
                    baseURL: effectiveProvider === "openrouter" ? "https://openrouter.ai/api/v1" : undefined,
                    siteUrl: process.env.NEXTAUTH_URL,
                    siteName: "NuMirror",
                });
            }

            await releaseOpenAiKey(lease.keyId);

            // Log usage
            if (out.usage) {
                logLlmUsage({
                    provider: effectiveProvider,
                    model,
                    prompt_tokens: out.usage.prompt_tokens,
                    completion_tokens: out.usage.completion_tokens,
                    total_tokens: out.usage.total_tokens,
                    context: "api_complete",
                    keyId: lease.keyId
                });
            }

            return NextResponse.json({
                ok: true,
                keyId: lease.keyId,
                out: out.content, // Extract content for backward compatibility
                usage: out.usage
            });
        } catch (e: any) {
            lastErr = e;
            await releaseOpenAiKey(lease.keyId);

            // 429 = rate-limited -> cooldown + try next key
            if (e?.status === 429) {
                await cooldownOpenAiKey(lease.keyId, 30_000);
                continue;
            }

            return NextResponse.json({ error: e.message }, { status: 500 });
        }
    }

    return NextResponse.json({ ok: false, error: String(lastErr?.message ?? lastErr) }, { status: 502 });
}
