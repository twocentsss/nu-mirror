import { Event, LedgerPostedBody } from '../events/types';
import { FlowEvent } from '../core/types';

/**
 * Maps a generic LedgerPosted event (from Event Log) into the legacy FlowEvent structure
 * required by the Report Aggregator.
 */
export function mapLedgerEventsToFlowEvents(events: Event<LedgerPostedBody>[]): FlowEvent[] {
    return events.map(evt => {
        const body = evt.body;

        // Construct legacy FlowEvent
        return {
            id: evt.env.id,
            timestamp: new Date(evt.env.ts).toISOString(),
            account_code: body.bucket, // Mapping bucket -> account_code
            amount: body.amount,
            unit: body.unit,
            description: body.memo,
            // Critical: Ensure segments exist. 
            // In the new event model, segments should be passed in 'body.segments'.
            // If missing, we might default or lose filtering capability.
            segments: body.segments || {}
        };
    });
}
