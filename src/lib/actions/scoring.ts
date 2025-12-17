/**
 * Nu Flow Protocol - Scoring Actions
 * Actions to score tasks on demand using the Liquid Ledger accounting engine.
 */

import { calculateTaskScore, ScoringParams } from '../core/scoring';
import { mapTaskToScoringParams } from '../core/mapper';
import { Task } from '../core/types';

// Flexible input for the action (partial task)
type ScoringInput = {
    id: string;
    title: string;
    status?: string;
    duration_min?: number;
    lf?: number;
};

/**
 * Scores a single task via the Mapper and returns the result.
 * This simulates a "Liquid Ledger" journal entry calculation.
 */
export async function scoreSingleTask(task: ScoringInput): Promise<{ sps: number; aps: number; bps: number; accountCode: string }> {
    console.log(`[Scoring] Calculation started for task: "${task.title}" (${task.id})...`);

    // 1. Map Task -> Scoring Params & Account
    const paramsWithAccount = mapTaskToScoringParams(task);
    const { accountCode, ...scoringParams } = paramsWithAccount;

    // 2. Calculate the Score (Value)
    const score = calculateTaskScore(scoringParams);

    // 3. Log the "Journal Entry"
    console.log(`[Ledger] ---------------------------------------------------`);
    console.log(`[Ledger] JOURNAL ENTRY (Draft)`);
    console.log(`[Ledger] Account: ${accountCode}`);
    console.log(`[Ledger] Credit:  Equity.Self.Productivity`);
    console.log(`[Ledger] Value:   SPS ${score.sps.toFixed(3)} units`);
    console.log(`[Ledger] ---------------------------------------------------`);

    return { ...score, accountCode };
}

/**
 * Scores a list of tasks efficiently.
 */
export async function scoreAllTasks(tasks: ScoringInput[]) {
    console.log(`[Scoring] Bulk rescore started for ${tasks.length} tasks...`);

    const results = [];
    for (const task of tasks) {
        const score = await scoreSingleTask(task);
        results.push({ id: task.id, ...score });
    }

    console.log(`[Scoring] Bulk rescore completed.`);
    return results;
}
