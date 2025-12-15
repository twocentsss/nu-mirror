import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { readAllRows } from "@/lib/google/sheetStore";

import {
    AccountSpreadsheetNotFoundError,
    initAccountSpreadsheet,
} from "@/lib/google/accountSpreadsheet";

export async function GET() {
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

    const { rows } = await readAllRows({
        spreadsheetId,
        tab: "LLM_KEYS",
        accessToken,
        refreshToken,
    });

    const keys = rows
        .map((r) => ({
            id: String(r?.[0] ?? ""),
            user_email: String(r?.[1] ?? ""),
            provider: String(r?.[2] ?? "openai"),
            label: String(r?.[3] ?? ""),
            created_at: String(r?.[5] ?? ""),
            disabled: String(r?.[7] ?? "0") === "1",
        }))
        .filter((k) => k.user_email === session!.user!.email && k.id);

    return NextResponse.json({ keys });
}
