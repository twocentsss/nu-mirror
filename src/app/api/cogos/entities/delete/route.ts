import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import postgres from "postgres";
import { getTenantSchema } from "@/lib/events/client";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const { type, id } = body;

    if (!id || (type !== 'goal' && type !== 'project')) {
        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!dbUrl) return NextResponse.json({ error: "Configuration Error" }, { status: 500 });

    const sql = postgres(dbUrl, { ssl: false });
    const schema = getTenantSchema(session.user.email);

    try {
        if (type === 'project') {
            await sql.unsafe(`
                DELETE FROM ${schema}.projects 
                WHERE tenant_id = $1 AND project_id = $2
            `, [session.user.email, id]);
        }
        else if (type === 'goal') {
            // Manual Cascade: Delete projects first
            await sql.unsafe(`
                DELETE FROM ${schema}.projects 
                WHERE tenant_id = $1 AND goal_id = $2
            `, [session.user.email, id]);

            // Then delete goal
            await sql.unsafe(`
                DELETE FROM ${schema}.goals 
                WHERE tenant_id = $1 AND goal_id = $2
            `, [session.user.email, id]);
        }

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error("Delete Entity Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
