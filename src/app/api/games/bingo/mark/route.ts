import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { eventClient } from "@/lib/events/client";
import { id } from "@/lib/cogos/id";
import { resolveStorageUrl } from "@/lib/config/storage";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const { squareId, boardId } = body;

    if (!squareId || !boardId) {
        return NextResponse.json({ error: "squareId and boardId required" }, { status: 400 });
    }

    const storageUrl = await resolveStorageUrl({
        userEmail: session.user.email,
        accessToken: (session as any).accessToken,
        refreshToken: (session as any).refreshToken
    }) || undefined;

    const event = {
        env: { id: id("evt"), ts: Date.now(), src: 'api', ver: '1', kind: 'evt' as const, trace: { traceId: id("tr"), spanId: id("sp") } },
        type: 'game.bingo_marked' as const,
        agg: { kind: 'game', id: boardId },
        seq: Date.now(), // Real apps use monotonic seq
        body: { squareId, boardId, actor: session.user.email }
    };

    await eventClient.append([event], { storageUrl });

    return NextResponse.json({ ok: true });
}
