/**
 * Nu Flow Protocol - Bingo Logic
 * "25 points each day you try to complete the task across 9 or 10 LFS."
 */

export const BINGO_TARGET_SCORE = 25;
export const MAX_SCORE_PER_PILLAR = 10;
export const PILLARS_COUNT = 9; // Core, Self, Circle, etc.

// Daily Report Card
export interface DailyBingoCard {
    date: string; // YYYY-MM-DD

    // 1440m Reconciliation
    totalMinutesTracked: number;
    reconciled: boolean; // Must extend to 1440 (allows for "Uncategorized" bucket)

    // The Strings
    pillarScores: Record<string, number>; // "CORE": 5, "GRIND": 8

    // The Score
    totalScore: number;
    isBingo: boolean; // Did we hit the target?
}

/**
 * Calculates the score for a single pillar based on minutes.
 * Simple heuristic: 1 point per 10 mins, capped at 10 points?
 * logic: "Ten marks score across all LFS".
 * Let's assume 1 point per hour of quality flow, max 10.
 */
export function calculatePillarScore(minutes: number): number {
    if (minutes <= 0) return 0;
    // Example: 10 points = 100 minutes (1 hr 40 min)
    // Linear scale: 1 point per 10 mins
    const raw = minutes / 10;
    return Math.min(Math.floor(raw), MAX_SCORE_PER_PILLAR);
}
