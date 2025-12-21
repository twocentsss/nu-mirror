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
    const lfId = searchParams.get("lf_id");

    try {
        const sql = getSqlClient();
        const schema = getTenantSchema(tenantId);

        let query = `
      SELECT goal_id as id, title, lf_id, status, created_at, updated_at
      FROM ${schema}.goals
      WHERE tenant_id = $1 AND status = 'active'
    `;
        const params: any[] = [tenantId];

        if (lfId) {
            query += ` AND lf_id = $2`;
            params.push(parseInt(lfId));
        }

        query += ` ORDER BY created_at DESC`;

        const result = await sql.unsafe(query, params);

        return NextResponse.json({ goals: result });
    } catch (err) {
        console.error("[Goals API] Error:", err);
        return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.email;
    const body = await req.json();
    const { lf_id, title, rationale } = body;

    if (!lf_id || !title) {
        return NextResponse.json({ error: "lf_id and title are required" }, { status: 400 });
    }

    try {
        const sql = getSqlClient();
        const schema = getTenantSchema(tenantId);
        const goalId = crypto.randomUUID();

        await sql.unsafe(
            `INSERT INTO ${schema}.goals (tenant_id, goal_id, lf_id, title, status, rationale, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'active', $5, now(), now())`,
            [tenantId, goalId, lf_id, title, rationale || null]
        );

        return NextResponse.json({ ok: true, goal_id: goalId });
    } catch (err) {
        console.error("[Goals API] Create error:", err);
        return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
    }
}
