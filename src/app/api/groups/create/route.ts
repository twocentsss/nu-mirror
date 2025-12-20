
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { createGroup } from "@/lib/groups/groupStore";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, description } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    try {
        const id = await createGroup(name, description || "", session.user.email);
        return NextResponse.json({ ok: true, id });
    } catch (e) {
        console.error("Create group failed", e);
        return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
    }
}
