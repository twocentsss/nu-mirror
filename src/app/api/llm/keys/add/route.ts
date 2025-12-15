import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { addKeyForUser } from "@/lib/llm/keyStore";

import {
    AccountSpreadsheetNotFoundError,
    initAccountSpreadsheet,
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
        ({ spreadsheetId } = await initAccountSpreadsheet({
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
    const apiKey = String(body.apiKey || "");
    const label = String(body.label || "");
    const provider = String(body.provider || "openai");

    if (!apiKey.trim()) return NextResponse.json({ error: "apiKey required" }, { status: 400 });

    const out = await addKeyForUser({
        userEmail: session.user.email,
        provider: provider as any,
        label,
        apiKey,
        spreadsheetId,
        accessToken,
        refreshToken,
    } as any);

    return NextResponse.json({ ok: true, id: out.id });
}
