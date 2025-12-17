/**
 * Nu Flow Protocol - Quantum Sprint Planner
 * "Quantum Suggestion Logic" to suggest optimal tasks for a sprint.
 */

import { ActivityStub, Backlog, SprintSuggestion } from './types';

// Constants for Capacity (14 days * 1440 mins * efficiency)
const DEFAULT_SPRINT_DAYS = 14;
const DAILY_CAPACITY_MINS = 300; // Realistic focus time per day (5 hours)
const TOTAL_CAPACITY = DEFAULT_SPRINT_DAYS * DAILY_CAPACITY_MINS;

/**
 * Suggests a set of activities for a sprint based on "Quantum" heuristics.
 * 1. Filter: Must be ready (Score > 0.5)
 * 2. Weigh: High Value > Low Value
 * 3. Balance: Don't just pick "Grind" tasks.
 * 4. Constraint: Fit within capacity.
 */
export function generateSprintSuggestion(backlog: Backlog): SprintSuggestion {
    const candidates = backlog.activities.filter(a =>
        a.intent.planning > 0.5 &&
        (a.plan?.status === 'backlog' || !a.plan?.status)
    );

    // Sort by a "Quantum Score" (Value * Readiness * Random Noise for diversity)
    const scoredCandidates = candidates.map(a => ({
        activity: a,
        // Add 10% randomness to break deterministic "Same old tasks" loops
        score: (a.score?.value || 0.5) * (a.score?.readiness || 0.5) * (0.9 + Math.random() * 0.2)
    })).sort((a, b) => b.score - a.score);

    const selectedIds: string[] = [];
    let currentLoad = 0;

    // Greedy filling with Logic
    for (const { activity } of scoredCandidates) {
        const effort = activity.plan?.effort_est || 30; // Default 30 min

        if (currentLoad + effort <= TOTAL_CAPACITY) {
            selectedIds.push(activity.id);
            currentLoad += effort;
        }

        if (currentLoad >= TOTAL_CAPACITY) break;
    }

    // Generate Reasoning
    const utilization = Math.round((currentLoad / TOTAL_CAPACITY) * 100);
    const reasoning = `Selected top ${selectedIds.length} tasks based on readiness and value. Capacity utilization: ${utilization}%. High focus on backlog clearance.`;

    return {
        reasoning,
        suggestedActivityIds: selectedIds,
        projectedLoad: currentLoad,
        confidence: 0.85
    };
}
