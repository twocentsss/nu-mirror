
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { getGroupDetails, addMemberToGroup } from "@/lib/groups/groupStore";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, email } = await req.json();
    if (!groupId || !email) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    try {
        const group = await getGroupDetails(groupId, session.user.email);
        if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

        // Only admin/owner can add members? Or fail open for now?
        // Let's restrict to admins for safety.
        if (group.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await addMemberToGroup(groupId, email);
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("Add member failed", e);
        return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
    }
}
