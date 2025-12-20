import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/authOptions';
import { generateDailyReplay } from '@/lib/features/story/storyteller';
import { leaseKey, releaseOpenAiKey } from '@/lib/llm/router';
import { getAccountSpreadsheetId } from '@/lib/google/accountSpreadsheet';
import { resolveAiConfig } from '@/lib/config/ai';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { date, model } = body;

    if (!date) {
        return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const accessToken = (session as any).accessToken as string | undefined;
    const refreshToken = (session as any).refreshToken as string | undefined;

    const { spreadsheetId } = await getAccountSpreadsheetId({
        userEmail: session.user.email,
        accessToken,
        refreshToken
    });

    const leased = await leaseKey(session.user.email, "openai", spreadsheetId, { accessToken, refreshToken });

    let llmConfig = undefined;
    if (leased) {
        llmConfig = {
            apiKey: leased.apiKey,
            model: model || "gpt-4o",
        };
    } else {
        // Fallback to resolveAiConfig if leaning towards simple lookup or system default
        const resolved = await resolveAiConfig({
            userEmail: session.user.email,
            accessToken,
            refreshToken
        });
        if (resolved) {
            llmConfig = {
                apiKey: resolved.apiKey,
                model: model || (resolved.provider === "openai" ? "gpt-4o" : "gemini-1.5-flash"),
            };
        }
    }

    try {
        const story = await generateDailyReplay(date, llmConfig);
        return NextResponse.json({ success: true, story });
    } catch (error: any) {
        console.error("Story Generation Error:", error);
        return NextResponse.json({ error: error.message ?? "LLM failed" }, { status: 500 });
    } finally {
        if (leased) {
            await releaseOpenAiKey(leased.keyId);
        }
    }
}
