import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { addKeyForUser } from "@/lib/llm/keyStore";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const apiKey = String(body.apiKey || "");
    const label = String(body.label || "");
    const provider = String(body.provider || "openai");
    const preferred = !!body.preferred;

    if (!apiKey.trim()) return NextResponse.json({ error: "apiKey required" }, { status: 400 });

    try {
        const out = await addKeyForUser({
            userEmail: session.user.email,
            provider: provider as any,
            label,
            apiKey,
            preferred
        });

        return NextResponse.json({ ok: true, id: out.id });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
