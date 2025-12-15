import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { disableKey } from "@/lib/llm/keyStore";

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
    const keyId = String(body.keyId || "");
    if (!keyId) return NextResponse.json({ error: "keyId required" }, { status: 400 });

    const out = await disableKey({
        keyId,
        spreadsheetId,
        accessToken,
        refreshToken,
    });
    return NextResponse.json(out);
}
