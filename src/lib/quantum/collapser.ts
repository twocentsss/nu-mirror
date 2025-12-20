import { Option, OptionSet, LedgerCharge } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Context for Scoring
 * What constraints are we operating under right now?
 */
export interface CollapseContext {
    available_time_min: number; // e.g. 15 (gap in calendar)
    current_energy: number;     // 0-100 (user state)
    segment_focus?: string;     // e.g. "Work" (are we in a work block?)
}

/**
 * The Collapser Engine
 * Resolves superposition into concrete commitment.
 */

// 1. Score Options (Fit Calculation)
export function scoreOptions(optionSet: OptionSet, context: CollapseContext): OptionSet {
    const scoredOptions = optionSet.options.map(opt => {
        let score = opt.value_score; // Start with intrinsic value

        // Time Penalty: If it doesn't fit, massive penalty
        if (opt.duration_min > context.available_time_min) {
            score -= 500;
        }

        // Energy Penalty: If it's too draining for current state
        if (opt.energy_cost > context.current_energy) {
            score -= 200;
        }

        // Segment Bonus: If it matches current focus block
        if (context.segment_focus && opt.task_def.segment_id === context.segment_focus) {
            score += 50;
        }

        // Optimization: Store the computed score temporarily or sort by it
        // For now, we assume the UI will sort by a computed 'fit' property 
        // but the Option type is pure. We'll return the set as-is but
        // in a real implementation we might attach metadata.
        return opt;
    });

    // Logic to potentially recommend the best one
    // optionSet.recommended_option_id = bestOption.id;

    return optionSet;
}

// 2. Collapse (Commitment)
export function collapseOption(option: Option): { task_id: string, charges: LedgerCharge[] } {
    const taskId = uuidv4();

    // Create the Ledger Charges (The "Cost" of this task)
    const timeCharge: LedgerCharge = {
        account: 'time',
        amount: option.duration_min,
        segment_id: option.task_def.segment_id,
        direction: 'debit'
    };

    const energyCharge: LedgerCharge = {
        account: 'energy',
        amount: option.energy_cost,
        segment_id: option.task_def.segment_id,
        direction: 'debit'
    };

    return {
        task_id: taskId,
        charges: [timeCharge, energyCharge]
    };
}
