import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import postgres from "postgres";
import { getTenantSchema } from "@/lib/events/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) return NextResponse.json({ error: "Configuration Error: DATABASE_URL missing" }, { status: 500 });

  // Attempt with ssl: false
  const sql = postgres(dbUrl, { ssl: false });
  const schema = getTenantSchema(session.user.email);

  try {
    const projects = await sql.unsafe(`
      SELECT 
        p.project_id, 
        p.title, 
        p.description,
        g.title as goal_title,
        g.lf_id
      FROM ${schema}.projects p
      JOIN ${schema}.goals g ON p.goal_id = g.goal_id
      WHERE p.tenant_id = $1
      AND p.status = 'active'
      ORDER BY p.created_at DESC
    `, [session.user.email]);

    return NextResponse.json({ ok: true, projects });
  } catch (e: any) {
    console.error("Failed to fetch projects:", e);
    // Return empty list on error (e.g. table doesn't exist yet) to prevent crash
    return NextResponse.json({ ok: false, projects: [], error: e.message });
  }
}
