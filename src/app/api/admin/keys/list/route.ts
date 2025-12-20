
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { checkIsSuperAdmin, getActiveSystemKeys } from "@/lib/admin/adminStore";
import { getSqlClient } from "@/lib/events/client";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = await checkIsSuperAdmin(session.user.email);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // We want ALL keys, not just active ones, but getActiveSystemKeys filters by active.
    // Let's create a raw query here for admin view
    const sql = getSqlClient(process.env.DATABASE_URL!);
    try {
        // We select everything but mask the key
        const rows = await sql`
            select key_id, provider, label, is_active, global_daily_limit_tokens 
            from nu.system_llm_keys
            order by created_at desc
        `;

        return NextResponse.json({
            keys: rows.map(r => ({
                key_id: r.key_id,
                provider: r.provider,
                label: r.label,
                is_active: r.is_active,
                limit: r.global_daily_limit_tokens
            }))
        });
    } catch (e) {
        return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }
}
