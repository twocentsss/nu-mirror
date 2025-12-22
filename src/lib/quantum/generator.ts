import { IntentAtom, Option, OptionSet } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Verb Template Registry
 * Defines how to explode specific intents into quantum options.
 */
interface VerbTemplate {
    verbs: string[];
    generate: (text: string) => OptionDefinition[];
}

interface OptionDefinition {
    suffix: string;      // Applied to title, e.g. "(Quick)"
    duration: number;
    energy: number;      // 0-100
    impact: number;      // 0-100
}

const TEMPLATES: VerbTemplate[] = [
    {
        verbs: ['clean', 'tidy', 'organize', 'clear'],
        generate: () => [
            { suffix: ' 2m', duration: 2, energy: 10, impact: 30 },
            { suffix: ' 15m', duration: 15, energy: 40, impact: 60 },
            { suffix: ' 60m', duration: 60, energy: 90, impact: 100 },
        ]
    },
    {
        verbs: ['read', 'study', 'learn'],
        generate: () => [
            { suffix: ' 5m', duration: 5, energy: 20, impact: 20 },
            { suffix: ' 30m', duration: 30, energy: 60, impact: 70 },
            { suffix: ' 90m', duration: 90, energy: 95, impact: 100 },
        ]
    },
    {
        verbs: ['write', 'draft', 'blog'],
        generate: () => [
            { suffix: ' 10m', duration: 10, energy: 30, impact: 40 },
            { suffix: ' 45m', duration: 45, energy: 80, impact: 80 },
            { suffix: ' 20m', duration: 20, energy: 50, impact: 50 },
        ]
    },
    {
        verbs: ['email', 'reply', 'message'],
        generate: () => [
            { suffix: ' 2m', duration: 2, energy: 10, impact: 50 },
            { suffix: ' 15m', duration: 15, energy: 60, impact: 90 },
        ]
    }
];

const FALLBACK_TEMPLATE: OptionDefinition[] = [
    { suffix: ' 5m', duration: 5, energy: 20, impact: 30 },
    { suffix: ' 25m', duration: 25, energy: 50, impact: 70 },
    { suffix: ' 60m', duration: 60, energy: 80, impact: 100 },
];

/**
 * Analysis Helper: Time Signals
 */
function extractTimeSignals(text: string): any {
    const lower = text.toLowerCase();
    const signals: any = {};

    // 1. Due Date Extraction
    if (lower.includes('today')) {
        signals.time_phrase = 'today';
        signals.due_date = new Date().toISOString().slice(0, 10);
    } else if (lower.includes('tomorrow')) {
        signals.time_phrase = 'tomorrow';
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        signals.due_date = tomorrow.toISOString().slice(0, 10);
    } else if (lower.includes('next week')) {
        signals.time_phrase = 'next week';
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        signals.due_date = nextWeek.toISOString().slice(0, 10);
    }

    // 2. Time of Day Extraction
    if (lower.includes('morning')) {
        signals.time_of_day = 'MORNING';
    } else if (lower.includes('afternoon')) {
        signals.time_of_day = 'AFTERNOON';
    } else if (lower.includes('evening') || lower.includes('night')) {
        signals.time_of_day = 'EVENING';
    }

    return signals;
}

/**
 * Analysis Helper
 */
function detectVerb(text: string): VerbTemplate | null {
    const lower = text.toLowerCase();
    return TEMPLATES.find(t => t.verbs.some(v => lower.includes(v))) || null;
}

/**
 * The Generator
 * Transforms raw text into a Superposition (OptionSet).
 */
export function generateQuantumState(text: string, userId: string): { atom: IntentAtom, optionSet: OptionSet } {
    // 1. Create the Atom
    const atom: IntentAtom = {
        id: uuidv4(),
        userId,
        text,
        raw_text: text,
        signals: extractTimeSignals(text),
        status: 'floating',
        created_at: new Date().toISOString()
    };

    // 2. Determine Template
    const template = detectVerb(text);
    const definitions = template ? template.generate(text) : FALLBACK_TEMPLATE;

    // 3. Generate Options
    const options: Option[] = definitions.map(def => ({
        id: uuidv4(),
        intent_id: atom.id,
        title: `${text}${def.suffix}`,
        duration_min: def.duration,
        energy_cost: def.energy,
        value_score: def.impact,
        task_def: {
            lf_id: 9, // Default to Chaos until classified
            segment_id: 'work' // Default segment
        }
    }));

    // 4. Wrap in OptionSet
    const optionSet: OptionSet = {
        id: uuidv4(),
        intent_id: atom.id,
        options,
        selection_rule: 'pick_one',
        created_at: new Date().toISOString()
    };

    return { atom, optionSet };
}
