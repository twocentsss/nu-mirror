import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { checkIsSuperAdmin } from "@/lib/admin/adminStore";
import { deleteAllHowToEntries, upsertHowToEntry } from "@/lib/howto/howtoStore";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isAdmin = await checkIsSuperAdmin(session.user.email);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  await upsertHowToEntry({
    title: body.title,
    prerequisite: body.prerequisite ?? null,
    use_case: body.use_case ?? null,
    share_link: body.share_link ?? null,
    ai_prompt: body.ai_prompt ?? null,
    ai_response: body.ai_response ?? null,
    screenshots: body.screenshots ?? [],
    screenshots_meta: body.screenshots_meta ?? [],
    use_cases: body.use_cases ?? [],
    admin_steps: body.admin_steps ?? [],
    templates: body.templates ?? [],
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isAdmin = await checkIsSuperAdmin(session.user.email);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await deleteAllHowToEntries();
  return NextResponse.json({ ok: true });
}
