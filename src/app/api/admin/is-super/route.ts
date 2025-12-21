import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { checkIsSuperAdmin } from "@/lib/admin/adminStore";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ isAdmin: false });
  }
  const isAdmin = await checkIsSuperAdmin(session.user.email);
  return NextResponse.json({ isAdmin });
}
