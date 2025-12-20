
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { toggleGoal } from "@/lib/groups/goalStore";

// Simplified access control: any authenticated user can toggle for now. 
// Ideally should check group membership via goal->group join.
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { goalId, isCompleted } = await req.json();
    if (!goalId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    try {
        const goal = await toggleGoal(goalId, isCompleted);
        return NextResponse.json({ ok: true, goal });
    } catch (e) {
        console.error("Toggle goal failed", e);
        return NextResponse.json({ error: "Failed to toggle goal" }, { status: 500 });
    }
}
