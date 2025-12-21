import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { seedDefaultsForUser } from "@/lib/cogos/seed";

async function handler(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.email;

    try {
        const result = await seedDefaultsForUser(tenantId);
        return NextResponse.json({
            ok: true,
            message: `Created ${result.createdGoals} goals and ${result.createdProjects} projects`,
            ...result
        });
    } catch (err) {
        console.error("[Seed Defaults API] Error:", err);
        return NextResponse.json({ error: "Failed to seed defaults" }, { status: 500 });
    }
}

export { handler as GET, handler as POST };
