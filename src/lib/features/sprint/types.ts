/**
 * Nu Flow Protocol - Sprint Planning Types
 * Defines the Sprint container and the Backlog pool.
 */

// Placeholder for the full Activity interface (defined in docs)
export interface ActivityStub {
    id: string;
    title: string;
    intent: {
        planning: number; // 0-1
    };
    plan?: {
        effort_est: number; // minutes
        status: 'backlog' | 'sprint' | 'done';
    };
    score?: {
        readiness: number; // 0-1, how clear is this task?
        value: number;     // 0-1, how important?
    };
    cohorts: string[]; // e.g. ["Household", "Work"]
}

export interface Sprint {
    id: string; // ULID
    startDate: string; // ISO
    endDate: string;   // ISO (usually +2 weeks)
    status: 'planning' | 'active' | 'completed';

    // The selected activities for this sprint
    activityIds: string[];

    // Capacity Metadata
    totalMinutesCommitted: number;
    totalMinutesAvailable: number; // Based on 1440 * 14 * efficiency
}

export interface Backlog {
    id: string;
    activities: ActivityStub[];
}

// Quantum Suggestion Result
export interface SprintSuggestion {
    reasoning: string; // "Balanced Grind (60%) with needed Recovery (20%)"
    suggestedActivityIds: string[];
    projectedLoad: number; // minutes
    confidence: number;
}
