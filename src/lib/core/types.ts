/**
 * Nu Flow Protocol - Core Data Types
 * Defines the 12-Dimensional Grammar, 9 Life Focus Pillars, and Unified Assertion Model.
 */

// --- 1. Life Focus (The 9 Pillars) ---

export type LifeFocusId =
    | 'CORE'      // 1. Core (Identity, Faith)
    | 'SELF'      // 2. Self (Health, Systems, Finance)
    | 'CIRCLE'    // 3. Circle (Relationships, Family)
    | 'GRIND'     // 4. Grind (Work, Responsibilities)
    | 'LEVEL_UP'  // 5. Level Up (Growth, Skills, Nu)
    | 'IMPACT'    // 6. Impact (Community, Nature)
    | 'PLAY'      // 7. Play (Creativity, Joy)
    | 'INSIGHT'   // 8. Insight (Knowledge, Philosophy)
    | 'CHAOS';    // 9. Chaos (The Unexpected)

export interface LifeFocus {
    id: LifeFocusId;
    name: string;
    description: string;
    color: string; // Hex code
    icon: string;  // Emoji or Icon name
}

// --- 2. The 12-Dimensional Grammar ---

export type DimensionId =
    | 'entity'        // (1) Who/What acting
    | 'action'        // (2) What is being done
    | 'context'       // (3) External conditions
    | 'intent'        // (4) Purpose/Motive
    | 'outcome'       // (5) Result/Consequence
    | 'time'          // (6) Temporal frame
    | 'meaning'       // (7) Metaphysical interpretation
    | 'state'         // (8) Inner/Emotional/Spiritual state
    | 'values'        // (9) Virtue/Vice dimension
    | 'relationships' // (10) Relational web
    | 'principles'    // (11) Universal law applying
    | 'station';      // (12) Spiritual rank/Developmental stage

export interface DimensionValue {
    id: string;        // Canonical ID or keyword
    label: string;     // Human-readable label
    score?: number;    // Strength/Confidence (0-1 or 0-100)
    meta?: Record<string, any>;
}

// --- 3. Assertion (The Universal Atom) ---

export interface AssertionQuality {
    acceptable?: boolean;
    convertible?: boolean; // Improvable / Refactorable
    logical?: boolean;
    relevant?: boolean;
    specific?: boolean;
    notes?: string;
}

export interface Assertion {
    assertionId: string;   // UIID
    taskId?: string;       // Link to parent task
    strategyInstanceId?: string;
    stepId?: string;       // Which strategy step produced it

    // The 12 Dimensions
    entity?: DimensionValue;
    action?: DimensionValue;
    context?: DimensionValue;
    intent?: DimensionValue;
    outcome?: DimensionValue;
    time?: DimensionValue;
    meaning?: DimensionValue;
    state?: DimensionValue;
    values?: DimensionValue;
    relationships?: DimensionValue;
    principles?: DimensionValue;
    station?: DimensionValue;

    quality: AssertionQuality;

    // Content & Meta
    text: string;          // The raw content
    createdAt: string;     // ISO Timestamp
    source?: string;       // e.g., 'user-log', 'strategy-step:defineProblem'
    meta?: Record<string, any>;
}

// --- 4. Task Extended Model ---

export type TaskStatus = 'backlog' | 'in_progress' | 'done' | 'blocked' | 'ignored';

export interface TaskScoreLevel {
    overall?: number;
    effort?: number;
    impact?: number;
    sincerity?: number;
    progress?: number;
    meta?: Record<string, any>;
}

export interface TaskStrategyLevel {
    activeStrategyInstanceId?: string;
    strategyInstanceIds?: string[];
    meta?: Record<string, any>;
}

export interface TaskReportLevel {
    outline?: string[];
    finalNarrativeId?: string;
    metricsSnapshot?: Record<string, any>;
    meta?: Record<string, any>;
}

export interface ComicFrameRef {
    frameId: string;
    sceneKey?: string;
    assertionIds?: string[];
}

export interface TaskComicLevel {
    comicId?: string;
    frames?: ComicFrameRef[];
    mood?: string;
    meta?: Record<string, any>;
}

export interface TaskLevels {
    score: TaskScoreLevel;
    strategy: TaskStrategyLevel;
    report: TaskReportLevel;
    comic: TaskComicLevel;
}

export interface Task {
    taskId: string;
    title: string;
    description?: string;

    // Core Metadata
    status: TaskStatus;
    createdAt: string;
    dueAt?: string;
    completedAt?: string;

    // Categorization
    pillar: LifeFocusId;
    categories?: string[];

    // Links
    parentTaskId?: string;
    childrenTaskIds?: string[];
    assertionIds?: string[]; // 12-D assertions about this task

    // The 4 Levels
    levels: TaskLevels;

    // Open KV for strategy specific data (Strategy ID -> Data)
    strategyData?: Record<string, Record<string, any>>;

    sourceText?: string;   // Original input if derived from text
    meta?: Record<string, any>;
}

// --- 5. New Feature Types (Reporting, Ledger, Story, etc.) ---

export interface FlowEvent {
    id: string;
    timestamp: string;
    account_code: string;
    amount: number;
    unit: string; // 'min', 'usd', 'energy', 'points'
    description: string;
    segments: Record<string, any>; // JSON
}

export interface Problem {
    id: string;
    title: string;
    status: 'open' | 'solved' | 'abandoned';
    hypothesis: string;
    rca: string;
    created_at: string;
    updated_at: string;
}

export interface ProblemEvent {
    id: string;
    problem_id: string;
    event_type: string;
    details: string;
    timestamp: string;
}

export interface DailyScore {
    date: string;
    sps: number; // Sprint Performance Score
    aps: number; // Alignment Performance Score
    bps: number; // Burnout Protection Score
    metrics: Record<string, any>;
}

export interface StoryInstance {
    id: string;
    date: string;
    narrative: string;
    type: 'daily_replay' | 'weekly_summary' | 'comic_script';
    model_used: string;
}

export interface Provider {
    id: string;
    name: string;
    type: 'llm' | 'image' | 'voice';
    api_key_ref: string; // Reference to secret key
    config: Record<string, any>;
    status: 'active' | 'inactive' | 'error';
}
