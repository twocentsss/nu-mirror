import { addDays, addWeeks, addMonths, addYears, getDay, nextDay, startOfDay, isSameDay, endOfMonth, setDate, startOfMonth, eachDayOfInterval } from 'date-fns';

export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type WeekDay = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA';
export type CompletionPolicy = 'floating' | 'fixed' | 'skip';

export interface RecurrenceRule {
    freq: Frequency;
    interval?: number;
    byDay?: WeekDay[];
    byMonthDay?: number[]; // 1-31, -1 for last day
    bySetPos?: number[]; // e.g., 2nd Monday
    count?: number;
    until?: string; // ISO Date
    weekStart?: WeekDay; // Default MO
}

export const WEEKDAYS: WeekDay[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/**
 * Computes the next occurrence date based on the rule and reference date.
 * 
 * @param rule The recurrence rule
 * @param lastOccurrenceDate The scheduled date of the last occurrence (for fixed schedule)
 * @param completionDate The actual completion date (for floating schedule)
 * @param policy 'fixed' (calendar based) or 'floating' (completion based)
 */
export function computeNextDueDate(
    rule: RecurrenceRule,
    lastOccurrenceDate: Date,
    completionDate: Date = new Date(), // default to now if not provided
    policy: CompletionPolicy = 'floating'
): Date {
    // 1. Determine the base date for calculation
    // Fixed: Next is based on the previous scheduled date (e.g., repeating meeting)
    // Floating: Next is based on when you actually did it (e.g., watering plants)
    let baseDate = policy === 'fixed' ? lastOccurrenceDate : completionDate;

    // If floating, start strictly from completion. 
    // If fixed, we want the next slot in the series after baseDate.

    if (isNaN(baseDate.getTime())) baseDate = new Date();

    const interval = rule.interval && rule.interval > 0 ? rule.interval : 1;
    let nextDate = new Date(baseDate);

    // Simple expansion for Phase 1 (Interval + Freq)
    switch (rule.freq) {
        case 'DAILY':
            nextDate = addDays(baseDate, interval);
            break;
        case 'WEEKLY':
            nextDate = addWeeks(baseDate, interval);
            // Handle byDay logic if present (e.g. MO, WE, FR)
            // If we are strictly just adding weeks, this is "Every N Weeks on [Day of BaseDate]"
            // If byDay is set, we need to find the NEXT day in the list.
            if (rule.byDay && rule.byDay.length > 0) {
                // This is complex. We need to find the next valid weekday after baseDate.
                // If none in this week, go to next week.
                nextDate = computeNextWeeklyOccurrence(baseDate, interval, rule.byDay);
            }
            break;
        case 'MONTHLY':
            nextDate = addMonths(baseDate, interval);
            // Logic for byMonthDay or bySetPos would go here.
            // Default: same day of month.
            break;
        case 'YEARLY':
            nextDate = addYears(baseDate, interval);
            break;
    }

    // Handle 'Until'
    if (rule.until) {
        const untilDate = new Date(rule.until);
        if (nextDate > untilDate) {
            // Return strict past date or throw to indicate finished
            // We will handle this in the caller by checking if valid
            return nextDate;
        }
    }

    // Handle 'Count' logic would presumably be handled by looking at current count in Series state, 
    // distinct from pure date calc.

    return nextDate;
}

function computeNextWeeklyOccurrence(baseDate: Date, interval: number, byDay: WeekDay[]): Date {
    // Map 'MO' -> 1, etc.
    const targetDays = byDay.map(d => WEEKDAYS.indexOf(d));
    const currentDay = getDay(baseDate);

    // Check if there is a later day in the same week
    const laterDays = targetDays.filter(d => d > currentDay).sort((a, b) => a - b);

    if (laterDays.length > 0) {
        // Next occurrence is later this week (interval 0 effectively for the jump)
        // Actually, if interval is > 1, does it mean "Every 2 weeks on Mon/Wed"?
        // Outlook semantics: The set of days applies to the week. 
        // If we cross the week boundary, we add the interval.
        return nextDay(baseDate, laterDays[0] as 0 | 1 | 2 | 3 | 4 | 5 | 6);
    } else {
        // Must jump to next valid week
        // Add interval weeks, then pick the first available day
        const firstDayOfWeek = targetDays.sort((a, b) => a - b)[0];
        const baseNextWeek = addWeeks(baseDate, interval);
        // Find the date of firstDayOfWeek in that week
        // This logic simplifies "Start of week" to be Sunday (0)
        const startOfNextWeek = startOfDay(addDays(baseNextWeek, -getDay(baseNextWeek)));
        // Then add the day offset
        return addDays(startOfNextWeek, firstDayOfWeek);
    }
}

export function formatRecurrenceLabel(rule?: RecurrenceRule): string {
    if (!rule) return '';
    const freq = rule.freq.charAt(0) + rule.freq.slice(1).toLowerCase(); // Daily, Weekly
    const intervalStr = rule.interval && rule.interval > 1 ? `every ${rule.interval} ` : 'every ';
    const unit = rule.interval && rule.interval > 1 ? rule.freq.toLowerCase().replace("ly", "s") : rule.freq.toLowerCase().replace("ly", ""); // days, weeks

    let label = rule.interval && rule.interval > 1
        ? `Every ${rule.interval} ${unit}`
        : freq;

    if (rule.freq === 'WEEKLY' && rule.byDay && rule.byDay.length > 0) {
        label += ' on ' + rule.byDay.join(', ');
    }
    return label;
}

// Default rules for quick start
export const PRESETS = {
    DAILY: { freq: 'DAILY', interval: 1 } as RecurrenceRule,
    WEEKLY: { freq: 'WEEKLY', interval: 1 } as RecurrenceRule,
    BIWEEKLY: { freq: 'WEEKLY', interval: 2 } as RecurrenceRule,
    MONTHLY: { freq: 'MONTHLY', interval: 1 } as RecurrenceRule,
};
