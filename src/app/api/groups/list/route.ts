
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { listUserGroups } from "@/lib/groups/groupStore";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const groups = await listUserGroups(session.user.email);
        return NextResponse.json({ groups });
    } catch (e) {
        console.error("List groups failed", e);
        return NextResponse.json({ error: "Failed to list groups" }, { status: 500 });
    }
}
