/**
 * Nu Flow Protocol - Reporting Engine Types
 * Defines the Department structures, metrics, and visualization data models.
 */

import { LifeFocusId } from '../core/types';

// --- 1. Departments & Metrics ---

export type DepartmentId =
    | 'OPERATIONS'  // Physical Health (Workouts, Fuel)
    | 'HR'          // Culture & Relationships (Family, Social)
    | 'R_AND_D'     // Recovery & Leisure (Games, Rest)
    | 'FINANCE';    // Money & Resources (Optional)

export interface ReportMetric {
    id: string;
    label: string;      // e.g., "Workouts", "Sweets Intake"
    unit: string;       // e.g., "min", "score", "count"

    // The "CEO Numbers"
    total: number;      // Raw Volume
    average: number;    // Daily Baseline

    // Trend Analysis
    trendPercent: number; // e.g., 15 for +15%, -5 for -5%
    trendLabel: string;   // e.g., "↑ 15%", "↓ 5%"
    isCrisis: boolean;    // "If Workouts ↓ 20%: Crisis Meeting"
    status: 'green' | 'yellow' | 'red';

    // CEO Insight / Narrative
    narrative: string;    // e.g., "We have a crisis meeting."
}

export interface DepartmentReport {
    id: DepartmentId;
    name: string;        // e.g., "Operations & Maintenance"
    metrics: ReportMetric[];

    // Department-level Health
    overallScore: number; // 0-100
    overallStatus: 'green' | 'yellow' | 'red';
}

// --- 2. Visualization Suite Data Models ---

// The "Peak Performance" Ring
export interface RingData {
    metricId: string;
    current: number;    // Current Period Average or Total
    target: number;     // "Global Max" or Goal
    percentage: number; // 0-1 (or >1 if crushing it)
    color: string;
}

// The "Consistency" Heatmap
export interface HeatmapCell {
    date: string;       // ISO Date YYYY-MM-DD
    value: number;
    intensity: number;  // 0.0 - 1.0 (Green opacity)
}

export interface HeatmapData {
    metricId: string;
    grid: HeatmapCell[];
}

// The "Volume" Bar Chart
export interface BarDataPoint {
    label: string;      // e.g. "Mon", "Tue" or "Week 1"
    value: number;
    isMax?: boolean;    // Highlight the peak
}

export interface BarData {
    metricId: string;
    series: BarDataPoint[];
}

// --- 3. Dashboard Widgets ---

export type WidgetSize = 'small' | 'medium' | 'large';

export interface DashboardWidget {
    id: string;
    size: WidgetSize;
    title: string;
    departmentId: DepartmentId;

    // Data Payload
    rings?: RingData[];
    heatmap?: HeatmapData;
    bars?: BarData;

    // Executive Summary
    summary: {
        volume: string;
        average: string;
        trend: string;
        insight: string;
    };
}
