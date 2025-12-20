import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { disableKey } from "@/lib/llm/keyStore";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const keyId = String(body.keyId || "");
    if (!keyId) return NextResponse.json({ error: "keyId required" }, { status: 400 });

    const out = await disableKey({ keyId });
    return NextResponse.json(out);
}
