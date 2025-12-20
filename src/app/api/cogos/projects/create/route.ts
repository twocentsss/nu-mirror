import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import postgres from "postgres";
import { getTenantSchema } from "@/lib/events/client";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const { title, description, goalId, dueDate } = body;

    if (!title || !goalId) {
        return NextResponse.json({ error: "Missing title or goalId" }, { status: 400 });
    }

    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!dbUrl) return NextResponse.json({ error: "Configuration Error" }, { status: 500 });

    const sql = postgres(dbUrl, { ssl: false });
    const schema = getTenantSchema(session.user.email);
    const projectId = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    try {
        await sql.unsafe(`
            INSERT INTO ${schema}.projects (
                tenant_id, project_id, goal_id, title, status, description, due_date
            ) VALUES (
                $1, $2, $3, $4, 'active', $5, $6
            )
        `, [
            session.user.email,
            projectId,
            goalId,
            title,
            description || null,
            dueDate || null
        ]);

        return NextResponse.json({ ok: true, projectId });
    } catch (e: any) {
        console.error("Create Project Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
