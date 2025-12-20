
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { checkIsSuperAdmin } from "@/lib/admin/adminStore";
import { getSqlClient } from "@/lib/events/client";
import { encryptSecret } from "@/lib/crypto/secrets";
import { newUlid } from "@/lib/id";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = await checkIsSuperAdmin(session.user.email);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { provider, apiKey, label, limit } = await req.json();
    if (!apiKey) return NextResponse.json({ error: "Missing key" }, { status: 400 });

    const sql = getSqlClient(process.env.DATABASE_URL!);
    const encrypted = encryptSecret(apiKey);
    const id = newUlid();

    try {
        await sql`
            insert into nu.system_llm_keys (key_id, provider, encrypted_key, label, global_daily_limit_tokens, is_active)
            values (${id}, ${provider}, ${encrypted}, ${label}, ${limit || 10000}, true)
        `;
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }
}
