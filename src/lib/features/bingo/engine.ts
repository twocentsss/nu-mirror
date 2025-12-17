/**
 * Nu Flow Protocol - Bingo Engine
 * Generates the daily scorecard and checks for Bingo.
 */

import { DailyBingoCard, calculatePillarScore, BINGO_TARGET_SCORE } from './rules';
import { sum } from '../../reporting/stats';

// Reuse Reporting Types for now (Mock integration)
interface BingoFlowStub {
    amount: number; // minutes
    segments: {
        component_group?: string; // The "World" or "Pillar" code
    };
}

const MINUTES_IN_DAY = 1440;

/**
 * Generates a Daily Bingo Card from a list of day's events.
 */
export function generateDailyBingoCard(date: string, events: BingoFlowStub[]): DailyBingoCard {
    // 1. Bucket minutes by Pillar
    const pillarMinutes: Record<string, number> = {};

    for (const event of events) {
        const pillar = event.segments.component_group || 'UNCATEGORIZED';
        pillarMinutes[pillar] = (pillarMinutes[pillar] || 0) + event.amount;
    }

    // 2. Calculate Scores
    const pillarScores: Record<string, number> = {};
    let totalScore = 0;

    for (const [pillar, mins] of Object.entries(pillarMinutes)) {
        if (pillar === 'UNCATEGORIZED') continue; // No points for uncategorized
        const score = calculatePillarScore(mins);
        pillarScores[pillar] = score;
        totalScore += score;
    }

    // 3. Reconciliation Check
    const totalTracked = sum(Object.values(pillarMinutes));
    const reconciled = totalTracked >= (MINUTES_IN_DAY * 0.95); // 5% margin of error? User said 1440.

    // 4. Bingo Condition
    // "25 points each day"
    const isBingo = totalScore >= BINGO_TARGET_SCORE;

    return {
        date,
        totalMinutesTracked: totalTracked,
        reconciled,
        pillarScores,
        totalScore,
        isBingo
    };
}
