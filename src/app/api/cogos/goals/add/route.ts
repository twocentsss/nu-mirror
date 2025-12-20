import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import postgres from "postgres";
import { getTenantSchema } from "@/lib/events/client";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const { title, rationale, lfId, dueDate } = body;

    if (!title || !lfId) {
        return NextResponse.json({ error: "Missing title or lfId" }, { status: 400 });
    }

    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!dbUrl) return NextResponse.json({ error: "Configuration Error" }, { status: 500 });

    const sql = postgres(dbUrl, { ssl: false });
    const schema = getTenantSchema(session.user.email);
    const goalId = `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    try {
        await sql.unsafe(`
            INSERT INTO ${schema}.goals (
                tenant_id, goal_id, lf_id, title, status, rationale, due_date
            ) VALUES (
                $1, $2, $3, $4, 'active', $5, $6
            )
        `, [
            session.user.email,
            goalId,
            lfId,
            title,
            rationale || null,
            dueDate || null
        ]);

        return NextResponse.json({ ok: true, goalId });
    } catch (e: any) {
        console.error("Add Goal Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
