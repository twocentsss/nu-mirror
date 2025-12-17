/**
 * Nu Flow Protocol - Reporting Aggregator
 * Transforms raw FlowEvents into "CEO Dashboard" Department Reports.
 */

import { DepartmentId, DepartmentReport, ReportMetric } from './types';
import { computeTrend, avg, sum } from './stats';
import { FlowEvent } from '../core/types';

/**
 * The "Board Meeting" Generator.
 * Takes a list of events and produces the 4 Department Reports.
 */
export function generateDepartmentReports(
    currentPeriodEvents: FlowEvent[],
    previousPeriodEvents: FlowEvent[]
): Record<DepartmentId, DepartmentReport> {

    // 1. Initialize Empty Reports
    const reports: Record<DepartmentId, DepartmentReport> = {
        OPERATIONS: { id: 'OPERATIONS', name: 'Operations & Maintenance', metrics: [], overallScore: 0, overallStatus: 'green' },
        HR: { id: 'HR', name: 'Corporate Culture & HR', metrics: [], overallScore: 0, overallStatus: 'green' },
        R_AND_D: { id: 'R_AND_D', name: 'R&D and Recovery', metrics: [], overallScore: 0, overallStatus: 'green' },
        FINANCE: { id: 'FINANCE', name: 'Finance', metrics: [], overallScore: 0, overallStatus: 'green' }
    };

    // 2. Define the "CEO Logic" Mapping
    // Helper to sum amounts for a specific filter
    const sumMetric = (events: FlowEvent[], filterFn: (e: FlowEvent) => boolean) => {
        return sum(events.filter(filterFn).map(e => e.amount));
    };

    // --- OPERATIONS Metrics ---
    // Workouts (Output Capacity)
    const isWorkout = (e: FlowEvent) => e.segments.component_group === 'Workouts';
    addMetric(reports.OPERATIONS, 'Workouts', 'min', currentPeriodEvents, previousPeriodEvents, isWorkout,
        (trend) => trend.percent <= -20 ? "We have a crisis meeting." : "Capacity stable.");

    // Sweets (Waste Mgmt)
    const isSweets = (e: FlowEvent) => e.segments.component_group === 'Food' && e.segments.activity_type === 'Sweets';
    addMetric(reports.OPERATIONS, 'Sweets Impact', 'count', currentPeriodEvents, previousPeriodEvents, isSweets,
        (trend) => trend.percent >= 50 ? "Cut costs (calories) immediately." : "Waste levels acceptable.");

    // --- HR Metrics ---
    // Family Time (Culture)
    const isFamily = (e: FlowEvent) => e.segments.business_activity === 'Family';
    addMetric(reports.HR, 'Family Time', 'min', currentPeriodEvents, previousPeriodEvents, isFamily,
        (trend) => trend.percent <= -10 ? "Culture risk. Invest minutes." : "Team morale high.");

    // --- R&D Metrics ---
    // Games (Recovery)
    const isGames = (e: FlowEvent) => e.segments.activity_type === 'Games';
    addMetric(reports.R_AND_D, 'Games', 'min', currentPeriodEvents, previousPeriodEvents, isGames,
        (trend) => trend.percent >= 30 ? "Check for burnout/escapism." : "Cognitive sharpening active.");

    return reports;
}

// Helper to sum amounts for a specific filter
const sumMetric = (events: FlowEvent[], filterFn: (e: FlowEvent) => boolean) => {
    return sum(events.filter(filterFn).map(e => e.amount));
};

/**
 * Helper to build a ReportMetric object and attach it to the report.
 */
function addMetric(
    report: DepartmentReport,
    label: string,
    unit: string,
    currEvents: FlowEvent[],
    prevEvents: FlowEvent[],
    filterFn: (e: FlowEvent) => boolean,
    insightGenerator: (trend: { percent: number; label: string }) => string
) {
    const currentTotal = sumMetric(currEvents, filterFn);
    const previousTotal = sumMetric(prevEvents, filterFn);

    const trend = computeTrend(currentTotal, previousTotal);

    // Simple status logic (can be more complex)
    let status: 'green' | 'yellow' | 'red' = 'green';
    if (label === 'Sweets Impact' && trend.percent > 20) status = 'red';
    else if (label !== 'Sweets Impact' && trend.percent < -10) status = 'red';

    const metric: ReportMetric = {
        id: label.toLowerCase().replace(/\s/g, '_'),
        label,
        unit,
        total: currentTotal,
        average: 0, // In real app, divide by days
        trendPercent: trend.percent,
        trendLabel: trend.label,
        isCrisis: status === 'red',
        status,
        narrative: insightGenerator(trend)
    };

    report.metrics.push(metric);
}
