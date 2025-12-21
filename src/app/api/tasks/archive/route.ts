
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/authOptions';
import { eventClient } from "@/lib/events/client";
import { taskProjector } from "@/lib/events/projector/taskProjector";
import { id } from "@/lib/cogos/id";
import { resolveStorageUrl } from "@/lib/config/storage";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Optional: enforce auth, or allow system for now if that's the design
    const userId = session?.user?.email || 'system';

    try {
        const { taskId } = await request.json();

        if (!taskId) {
            return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
        }

        const accessToken = (session as any).accessToken as string | undefined;
        const refreshToken = (session as any).refreshToken as string | undefined;

        const events = [{
            env: { id: id("evt"), ts: Date.now(), src: 'api', ver: '1', kind: 'evt', trace: { traceId: id("tr"), spanId: id("sp") } },
            type: 'task.archived' as const,
            agg: { kind: 'task', id: taskId },
            seq: 1,
            body: {} // No body needed for archive (explicit intent)
        }];

        // Resolve Storage (BYODB)
        const storageUrl = await resolveStorageUrl({
            userEmail: session.user.email,
            accessToken,
            refreshToken
        }) || undefined;

        await eventClient.append(events as any, { storageUrl });
        await taskProjector.process(events as any, { storageUrl });

        return NextResponse.json({ success: true, taskId });
    } catch (error) {
        console.error('Error archiving task:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
