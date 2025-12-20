
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { getGroupDetails, getGroupMembers } from "@/lib/groups/groupStore";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId } = await req.json();
    if (!groupId) return NextResponse.json({ error: "Group ID required" }, { status: 400 });

    try {
        const group = await getGroupDetails(groupId, session.user.email);
        if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

        // Members list
        // Note: In real app, check permission? Standard members can usually see other members.
        const members = await getGroupMembers(groupId);

        return NextResponse.json({ group, members });
    } catch (e) {
        console.error("Group details failed", e);
        return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
    }
}
