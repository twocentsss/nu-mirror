import { eventClient } from "@/lib/events/client";
import { Event, EvtType } from "@/lib/events/types";

// --- Types ---

export interface LedgerDelta {
    asset: 'Power' | 'Legitimacy' | 'Trust' | 'Order' | 'Mercy' | 'Foresight';
    amount: number;
    reason: string;
}

export interface StoryContext {
    period: string;
    net_worth: Record<string, number>;
    deltas: LedgerDelta[];
    hero_moments: string[];
    tragedies: string[];
}

// --- Service ---

export class StoryService {
    /**
     * Generates a narrative context for a given period.
     * Uses the Event Log (Postgres) as the source of truth.
     */
    async generateContext(params: {
        userId: string;
        periodStart?: Date;
        periodEnd?: Date;
        taskId?: string;
        taskIds?: string[];
        query?: string;
    }): Promise<StoryContext> {

        // 1. Fetch "Ledger Posted" Events
        const events = await eventClient.getEvents({
            type: 'ledger.posted' as EvtType,
            limit: 1000, // Reasonable cap for a period
            after: params.periodStart?.toISOString(),
            before: params.periodEnd?.toISOString(),
            tenantId: 'default' // TODO: Pass from context
        });

        // Filter by Task/Query if needed
        const filteredEvents = events.filter(e => {
            const body = e.body as any; // { amount, unit, bucket, memo, refId }

            // Feature Mode: Task ID Filter (Single)
            if (params.taskId) {
                const matchesRef = body.refId === params.taskId;
                const matchesMemo = (body.memo || '').includes(params.taskId);
                if (!matchesRef && !matchesMemo) return false;
            }

            // Audit Mode: Task IDs Filter (Multiple)
            if (params.taskIds && params.taskIds.length > 0) {
                const matchesRef = params.taskIds.includes(body.refId);
                if (!matchesRef) return false;
            }

            // Feature Mode: Query Filter
            if (params.query) {
                const q = params.query.toLowerCase();
                if (!(body.memo || '').toLowerCase().includes(q)) return false;
            }

            return true;
        });

        // 2. The Ledger Engine (Narrative Transformation)
        const deltas: LedgerDelta[] = [];
        const net_worth: Record<string, number> = {
            Power: 0, Legitimacy: 0, Trust: 0, Order: 0, Mercy: 0, Foresight: 0
        };
        const hero_moments: string[] = [];
        const tragedies: string[] = [];

        for (const e of filteredEvents) {
            const delta = this.transformToNarrative(e);

            if (delta) {
                deltas.push(delta);

                // Initialize if not present
                if (!net_worth[delta.asset]) net_worth[delta.asset] = 0;

                net_worth[delta.asset] += delta.amount;

                // Detect Beats
                if (delta.asset === 'Power' && delta.amount > 5) {
                    hero_moments.push(`${delta.reason} (+${delta.amount} Power)`);
                }
                if (delta.asset === 'Order' && delta.amount < -5) {
                    tragedies.push(`${delta.reason} (${delta.amount} Order collapse)`);
                }
            }
        }

        const pStart = params.periodStart ? params.periodStart.toISOString().split('T')[0] : 'Start';
        const pEnd = params.periodEnd ? params.periodEnd.toISOString().split('T')[0] : 'End';

        return {
            period: `${pStart} to ${pEnd}`,
            net_worth,
            deltas,
            hero_moments,
            tragedies
        };
    }

    /**
     * Generates a story using the unified LLM API based on the Ledger Context.
     */
    async narrateEvents(context: StoryContext, creative?: {
        framework: string;
        character?: string;
        setting?: string;
        tropes?: string[];
    }, cookie?: string): Promise<string> {
        let frameworkPrompt = "";

        switch (creative?.framework) {
            case 'pixar':
                frameworkPrompt = `
                Use Pixar's Story Framework:
                1. Once upon a time there was [Character]...
                2. Every day, [Routine]...
                3. One day [Inciting Event]...
                4. Because of that, [Consequence]...
                5. Because of that, [Consequence]...
                6. Until finally [Climax]...
                7. And ever since then [Resolution].
                `;
                break;
            case 'hero':
                frameworkPrompt = `
                Use the Hero's Journey:
                Call to Adventure -> Refusal -> Mentor -> Threshold -> Abyss -> Transformation -> Return.
                Position the user/character as the Hero.
                `;
                break;
            case 'freytag':
                frameworkPrompt = `
                Use Freytag's Pyramid:
                Exposition -> Rising Action -> Climax (The turning point) -> Falling Action -> Denouement.
                Focus on the emotional arc.
                `;
                break;
            case 'golden':
                frameworkPrompt = `
                Use the Golden Circle:
                WHY (Purpose) -> HOW (Method) -> WHAT (Result).
                Start with proper belief and end with the product/result.
                `;
                break;
            case 'hso':
                frameworkPrompt = `
                Use Hook, Story, Offer (HSO):
                Hook: Grab attention instantly.
                Story: Build connection/trust.
                Offer: The clear next step/realization.
                `;
                break;
            case '5c':
                frameworkPrompt = "Ensure Clarity, Connection, Character, Conflict, and Closure.";
                break;
            default:
                frameworkPrompt = "Use the 'Storytelling as Accounting' framework.";
        }

        const prompt = `
    Role: You are a professional storyteller.
    
    Task: Convert the reported context into a narrative.
    
    ${creative ? `
    -- Creative Mode --
    Framework: ${creative.framework}
    Character: ${creative.character || "The User"}
    Setting: ${creative.setting || "The Context"}
    Tropes: ${creative.tropes?.join(', ') || "None"}
    ` : ''}

    ${frameworkPrompt}
    
    Context (The Accounting of the Soul):
    - Power (Velocity/Impact): ${context.net_worth.Power}
    - Order (Stability): ${context.net_worth.Order}
    - Trust (Relations): ${context.net_worth.Trust}
    - Mercy (Absorption of Chaos): ${context.net_worth.Mercy}
    - Foresight (Vision): ${context.net_worth.Foresight}
    
    Key Beats:
    - Heroic Moments: ${context.hero_moments.join(', ') || "None"}
    - Tragedies (Chaos): ${context.tragedies.join(', ') || "None"}
    
    Instructions:
    - If Power is high but Order is low, describe a "Pyrrhic Victory".
    - If Mercy is negative, describe the "Cost of Survival".
    - Do not mention the numbers directly. weave them into the narrative.
    - Keep it under 200 words unless the framework requires more structure.
    `;

        try {
            const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
            const res = await fetch(`${baseUrl}/api/llm/complete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "cookie": cookie || ""
                },
                body: JSON.stringify({
                    prompt,
                    model: "gemini-flash-latest", // Default, will use user's preferred AI
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `LLM API returned ${res.status}`);
            }

            const data = await res.json();
            return data.out ?? "The ledger was silent.";
        } catch (e) {
            console.error("LLM Generation failed", e);
            return "The chronicler could not read the stars (LLM Error).";
        }
    }

    /**
     * Persists a generated story instance.
     * Emits a 'story.generated' event.
     */
    async saveStoryInstance(narrative: string, type: string) {
        const id = crypto.randomUUID();

        await eventClient.append([{
            env: {
                id,
                ts: Date.now(),
                src: 'story-service',
                ver: '1',
                kind: 'evt',
                trace: { traceId: '', spanId: '' },
                auth: { tenantId: 'default', actorId: 'system' }
            },
            type: 'story.generated' as EvtType,
            agg: { kind: 'story', id },
            seq: 1,
            body: {
                narrative,
                type,
                model: 'gemini'
            }
        }]);

        return id;
    }

    /**
     * Fetches the 50 most recent stories.
     */
    async getRecentStories(): Promise<any[]> {
        const events = await eventClient.getEvents({
            type: 'story.generated' as EvtType,
            limit: 50,
            tenantId: 'default'
        });

        return events.map(e => ({
            id: e.env.id,
            date: new Date(e.env.ts).toISOString(),
            narrative: e.body.narrative,
            type: e.body.type,
            model: e.body.model
        })).reverse();
    }

    // --- Helpers ---

    /**
     * The Core Logic: Mapping Physics (Flow) to Metaphysics (Story)
     * expecting `ledger.posted` body shape.
     */
    private transformToNarrative(e: Event): LedgerDelta | null {
        const body = e.body as any; // { amount, unit, bucket, memo }

        // Map ledger buckets/accounts to Narrative Assets
        // Note: This mapping depends on how the app uses 'bucket'/'account'

        // 1. POWER (High Energy Work)
        if (body.bucket === 'work' && body.unit === 'energy' && body.amount < -20) {
            return { asset: 'Power', amount: Math.abs(Math.round(body.amount / 10)), reason: `High intensity work: ${body.memo}` };
        }

        // 2. FORESIGHT (Deep Focus on Self/Admin)
        if (body.unit === 'focus' && body.amount > 0 && (body.bucket === 'admin' || body.bucket === 'self')) {
            return { asset: 'Foresight', amount: Math.round(body.amount), reason: `Strategic thinking: ${body.memo}` };
        }

        // 3. TRUST (Time with Family/Social)
        if (body.unit === 'time' && (body.bucket === 'family' || body.bucket === 'social')) {
            return { asset: 'Trust', amount: Math.round(Math.abs(body.amount) / 10), reason: `Bonding time: ${body.memo}` };
        }

        // 4. MERCY (Chaos Drain)
        if (body.bucket === 'chaos') {
            return { asset: 'Mercy', amount: -5, reason: `Absorbing chaos: ${body.memo}` };
        }

        // 5. ORDER (Focus Scatter)
        if (body.unit === 'focus' && body.amount < 0) {
            return { asset: 'Order', amount: Math.round(body.amount), reason: `Distraction/Entropy: ${body.memo}` };
        }

        return null;
    }
}
