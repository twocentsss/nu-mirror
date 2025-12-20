import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { initAccountSpreadsheet } from "@/lib/google/accountSpreadsheet";

/**
 * Manually initialize or repair the user's account spreadsheet.
 * Useful if the automated sign-in event failed or if scopes were recently updated.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string | undefined;
  const refreshToken = (session as any).refreshToken as string | undefined;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ error: "Missing Google OAuth tokens. Sign out/in again." }, { status: 401 });
  }

  try {
    const result = await initAccountSpreadsheet({
      accessToken,
      refreshToken,
      userEmail: session.user.email,
    });

    return NextResponse.json({
      ok: true,
      message: "Account spreadsheet initialized successfully.",
      ...result
    });
  } catch (err: any) {
    console.error("[AccountInit] Failed:", err);
    return NextResponse.json({
      ok: false,
      error: err.message,
      code: err.code || err.status
    }, { status: 500 });
  }
}
