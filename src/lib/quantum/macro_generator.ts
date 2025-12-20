export type GeneratedItem = {
    id: string;
    type: "TARGET" | "PROJECT" | "TASK"; // Target = Goal (LF-Level)
    title: string;
    lf_id: number;
    parent_id?: string;
    confidence: number;
};

/**
 * Macro Generator (Simulated)
 * Takes a raw "rant" and extracts structured hierarchy.
 * In a real system, this calls an LLM.
 */
export async function generateMacroState(text: string): Promise<GeneratedItem[]> {
    // Simulate thinking delay
    await new Promise(r => setTimeout(r, 1500));

    const items: GeneratedItem[] = [];
    const keywords = text.toLowerCase();

    // Heuristics for demo
    if (keywords.includes("fit") || keywords.includes("health") || keywords.includes("run")) {
        const goalId = `goal-${Date.now()}-1`;
        items.push({
            id: goalId,
            type: "TARGET",
            title: "Achieve Peak Physical Condition",
            lf_id: 2, // Self
            confidence: 0.9
        });
        items.push({
            id: `proj-${Date.now()}-1`,
            type: "PROJECT",
            title: "Marathon Training Program",
            lf_id: 2,
            parent_id: goalId,
            confidence: 0.85
        });
        items.push({
            id: `task-${Date.now()}-1`,
            type: "TASK",
            title: "Buy running shoes",
            lf_id: 2,
            parent_id: `proj-${Date.now()}-1`,
            confidence: 0.95
        });
    }

    if (keywords.includes("startup") || keywords.includes("business") || keywords.includes("launch")) {
        const goalId = `goal-${Date.now()}-2`;
        items.push({
            id: goalId,
            type: "TARGET",
            title: "Launch SaaS Product",
            lf_id: 5, // Level Up
            confidence: 0.9
        });
        items.push({
            id: `proj-${Date.now()}-2`,
            type: "PROJECT",
            title: "MVP Development",
            lf_id: 5,
            parent_id: goalId,
            confidence: 0.85
        });
        items.push({
            id: `task-${Date.now()}-2`,
            type: "TASK",
            title: "Design Database Schema",
            lf_id: 5,
            parent_id: `proj-${Date.now()}-2`,
            confidence: 0.95
        });
    }

    // Default catch-all if no keywords match, just to show something
    if (items.length === 0) {
        items.push({
            id: `task-${Date.now()}-gen`,
            type: "TASK",
            title: "Process Rant: " + text.slice(0, 20) + "...",
            lf_id: 9, // Chaos
            confidence: 0.5
        });
    }

    return items;
}
