
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { addGoal } from "@/lib/groups/goalStore";
import { getGroupDetails } from "@/lib/groups/groupStore";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, title } = await req.json();
    if (!groupId || !title) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    try {
        const group = await getGroupDetails(groupId, session.user.email);
        if (!group) return NextResponse.json({ error: "Access denied" }, { status: 403 });

        const goal = await addGoal(groupId, title);
        return NextResponse.json({ ok: true, goal });
    } catch (e) {
        console.error("Add goal failed", e);
        return NextResponse.json({ error: "Failed to add goal" }, { status: 500 });
    }
}
