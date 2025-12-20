import { NextRequest, NextResponse } from "next/server";
import { StoryService } from "@/lib/story/storyService";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            mode = 'period', // 'period' | 'feature' | 'creative'
            period = 'day',
            date = new Date().toISOString(),
            taskId,
            taskIds, // [NEW]
            query,
            creativeParams // [NEW]
        } = body;

        // Determine Date Range (Default to "Day" if mode is period)
        const d = new Date(date);
        let start: Date | undefined = new Date(d);
        let end: Date | undefined = new Date(d);

        if (mode === 'period') {
            if (period === 'day') {
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
            } else if (period === 'sprint') {
                start.setDate(d.getDate() - 14);
            }
        } else {
            // Feature/Creative/Audit Mode: Default to "All Time"
            start = undefined;
            end = undefined;
        }

        const service = new StoryService();

        // 1. Calculate Context (The Ledger Audit)
        // Skip context gen if mode is purely creative without audit? 
        // Spec says Creative Mode "No event fetch required", so we can mock empty context or skip.

        let context: any = { net_worth: { Power: 0, Order: 0, Trust: 0, Mercy: 0, Foresight: 0 }, hero_moments: [], tragedies: [] };

        if (mode !== 'creative') {
            context = await service.generateContext({
                userId: 'default',
                periodStart: start,
                periodEnd: end,
                taskId,
                taskIds,
                query
            });
        }

        // 2. Generate Narrative (The Storyteller)
        const cookie = req.headers.get("cookie") || "";
        const story = await service.narrateEvents(context, creativeParams, cookie);

        // 3. Persist
        let type = period;
        if (mode === 'feature') type = taskId || query || 'feature';
        if (mode === 'creative') type = 'creative';

        const id = await service.saveStoryInstance(story, type);

        return NextResponse.json({
            success: true,
            id,
            story,
            context
        });

    } catch (error: any) {
        console.error("Story Gen Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
