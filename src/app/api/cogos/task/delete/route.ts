import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { resolveStorageUrl } from "@/lib/config/storage";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string | undefined;
  const refreshToken = (session as any).refreshToken as string | undefined;
  if (!accessToken && !refreshToken) {
    return NextResponse.json(
      { error: "Missing Google OAuth tokens. Sign out/in again." },
      { status: 401 },
    );
  }

  const body = await req.json();
  const taskId: string = body.id;
  if (!taskId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  // 1. Resolve Resources
  const storageUrl = (await resolveStorageUrl({
    userEmail: session.user.email,
    accessToken,
    refreshToken
  })) ?? process.env.DATABASE_URL ?? null;

  // 2. Delete from Postgres if exists
  if (storageUrl) {
    try {
      const { getSqlClient, getTenantSchema, ensureTenantSchema } = await import("@/lib/events/client");
      const sql = getSqlClient(storageUrl);
      const schema = getTenantSchema(session.user.email);
      try {
        await ensureTenantSchema(sql, schema);
      } catch (err) {
        console.warn("[DeleteRoute] Unable to ensure tenant schema", err);
      }

      const tenantId = session.user.email;
      const schemasToClean = new Set<string>([schema]);
      if (storageUrl === process.env.DATABASE_URL) {
        schemasToClean.add("nu");
      }

      for (const targetSchema of schemasToClean) {
        try {
          await sql.unsafe(
            `DELETE FROM ${targetSchema}.projection_tasks WHERE task_id = $1 AND tenant_id = $2`,
            [taskId, tenantId],
          );
        } catch (err) {
          console.warn(`[DeleteRoute] Postgres delete failed for ${targetSchema}`, err);
        }
      }
    } catch (err) {
      console.warn("[DeleteRoute] Postgres deletion failed", err);
    }
  }

  return NextResponse.json({ ok: true });
}
