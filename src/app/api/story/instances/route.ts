import { NextRequest, NextResponse } from "next/server";
import { StoryService } from "@/lib/story/storyService";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const service = new StoryService();
        const stories = await service.getRecentStories();
        return NextResponse.json({ success: true, stories });
    } catch (error: any) {
        console.error("Fetch Stories Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
