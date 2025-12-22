import { NextResponse } from "next/server";
import { fetchResults, insertResult } from "@/lib/games-store";
import { randomUUID } from "crypto";
import { getServerSession } from "@/lib/auth/session";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });
    const data = await fetchResults(date);
    return NextResponse.json({ data });
}

export async function POST(request: Request) {
    const session = await getServerSession();
    const userId = session?.user?.email ?? null;
    const body = await request.json();
    const { type, date, score, label } = body || {};
    if (!type || !date || typeof score !== "number") {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const record = await insertResult({
        id: randomUUID(),
        type,
        date,
        score,
        label: label ?? null,
        user_id: userId,
    });
    return NextResponse.json({ data: record });
}
