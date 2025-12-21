import { NextResponse } from "next/server";
import { loadLatestHowToEntry } from "@/lib/howto/howtoStore";

export async function GET() {
  const entry = await loadLatestHowToEntry();
  if (!entry) {
    return NextResponse.json({ entry: null });
  }
  return NextResponse.json({ entry });
}
