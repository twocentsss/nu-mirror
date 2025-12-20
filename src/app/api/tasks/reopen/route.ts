import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/authOptions';
import { eventClient } from "@/lib/events/client";
import { taskProjector } from "@/lib/events/projector/taskProjector";
import { id } from "@/lib/cogos/id";
import { getAccountSpreadsheetId } from "@/lib/google/accountSpreadsheet";
import { resolveStorageUrl } from "@/lib/config/storage";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const { taskId } = await request.json();

        if (!taskId) {
            return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
        }

        const accessToken = (session as any).accessToken as string | undefined;
        const refreshToken = (session as any).refreshToken as string | undefined;

        // Resolve spreadsheet for Phase 1 Projection
        let spreadsheetId: string | undefined = process.env.SHEETS_ID;
        if (!spreadsheetId) {
            const account = await getAccountSpreadsheetId({
                accessToken,
                refreshToken,
                userEmail: session.user.email,
            });
            spreadsheetId = account.spreadsheetId;
        }

        const events = [{
            env: { id: id("evt"), ts: Date.now(), src: 'api', ver: '1', kind: 'evt', trace: { traceId: id("tr"), spanId: id("sp") } },
            type: 'task.restored' as const,
            agg: { kind: 'task', id: taskId },
            seq: 1,
            body: {} // Projector handles status set to 'in_progress' implicitly
        }];

        // Resolve Storage (BYODB)
        const storageUrl = await resolveStorageUrl({
            userEmail: session.user.email,
            accessToken,
            refreshToken
        }) || undefined;

        await eventClient.append(events as any, { storageUrl });
        await taskProjector.process(events as any, { spreadsheetId, accessToken, refreshToken });

        return NextResponse.json({ success: true, taskId });
    } catch (error) {
        console.error('Error reopening task:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
