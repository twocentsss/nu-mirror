
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { listGoals } from "@/lib/groups/goalStore";
import { getGroupDetails } from "@/lib/groups/groupStore";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId } = await req.json();
    if (!groupId) return NextResponse.json({ error: "Group ID required" }, { status: 400 });

    try {
        const group = await getGroupDetails(groupId, session.user.email);
        if (!group) return NextResponse.json({ error: "Access denied" }, { status: 403 });

        const goals = await listGoals(groupId);
        return NextResponse.json({ goals });
    } catch (e) {
        console.error("List goals failed", e);
        return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
    }
}
