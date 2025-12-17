/**
 * Nu Flow Protocol - Reporting Stats Engine
 * The math behind the reports: Trends, Max/Min, and Consistency.
 */

// Basic math for cleaner reading
export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
export const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);
export const max = (arr: number[]) => (arr.length ? Math.max(...arr) : 0);

/**
 * Calculates the percentage change between two values.
 * Returns a tuple of [percent, label].
 * e.g., (115, 100) -> [15, "↑ 15%"]
 * e.g., (80, 100) -> [-20, "↓ 20%"]
 */
export function computeTrend(current: number, previous: number): { percent: number; label: string } {
    if (previous === 0) {
        if (current === 0) return { percent: 0, label: "0%" };
        // Infinite growth if prev is 0 but current is > 0
        return { percent: 100, label: "↑ 100%+" };
    }

    const diff = current - previous;
    const percent = (diff / previous) * 100;
    const absPercent = Math.abs(percent);

    // Format to 1 decimal place if needed, or int
    const formatted = absPercent % 1 === 0 ? absPercent.toFixed(0) : absPercent.toFixed(1);

    const sign = percent >= 0 ? "↑" : "↓";
    return {
        percent,
        label: `${sign} ${formatted}%`
    };
}

/**
 * Finds the "Global Max" (best historical performance) for a metric.
 * This can be the max of daily values, OR the max of weekly averages depending on "period".
 * For now, simple array max.
 */
export function getGlobalMax(history: number[]): number {
    return max(history);
}

/**
 * Calculates consistency (Streak Score).
 * A simple heuristic: What % of days in the period were non-zero (or above threshold)?
 */
export function calculateConsistency(dailyValues: number[], threshold = 0): number {
    if (dailyValues.length === 0) return 0;

    const activeDays = dailyValues.filter(v => v > threshold).length;
    return (activeDays / dailyValues.length) * 100; // 0-100 score
}
