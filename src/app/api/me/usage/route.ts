
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { getSqlClient } from "@/lib/events/client";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sql = getSqlClient(process.env.DATABASE_URL!);

    try {
        const rows = await sql`
            select day, tokens_used 
            from nu.system_key_usage
            where user_email = ${session.user.email}
            order by day desc
            limit 30
        `;

        return NextResponse.json({ usage: rows });
    } catch (e) {
        return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }
}
