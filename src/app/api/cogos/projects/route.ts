import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { getSqlClient, getTenantSchema } from "@/lib/events/client";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.email;
    const searchParams = req.nextUrl.searchParams;
    const goalId = searchParams.get("goal_id");

    try {
        const sql = getSqlClient();
        const schema = getTenantSchema(tenantId);

        let query = `
      SELECT project_id as id, goal_id, title, status, description, created_at, updated_at
      FROM ${schema}.projects
      WHERE tenant_id = $1 AND status = 'active'
    `;
        const params: any[] = [tenantId];

        if (goalId) {
            query += ` AND goal_id = $2`;
            params.push(goalId);
        }

        query += ` ORDER BY created_at DESC`;

        const result = await sql.unsafe(query, params);

        return NextResponse.json({ projects: result });
    } catch (err) {
        console.error("[Projects API] Error:", err);
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.email;
    const body = await req.json();
    const { goal_id, title, description } = body;

    if (!goal_id || !title) {
        return NextResponse.json({ error: "goal_id and title are required" }, { status: 400 });
    }

    try {
        const sql = getSqlClient();
        const schema = getTenantSchema(tenantId);
        const projectId = crypto.randomUUID();

        await sql.unsafe(
            `INSERT INTO ${schema}.projects (tenant_id, project_id, goal_id, title, status, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'active', $5, now(), now())`,
            [tenantId, projectId, goal_id, title, description || null]
        );

        return NextResponse.json({ ok: true, project_id: projectId });
    } catch (err) {
        console.error("[Projects API] Create error:", err);
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}
