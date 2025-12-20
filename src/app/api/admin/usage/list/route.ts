
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { checkIsSuperAdmin } from "@/lib/admin/adminStore";
import { getSqlClient } from "@/lib/events/client";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = await checkIsSuperAdmin(session.user.email);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sql = getSqlClient(process.env.DATABASE_URL!);

    // Aggregate usage properly: show today's usage and total usage (optional)
    // For now, let's just show today's usage row by row
    try {
        const rows = await sql`
            select user_email, day, tokens_used 
            from nu.system_key_usage
            order by day desc, tokens_used desc
            limit 100
        `;

        return NextResponse.json({ usage: rows });
    } catch (e) {
        return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }
}
