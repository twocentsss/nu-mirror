/**
 * Ledger Schema
 * 
 * Defines the double-entry accounting system for Time, Energy, and Focus.
 * This powers the "Day Waterfall" visualization and workload analysis.
 */

// 1. Chart of Accounts
export type AccountType = 'asset' | 'liability' | 'equity'; // Standard accounting types
export type ResourceType = 'time' | 'energy' | 'focus';

export interface Account {
    id: string;
    name: string;        // "Time Pot", "Work Segment", "Overdraft"
    type: AccountType;
    resource: ResourceType;
    balance: number;     // Current balance (e.g., remaining minutes)
}

// 2. Segments (Cost Centers)
// Mapped 1:1 with LifeFocus
export type SegmentId = 'work' | 'self' | 'family' | 'play' | 'admin' | 'chaos';

export interface Segment {
    id: SegmentId;
    label: string;
    lf_mapping: number[]; // Which LifeFocus IDs map here
    budget?: number;      // Optional daily budget (e.g., max 8h work)
}

// 3. Transactions (The Journal)
export interface JournalEntry {
    id: string;
    created_at: string;
    description: string;  // "Commit: Clean Desk"
    related_entity?: {
        type: 'task' | 'option';
        id: string;
    };
    lines: TransactionLine[];
}

export interface TransactionLine {
    account_id: string;
    amount: number;       // Positive only
    direction: 'debit' | 'credit';
    segment_id?: SegmentId; // Optional tagging for analysis
}

// 4. Analysis Views (Read Models)
export interface DayLedger {
    date: string;
    resources: {
        time_available: number;
        time_committed: number;
        energy_level: number;
    };
    allocation: Record<SegmentId, number>; // How much spent per segment
    alerts: string[]; // "Work Overdraft Risk"
}
