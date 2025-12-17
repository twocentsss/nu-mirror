import { computeTrend, sum } from "@/lib/reporting/stats";
import { getFlowEvents } from "@/lib/features/ledger/accounting";

export interface FlowSummaryEvent {
  id: string;
  description: string;
  timestamp: string;
  amount: number;
  unit: string;
  segments: FlowEvent["segments"];
}

export interface FlowSummary {
  totalMinutes: number;
  eventCount: number;
  totalsByComponentGroup: Record<string, number>;
  totalsByActivity: Record<string, number>;
  topEvents: FlowSummaryEvent[];
  trend: { percent: number; label: string };
  periodDays: number;
  dateRange: { start: string; end: string };
  lastUpdated: string;
}

interface BuildFlowSummaryOptions {
  now?: Date;
  periodDays?: number;
  spreadsheetId?: string;
  accessToken?: string;
  refreshToken?: string;
  userEmail?: string;
}

export async function buildFlowSummary(options: BuildFlowSummaryOptions = {}): Promise<FlowSummary> {
  const periodDays = options.periodDays ?? 14;
  const now = options.now ?? new Date();
  const end = new Date(now);
  const start = new Date(end);
  start.setDate(end.getDate() - periodDays + 1);

  const prevEnd = new Date(start);
  prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevEnd.getDate() - periodDays + 1);

  const fetchOpts = {
    spreadsheetId: options.spreadsheetId,
    accessToken: options.accessToken,
    refreshToken: options.refreshToken,
    userEmail: options.userEmail,
  };
  const currentEvents = await getFlowEvents(start.toISOString(), end.toISOString(), fetchOpts);
  const previousEvents = await getFlowEvents(prevStart.toISOString(), prevEnd.toISOString(), fetchOpts);

  const totalMinutes = sum(currentEvents.map((event) => event.amount));
  const previousMinutes = sum(previousEvents.map((event) => event.amount));

  const totalsByComponentGroup: Record<string, number> = {};
  const totalsByActivity: Record<string, number> = {};

  for (const event of currentEvents) {
    const group = event.segments?.component_group || "Untracked";
    totalsByComponentGroup[group] = (totalsByComponentGroup[group] || 0) + event.amount;

    const activity = event.segments?.business_activity || event.segments?.activity_type || "General";
    totalsByActivity[activity] = (totalsByActivity[activity] || 0) + event.amount;
  }

  const topEvents = [...currentEvents]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((event) => ({
      id: event.id,
      description: event.description,
      timestamp: event.timestamp,
      amount: event.amount,
      unit: event.unit,
      segments: event.segments,
    }));

  const trend = computeTrend(totalMinutes, previousMinutes);

  return {
    totalMinutes,
    eventCount: currentEvents.length,
    totalsByComponentGroup,
    totalsByActivity,
    topEvents,
    trend,
    periodDays,
    dateRange: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    lastUpdated: new Date().toISOString(),
  };
}
