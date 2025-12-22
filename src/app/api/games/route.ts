import { NextResponse } from "next/server";
import { fetchAdminGames, insertAdminGame } from "@/lib/games-store";
import { randomUUID } from "crypto";
import { getServerSession } from "@/lib/auth/session";
import { checkIsSuperAdmin } from "@/lib/admin/adminStore";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });
    const data = await fetchAdminGames(date);
    return NextResponse.json({ data });
}

export async function POST(request: Request) {
    const session = await getServerSession();
    const email = session?.user?.email;
    if (!email || !(await checkIsSuperAdmin(email))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const { type, date, label, payload } = body || {};
    if (!type || !date || !label) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const record = await insertAdminGame({
        id: randomUUID(),
        type,
        date,
        label,
        payload: payload ?? null,
    });
    return NextResponse.json({ data: record });
}
