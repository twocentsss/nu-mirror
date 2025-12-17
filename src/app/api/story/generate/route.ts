
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/authOptions';
import { generateDailyReplay } from '@/lib/features/story/storyteller';
import { leaseKey, releaseOpenAiKey } from '@/lib/llm/router';

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

    const spreadsheetId = "global";
    const leased = await leaseKey(session.user.email, "openai", spreadsheetId);

    let llmConfig = undefined;
    if (leased) {
        llmConfig = {
            apiKey: leased.apiKey,
            model: model || "gpt-4o",
        };
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
