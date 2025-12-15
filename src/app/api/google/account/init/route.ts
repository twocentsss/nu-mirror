import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { initAccountSpreadsheet } from "@/lib/google/accountSpreadsheet";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string | undefined;
  const refreshToken = (session as any).refreshToken as string | undefined;
  if (!accessToken && !refreshToken) {
    return NextResponse.json(
      {
        error: "Missing Google OAuth tokens in session. Sign out and sign in again.",
      },
      { status: 401 },
    );
  }

  const result = await initAccountSpreadsheet({
    accessToken,
    refreshToken,
    userEmail: session.user.email,
  });

  return NextResponse.json(result);
}
