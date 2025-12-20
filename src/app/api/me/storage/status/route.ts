import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { getStorageStatus } from "@/lib/config/storage";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = await getStorageStatus({
        userEmail: session.user.email,
        accessToken: (session as any).accessToken,
        refreshToken: (session as any).refreshToken
    });

    return NextResponse.json(status);
}
