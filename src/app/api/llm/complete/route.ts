// Cache bust: 2025-12-20T15:40:00
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { leaseKey, releaseLlmKey, cooldownLlmKey } from "@/lib/llm/router";
import { getActiveSystemKeys, incrementUserSystemUsage } from "@/lib/admin/adminStore";


import { openAiResponses } from "@/lib/llm/openai";
// Cache bust: 2025-12-20T15:40:00
import { redis } from "@/lib/kv/redis";
import { geminiResponses } from "@/lib/llm/gemini";
import { anthropicResponses } from "@/lib/llm/anthropic";
import { mistralResponses } from "@/lib/llm/mistral";
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
    let model = String(body.model || "gpt-4o-mini");
    let provider = String(body.provider || (model.includes("/") ? "openrouter" : (model.includes("gemini") ? "gemini" : (model.includes("claude") ? "anthropic" : (model.includes("mistral") ? "mistral" : "openai"))))) as "openai" | "openrouter" | "gemini" | "anthropic" | "mistral";
    const prompt = String(body.prompt || "");

    if (!prompt.trim()) return NextResponse.json({ error: "prompt required" }, { status: 400 });



    // Smart Retry Loop
    let lastErr: any = null;
    const failedKeys: string[] = [];

    const MAX_RETRIES = 5; // Reasonably high to cycle through keys

    for (let retry = 0; retry < MAX_RETRIES; retry++) {
        let lease: any = null;

        try {
            // Simplified Smart Routing:
            // 1. Try to lease a key (respecting exclusions)
            lease = await leaseKey(session.user.email, provider, spreadsheetId, { accessToken, refreshToken }, failedKeys);

            if (!lease) {
                break; // No keys left
            }

            // EXECUTE
            let effectiveProvider = lease.keyProvider;

            let out;
            if (effectiveProvider === "gemini") {
                out = await geminiResponses({
                    apiKey: lease.apiKey,
                    model: model.startsWith("gemini") ? model : "gemini-1.5-flash",
                    input: prompt
                });
            } else if (effectiveProvider === "anthropic") {
                out = await anthropicResponses({
                    apiKey: lease.apiKey,
                    model: model.includes("claude") ? model : "claude-3-5-sonnet-20240620",
                    input: prompt
                });
            } else if (effectiveProvider === "mistral") {
                out = await mistralResponses({
                    apiKey: lease.apiKey,
                    model: model || "mistral-small-latest",
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
                    siteName: "Alfred",
                });
            }

            // Success!
            await releaseLlmKey(lease.keyId);

            // Track usage if system key
            if (lease.isSystem && out.usage?.total_tokens) {
                incrementUserSystemUsage(session.user.email, out.usage.total_tokens).catch(console.error);
            }

            return NextResponse.json({
                ok: true,
                keyId: lease.keyId,
                out: out.content,
                usage: out.usage
            });

        } catch (e: any) {
            console.warn(`[SmartRouting] Key ${lease?.keyId} failed:`, e.message);

            if (lease) {
                await releaseLlmKey(lease.keyId);
                failedKeys.push(lease.keyId);

                // Rate limit? Cooldown.
                if (e?.status === 429) {
                    await cooldownLlmKey(lease.keyId, 60_000);
                }
                // Auth error? Cooldown longer.
                if (e?.status === 401) {
                    await cooldownLlmKey(lease.keyId, 3600_000);
                }
            }

            lastErr = e;
            // Loop continues to next retry
        }
    }

    return NextResponse.json({ ok: false, error: String(lastErr?.message ?? "All attempts failed") }, { status: 502 });
}
