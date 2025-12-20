import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import postgres from "postgres";
import { ensureGlobalSchema, ensureTenantSchema, getTenantSchema } from "@/lib/events/client";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    // Allow forcing email via ?email=... query param
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") || session?.user?.email;

    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!dbUrl) return NextResponse.json({ error: "Missing DB URL" });

    // Force non-SSL for local compat
    const sql = postgres(dbUrl, { ssl: false });

    try {
        // 1. Global Setup
        await ensureGlobalSchema(sql);

        // 2. Tenant Setup
        let tenantMsg = "Skipped tenant setup (no email found)";
        if (email) {
            const schema = getTenantSchema(email);
            // Ensure schema itself exists
            await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS ${schema}`);

            await ensureTenantSchema(sql, schema);
            tenantMsg = `Created tenant schema: ${schema} for ${email}`;
        }

        return NextResponse.json({
            ok: true,
            message: "Global Schema 'nu' created.",
            tenant: tenantMsg
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
