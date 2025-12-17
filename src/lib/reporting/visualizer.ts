/**
 * Nu Flow Protocol - Visualization Logic
 * Prepares data for Rings, Heatmaps, and Bar Charts.
 */

import { DepartmentReport, HeatmapData, RingData, BarData, BarDataPoint } from './types';
import { getGlobalMax, calculateConsistency } from './stats';

// Mock types for input history
interface DailyValue {
    date: string; // YYYY-MM-DD
    value: number;
}

/**
 * Prepares data for the "Peak Performance" Ring.
 * Comparing current average against Global Max.
 */
export function prepareRingData(metricLabel: string, currentTotal: number, history: number[]): RingData {
    const globalMax = getGlobalMax(history);
    // If no history, target is current (100%)
    const target = globalMax > 0 ? globalMax : currentTotal;

    const percentage = target === 0 ? 0 : currentTotal / target;

    // Color Logic: Green if >= 80% of max, Yellow if > 50%, Red otherwise
    let color = '#E74C3C'; // Red
    if (percentage >= 0.8) color = '#2ECC71'; // Green
    else if (percentage >= 0.5) color = '#F1C40F'; // Yellow

    return {
        metricId: metricLabel,
        current: currentTotal,
        target,
        percentage,
        color
    };
}

/**
 * Prepares data for the "Consistency" Heatmap.
 * Grid of days, colored by intensity.
 */
export function prepareHeatmapData(metricLabel: string, dailyValues: DailyValue[]): HeatmapData {
    const grid = dailyValues.map(d => {
        // Determine intensity (0.0 - 1.0)
        // Simple normalization: value / 60 mins (capped at 1.0)
        // In real app, this denominator comes from config
        const intensity = Math.min(d.value / 60, 1.0);
        return {
            date: d.date,
            value: d.value,
            intensity
        };
    });

    return {
        metricId: metricLabel,
        grid
    };
}

/**
 * Prepares data for the "Volume" Bar Chart.
 * highlighting the max value.
 */
export function prepareBarData(metricLabel: string, dailyValues: DailyValue[]): BarData {
    const maxValue = Math.max(...dailyValues.map(d => d.value));

    const series: BarDataPoint[] = dailyValues.map(d => ({
        label: d.date.slice(5), // MM-DD
        value: d.value,
        isMax: d.value === maxValue && d.value > 0
    }));

    return {
        metricId: metricLabel,
        series
    };
}
