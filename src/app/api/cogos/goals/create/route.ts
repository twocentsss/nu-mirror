import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import postgres from "postgres";
import { getTenantSchema } from "@/lib/events/client";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const { goals, lfId } = body;

    if (!Array.isArray(goals) || goals.length === 0) {
        return NextResponse.json({ error: "No goals provided" }, { status: 400 });
    }

    // Debug logging for connection
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!dbUrl) {
        console.error("Missing DATABASE_URL. Env Keys:", Object.keys(process.env));
        return NextResponse.json({ error: "Configuration Error: DATABASE_URL missing" }, { status: 500 });
    }

    const url = new URL(dbUrl);
    console.log(`[DB Debug] Connecting to ${url.hostname}:${url.port} (SSL: false)`);

    const sql = postgres(dbUrl, { ssl: false });
    const schema = getTenantSchema(session.user.email);

    try {
        const results = [];

        for (const g of goals) {
            const goalId = `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

            // 1. Insert Goal (using dynamic schema)
            await sql.unsafe(`
                INSERT INTO ${schema}.goals (tenant_id, goal_id, lf_id, title, status, rationale)
                VALUES ($1, $2, $3, $4, 'active', $5)
            `, [session.user.email, goalId, lfId, g.title, g.rationale]);

            // 2. Insert Projects
            for (const p of g.projects) {
                const projId = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                await sql.unsafe(`
                  INSERT INTO ${schema}.projects (tenant_id, project_id, goal_id, title, status, description)
                  VALUES ($1, $2, $3, $4, 'active', $5)
                `, [session.user.email, projId, goalId, p.title, p.description]);
            }

            results.push(goalId);
        }

        return NextResponse.json({ ok: true, count: results.length });
    } catch (e: any) {
        console.error("Failed to persist goals:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
