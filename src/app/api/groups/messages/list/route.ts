
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { listMessages } from "@/lib/groups/messageStore";
import { getGroupDetails } from "@/lib/groups/groupStore";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId } = await req.json();
    if (!groupId) return NextResponse.json({ error: "Group ID required" }, { status: 400 });

    try {
        const group = await getGroupDetails(groupId, session.user.email);
        if (!group || !group.role) return NextResponse.json({ error: "Access denied" }, { status: 403 });

        const messages = await listMessages(groupId);
        return NextResponse.json({ messages });
    } catch (e) {
        console.error("List messages failed", e);
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}
