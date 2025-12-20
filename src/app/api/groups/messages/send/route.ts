
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { sendMessage } from "@/lib/groups/messageStore";
import { getGroupDetails } from "@/lib/groups/groupStore";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, content } = await req.json();
    if (!groupId || !content) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    try {
        // Verify membership access
        // Ideally we check if user is a member, but simplified: check if they can see details
        const group = await getGroupDetails(groupId, session.user.email);
        if (!group) return NextResponse.json({ error: "Group not found or access denied" }, { status: 404 });

        // In a strictly private group system, we'd check membership explicitly here.
        // Assuming details req succeeds implies access for now as per `groupStore.getGroupDetails` logic (returns role if member).
        if (!group.role) return NextResponse.json({ error: "Not a member" }, { status: 403 });

        const msg = await sendMessage(groupId, session.user.email, content);
        return NextResponse.json({ ok: true, message: msg });
    } catch (e) {
        console.error("Send message failed", e);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
