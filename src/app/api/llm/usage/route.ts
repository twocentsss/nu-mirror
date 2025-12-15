import { NextRequest } from "next/server";
import { getLlmUsageToday } from "@/lib/llm/logging";

export async function GET(req: NextRequest) {
    const usage = await getLlmUsageToday();
    return Response.json(usage);
}
