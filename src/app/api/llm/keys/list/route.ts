import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { listKeysForUser } from "@/lib/llm/keyStore";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const keys = await listKeysForUser(session.user.email);

    return NextResponse.json({ keys });
}
