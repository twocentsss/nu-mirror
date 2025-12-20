
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { getDailyMetrics } from "@/lib/analytics/telemetryStore";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // In a real app, check for ADMIN role here.
    // const role = await getUserRole(session.user.email);
    // if (role !== 'admin' && role !== 'super_admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "7", 10);

    // Calculate date range
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    try {
        const metrics = await getDailyMetrics(startStr, endStr);

        // Pivot data for easier frontend consumption
        // { date: "2023-10-27", dau: 100, tasks: 50, ... }
        const pivoted: Record<string, any> = {};

        metrics.forEach(m => {
            if (!pivoted[m.day]) pivoted[m.day] = { date: m.day };
            pivoted[m.day][m.metric_key] = Number(m.value);
        });

        const sortedData = Object.values(pivoted).sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            range: { start: startStr, end: endStr },
            data: sortedData
        });
    } catch (e) {
        console.error("Failed to fetch admin stats", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
