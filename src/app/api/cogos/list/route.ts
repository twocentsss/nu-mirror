import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { listByUser } from "@/lib/sheets/sheetsDb";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const episodes = await listByUser("Episodes", userId);
  const tasks = await listByUser("Tasks", userId);
  const worklogs = await listByUser("Worklogs", userId);
  const decisions = await listByUser("DecisionLogs", userId);
  const cases = await listByUser("CaseBriefs", userId);

  return NextResponse.json({
    episodes,
    tasks,
    worklogs,
    decisions,
    cases,
  });
}
