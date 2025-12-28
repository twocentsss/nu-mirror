import { appendRow } from '../../google/sheetStore';
import { SHEET_TABS } from '../../google/schema';
import { StoryInstance } from '../../core/types';
import { ulid } from 'ulid';
import { getFlowEvents } from '../ledger/accounting';
import { openAiResponses } from '../../llm/openai';

export type LLMConfig = {
    apiKey: string;
    model: string;
    baseURL?: string;
    siteUrl?: string;
    siteName?: string;
};

/**
 * Generates a "Replay" story for a given date.
 * Fetches FlowEvents and uses an LLM to generate a narrative.
 */
export async function generateDailyReplay(
    date: string,
    llmConfig?: LLMConfig
): Promise<StoryInstance> {
    // 1. Fetch Events
    const events = await getFlowEvents(`${date}T00:00:00.000Z`, `${date}T23:59:59.999Z`);

    if (events.length === 0) {
        return {
            id: ulid(),
            date,
            narrative: "The day passed in silence. No events were recorded in the Flow Ledger.",
            type: 'daily_replay',
            model_used: 'system-default'
        };
    }

    // 2. Construct Prompt
    const eventSummary = events.map(e => `- [${e.timestamp.split('T')[1].slice(0, 5)}] ${e.description} (${e.amount} ${e.unit})`).join('\n');

    const prompt = `You are the Chronicler of the Alfred Flow.
Based on the following ledger of today's events, write a short, engaging narrative summary (max 3 paragraphs) in the second person ("You").
Focus on the flow of energy and value.
    
Date: ${date}
    
Events:
${eventSummary}
    
Narrative:`;

    // 3. Call LLM (Real or Mock)
    let narrative = "";
    let modelUsed = "mock-fallback";

    if (llmConfig && llmConfig.apiKey) {
        try {
            console.log(`[Storyteller] Generating story with model ${llmConfig.model}...`);
            const response = await openAiResponses({
                apiKey: llmConfig.apiKey,
                model: llmConfig.model,
                baseURL: llmConfig.baseURL,
                siteUrl: llmConfig.siteUrl,
                siteName: llmConfig.siteName,
                input: prompt
            });
            narrative = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
            modelUsed = llmConfig.model;
        } catch (error) {
            console.error("[Storyteller] LLM Error:", error);
            narrative = `(LLM Error) On ${date}, events happened, but the Chronicler stumbled.`;
        }
    } else {
        // Fallback Mock
        narrative = `[MOCK] The hero had ${events.length} events today. Connect a real LLM to hear the full story.\n\nEvents:\n${eventSummary}`;
    }

    // 4. Save Story
    const story: StoryInstance = {
        id: ulid(),
        date,
        narrative,
        type: 'daily_replay',
        model_used: modelUsed
    };

    await appendRow({
        tab: SHEET_TABS.STORY_INSTANCES,
        values: [
            story.id,
            story.date,
            story.narrative,
            story.type,
            story.model_used
        ]
    });

    return story;
}
