import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { setKeyPreference } from "@/lib/llm/keyStore";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { keyId } = body;

  if (!keyId) {
    return NextResponse.json({ error: "keyId is required" }, { status: 400 });
  }

  const res = await setKeyPreference({
    keyId,
  });

  if (!res.ok) {
    return NextResponse.json({ error: res.error ?? "Failed to set preference" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
