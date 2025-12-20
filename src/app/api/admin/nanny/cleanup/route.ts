import { NextResponse } from "next/server";
import { runNannyCleanup } from "@/lib/scaling/nanny";

/**
 * Trigger for the Nanny cleanup process.
 * In production, this should be called by a CRON job (e.g., Vercel Cron).
 */
export async function GET(req: Request) {
    // Secret check for production
    const authHeader = req.headers.get('authorization');
    if (process.env.NODE_ENV === 'production') {
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response('Unauthorized', { status: 401 });
        }
    }

    try {
        await runNannyCleanup();
        return NextResponse.json({ ok: true, message: "Nanny cleanup executed" });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
}
