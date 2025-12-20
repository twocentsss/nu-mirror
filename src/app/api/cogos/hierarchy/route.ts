import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import postgres from "postgres";
import { getTenantSchema } from "@/lib/events/client";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const lfId = searchParams.get("lfId");

    if (!lfId) {
        return NextResponse.json({ error: "Missing lfId" }, { status: 400 });
    }

    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!dbUrl) return NextResponse.json({ error: "Configuration Error" }, { status: 500 });

    const sql = postgres(dbUrl, { ssl: false });
    const schema = getTenantSchema(session.user.email);

    try {
        // Fetch Goals
        const goals = await sql.unsafe(`
       SELECT * FROM ${schema}.goals 
       WHERE tenant_id = $1 AND lf_id = $2 AND status != 'archived'
       ORDER BY created_at DESC
    `, [session.user.email, lfId]);

        // Fetch Projects for these goals
        let projects: any[] = [];
        if (goals.length > 0) {
            const goalIds = goals.map((g: any) => g.goal_id); // Postgres.js returns objects

            // Manual parameter expansion for IN clause
            const placeholders = goalIds.map((_, i) => `$${i + 2}`).join(',');

            projects = await sql.unsafe(`
            SELECT * FROM ${schema}.projects
            WHERE tenant_id = $1 AND goal_id IN (${placeholders}) AND status != 'archived'
            ORDER BY created_at DESC
        `, [session.user.email, ...goalIds]);
        }

        // Nest them
        const hierarchy = goals.map((g: any) => ({
            ...g,
            projects: projects.filter((p: any) => p.goal_id === g.goal_id)
        }));

        return NextResponse.json({ hierarchy });
    } catch (e: any) {
        if (e.code === '42P01') { // Undefined table (schema missing)
            return NextResponse.json({ hierarchy: [] }); // Treat as empty
        }
        console.error("Hierarchy Fetch Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
