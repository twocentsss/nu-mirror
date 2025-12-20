import { TaskRecord } from "@/components/TaskEditorModal";
import { DayLedger, SegmentId } from "./schema";

/**
 * Constants for Day Capacity
 */
const CAPACITY = {
    TIME_MINUTES: 16 * 60, // 16 waking hours
    ENERGY_POINTS: 100,
};

/**
 * Analysis: Net Workload Delta
 * Calculates the balance of Time and Energy for a given day.
 */
export function calculateDayLedger(
    date: string,
    tasks: TaskRecord[],
    // explicitEntries: LedgerEntry[] = [] // Future: Mix in manual charges
): DayLedger {

    // 1. Initialize Calculation State
    let timeCommitted = 0;
    const allocation: Record<SegmentId, number> = {
        work: 0, self: 0, family: 0, play: 0, admin: 0, chaos: 0
    };

    // 2. Aggregate Tasks (Implicit Charges)
    tasks.forEach(task => {
        // Only count active or done tasks for the ledger load
        if (task.status === 'archived') return;

        const duration = task.duration_min || 15; // Default cost
        timeCommitted += duration;

        // Map LifeFocus to Segment
        // 1-3 -> Self/Family/Circle, 4-5 -> Work/LevelUp, 6 -> Impact, 7-8 -> Play/Insight, 9 -> Chaos
        let segment: SegmentId = 'chaos';
        const lf = task.lf || 9;

        if (lf <= 3) segment = 'self'; // Simplified mapping
        else if (lf === 3) segment = 'family';
        else if (lf <= 5) segment = 'work';
        else if (lf === 7) segment = 'play';
        else if (lf === 9) segment = 'chaos';

        // Rudimentary mapping for demo
        if (lf === 4 || lf === 5) segment = 'work';
        if (lf === 2 || lf === 8) segment = 'self';
        if (lf === 3) segment = 'family';
        if (lf === 7) segment = 'play';

        allocation[segment] = (allocation[segment] || 0) + duration;
    });

    // 3. Determine Alerts
    const alerts: string[] = [];

    // Overdraft Check
    const timeAvailable = Math.max(0, CAPACITY.TIME_MINUTES - timeCommitted);
    if (timeCommitted > CAPACITY.TIME_MINUTES) {
        alerts.push(`Overdraft: ${timeCommitted - CAPACITY.TIME_MINUTES}m over capacity`);
    }

    // Work-Life Balance Check (Simple Rule: Work > 60% of capacity)
    if (allocation.work > (CAPACITY.TIME_MINUTES * 0.6)) {
        alerts.push("Imbalance: Work consuming >60% of day");
    }

    // 4. Construct Result
    return {
        date,
        resources: {
            time_available: timeAvailable,
            time_committed: timeCommitted,
            energy_level: Math.max(0, 100 - (timeCommitted / 10)), // Rough approximation: 10m = 1 energy
        },
        allocation,
        alerts
    };
}
