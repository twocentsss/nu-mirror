/**
 * Quantum Planning Data Structures
 * 
 * Defines the core types for the "Superposition Layer" - the state between
 * capturing a thought and committing to a task.
 */

// ==========================================
// 1. The Atom (Raw Capture)
// ==========================================

export type IntentStatus = 'floating' | 'proposed' | 'committed' | 'discarded';

export interface IntentAtom {
    id: string;
    userId: string;
    text: string;           // "clean desk"
    raw_text: string;       // "clean desk !!! 20m"

    // Detected signals (Context)
    signals: {
        time_phrase?: string; // "tomorrow", "this weekend"
        urgency?: 'low' | 'medium' | 'high';
        energy?: 'low' | 'medium' | 'high';
        people?: string[];
    };

    status: IntentStatus;

    // Linkage to the Quantum Graph
    world_graph_ref?: {
        node_id: string;
        node_type: WorldGraphNodeType;
    };

    created_at: string;
}


// ==========================================
// 2. The Superposition (Options)
// ==========================================

export interface Option {
    id: string;
    intent_id: string;

    title: string;          // "Quick Tidy" vs "Deep Clean"
    description?: string;

    // The cost to collapse
    duration_min: number;
    energy_cost: number;    // 0-100

    // The value of collapsing
    value_score: number;    // 0-100 (Impact)

    // Context requirements
    required_context?: {
        location?: 'home' | 'work' | 'any';
        tools?: string[];
    };

    // If collapsed, this is the Task definition
    task_def: {
        lf_id: number;        // 1-9
        segment_id: string;   // "work", "self"
    };
}

export interface OptionSet {
    id: string;
    intent_id: string;
    options: Option[];

    // How to resolve the superposition
    selection_rule: 'pick_one' | 'pick_multiple' | 'any';

    // Recommended option based on current context
    recommended_option_id?: string;

    created_at: string;
}


// ==========================================
// 3. The World Graph (Connectivity)
// ==========================================

export type WorldGraphNodeType = 'task' | 'project' | 'goal' | 'life_focus' | 'intent';
export type WorldGraphEdgeType = 'parent_of' | 'contributes_to' | 'belongs_to' | 'depends_on';

export interface WorldGraphNode {
    id: string;
    type: WorldGraphNodeType;
    label: string;
    metadata?: Record<string, any>;
}

export interface WorldGraphEdge {
    source_id: string;
    target_id: string;
    type: WorldGraphEdgeType;
    weight?: number; // 0-1 (Strength of connection)
}

// 9 Worlds Definition (Static Config)
export const LIFE_FOCUS_NODES = [
    { id: 1, label: 'Core', desc: 'Soul, Purpose' },
    { id: 2, label: 'Self', desc: 'Body, Mind' },
    { id: 3, label: 'Circle', desc: 'Family, Friends' },
    { id: 4, label: 'Grind', desc: 'Work, Admin' },
    { id: 5, label: 'Level Up', desc: 'Growth, Skills' },
    { id: 6, label: 'Impact', desc: 'Community, Giving' },
    { id: 7, label: 'Play', desc: 'Joy, Travel' },
    { id: 8, label: 'Insight', desc: 'Wisdom, Knowledge' },
    { id: 9, label: 'Chaos', desc: 'The Unexpected' },
] as const;


// ==========================================
// 4. The Ledger (Accounting)
// ==========================================

export interface LedgerCharge {
    account: 'time' | 'energy' | 'focus';
    amount: number;         // e.g. 45 (minutes)
    segment_id: string;     // "work", "family"
    direction: 'debit' | 'credit';
}
