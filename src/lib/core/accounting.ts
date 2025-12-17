/**
 * Nu Flow Protocol - Accounting Core
 * Maps Life Focus pillars to Chart of Accounts (CoA) codes.
 */

export interface AccountProfile {
    code: string;      // TYYY.FF.SS
    name: string;      // Human readable
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'COGS' | 'EXPENSE';
    multiplier: number; // Asset multiplication factor (0.5 to 2.0 typically)
}

// Canonical Pillar Mapping (1-9)
// 1: CORE -> Faith/Identity
// 2: SELF -> Health/Systems
// 3: CIRCLE -> Family/Friends
// 4: GRIND -> Work/Career
// 5: LEVEL_UP -> Growth/Skill
// 6: IMPACT -> Community/Legacy
// 7: PLAY -> Joy/Hobby
// 8: INSIGHT -> Mind/Knowledge
// 9: CHAOS -> Entropy management (Systems/Chores usually end up here or Self)

export function resolveAccount(lf: number | undefined): AccountProfile {
    // Default to General Operations/Admin if unknown
    if (!lf) {
        return {
            code: '6100.00.00',
            name: 'General Admin',
            type: 'EXPENSE',
            multiplier: 0.5 // Admin is necessary but low "Value Add" relative to deep work
        };
    }

    switch (lf) {
        case 1: // CORE
            return {
                code: '5100.01.00',
                name: 'Core Practice',
                type: 'COGS',
                multiplier: 1.5 // High value for spiritual/identity work
            };
        case 2: // SELF (Health)
            return {
                code: '5100.02.00',
                name: 'Health Investment',
                type: 'COGS',
                multiplier: 1.2
            };
        case 3: // CIRCLE
            return {
                code: '5100.03.00',
                name: 'Relationship Building',
                type: 'COGS',
                multiplier: 1.1
            };
        case 4: // GRIND (Work)
            return {
                code: '5100.04.01',
                name: 'Deep Work',
                type: 'COGS',
                multiplier: 1.3 // High productivity
            };
        case 5: // LEVEL_UP
            return {
                code: '1500.05.00',
                name: 'Skill Acquisition (CapEx)',
                type: 'ASSET',
                multiplier: 1.4 // Building future capacity
            };
        case 6: // IMPACT
            return {
                code: '5100.06.00',
                name: 'Community Service',
                type: 'COGS',
                multiplier: 1.2
            };
        case 7: // PLAY
            return {
                code: '4100.07.00',
                name: 'Recreation (Return)',
                type: 'REVENUE', // Play generates "Joy Capital" or is a return on life
                multiplier: 1.0 // Neutral/Baseline
            };
        case 8: // INSIGHT
            return {
                code: '1500.08.00',
                name: 'Knowledge Banking',
                type: 'ASSET',
                multiplier: 1.3
            };
        case 9: // CHAOS (or Systems/Chores in some models)
        default:
            return {
                code: '6100.09.00',
                name: 'System Maintenance',
                type: 'EXPENSE',
                multiplier: 0.6 // Chores are necessary but lower "Score" per minute than Deep Work
            };
    }
}
