/**
 * Nu Flow Protocol - Mapper
 * Transforms raw Task entities into deterministically calculated Scoring Parameters.
 * Bridges the "Activity World" (Tasks) with the "Accounting World" (Scores).
 */

import { ScoringParams } from "./scoring";
import { resolveAccount } from "./accounting";

// Flexible input type to handle both strict Task and UI TaskRecord
type InputTask = {
    id?: string;
    title?: string;
    status?: string | "backlog" | "todo" | "doing" | "done" | "intake";
    duration_min?: number;
    lf?: number;
    // ... other fields ignored for scoring
};

export function mapTaskToScoringParams(task: InputTask): ScoringParams & { accountCode: string } {
    // 1. Resolve Account Profile (Auditing)
    const account = resolveAccount(task.lf);

    // 2. Determine Completion Percentage (CP)
    let cp = 0.0;
    const s = (task.status || "todo").toLowerCase();

    if (s === "done" || s === "completed") {
        cp = 1.0;
    } else if (s === "doing" || s === "in_progress" || s === "planned") {
        cp = 0.0; // In "Strict" accounting, value is only realized upon completion.
        // However, for "Progress" tracking, we might want fractional. 
        // Liquid Ledger Manifesto: "Trust Loop" -> value realized when done.
        // We will stick to 0.0 for now. Only DONE tasks generate valid scores.
        cp = 0.0;
    } else {
        cp = 0.0;
    }

    // 2b. If we want partial credit for 'doing', uncomment below:
    // if (s === "doing") cp = 0.5;

    // 3. Calculate Task Weight (TW)
    // Formula: (Duration / 10) * AssetMultiplier
    // E.g. 60m Deep Work (1.3x) = 6.0 * 1.3 = 7.8
    // E.g. 30m Chores (0.6x) = 3.0 * 0.6 = 1.8
    const baseBlocks = (task.duration_min || 15) / 10;
    const tw = Math.min(baseBlocks * account.multiplier, 15); // Cap at 15 to prevent exploits

    // 4. Other Factors
    const sm = 1.0; // Baseline struggle
    const esf = 1.0; // Baseline effort

    return {
        tw,
        cp,
        sm,
        esf,
        qm: 1.0,
        sf: 1.0,
        bp: 0.0,
        accountCode: account.code // Pass-through for logging
    };
}
