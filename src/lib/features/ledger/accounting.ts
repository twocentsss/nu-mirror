
import { appendRow, readAllRows } from '../../google/sheetStore';
import { SHEET_TABS } from '../../google/schema';
import { FlowEvent } from '../../core/types';
import { ulid } from 'ulid';

/**
 * Posts a new Flow Event (Time, Money, Energy, Points) to the ledger.
 * This is an append-only operation.
 */
export async function postFlowEvent(
    accountCode: string,
    amount: number,
    unit: string,
    description: string,
    segments: Record<string, any> = {}
): Promise<FlowEvent> {
    const event: FlowEvent = {
        id: ulid(),
        timestamp: new Date().toISOString(),
        account_code: accountCode,
        amount,
        unit,
        description,
        segments
    };

    await appendRow({
        tab: SHEET_TABS.FLOW_EVENTS,
        values: [
            event.id,
            event.timestamp,
            event.account_code,
            event.amount,
            event.unit,
            event.description,
            JSON.stringify(event.segments)
        ]
    });

    return event;
}

/**
 * Posts an adjustment (reversal + correction).
 * Does NOT edit the original row. Appends two new rows:
 * 1. Reversal of the original (negative amount)
 * 2. Corrected entry
 */
export async function adjustFlowEvent(
    originalEventId: string,
    correctedAmount: number,
    reason: string
): Promise<void> {
    // 1. Find original event (inefficient scan, but fine for v1)
    const { rows } = await readAllRows({ tab: SHEET_TABS.FLOW_EVENTS });
    const originalRow = rows.find((r: any) => r[0] === originalEventId);

    if (!originalRow) {
        throw new Error(`FlowEvent ${originalEventId} not found.`);
    }

    const [id, ts, code, amt, unit, desc, seg] = originalRow;
    const originalAmount = Number(amt);

    // 2. Post Reversal
    await postFlowEvent(
        String(code),
        -originalAmount,
        String(unit),
        `REVERSAL of ${id}: ${reason}`,
        { original_event_id: id, type: 'reversal' }
    );

    // 3. Post Correction
    await postFlowEvent(
        String(code),
        correctedAmount,
        String(unit),
        `CORRECTION of ${id}: ${reason}`,
        { original_event_id: id, type: 'correction', original_segments: JSON.parse(String(seg)) }
    );
}

/**
 * Fetches flow events for a given date range.
 */
import { initAccountSpreadsheet } from "@/lib/google/accountSpreadsheet";

export async function getFlowEvents(
    startDate: string,
    endDate: string,
    opts?: {
        spreadsheetId?: string;
        accessToken?: string;
        refreshToken?: string;
        userEmail?: string;
        retry?: boolean;
    },
): Promise<FlowEvent[]> {
    const { spreadsheetId, accessToken, refreshToken, userEmail, retry } = opts ?? {};
    try {
        const { rows } = await readAllRows({
            tab: SHEET_TABS.FLOW_EVENTS,
            spreadsheetId,
            accessToken,
            refreshToken,
        });

        return rows
            .map((row: any) => ({
                id: String(row[0]),
                timestamp: String(row[1]),
                account_code: String(row[2]),
                amount: Number(row[3]),
                unit: String(row[4]),
                description: String(row[5]),
                segments: JSON.parse(String(row[6] || "{}")),
            }))
            .filter((e: any) => e.timestamp >= startDate && e.timestamp <= endDate);
    } catch (error: any) {
        const message = String(error?.message ?? "");
        if (!retry && userEmail && message.includes("Unable to parse range")) {
            await initAccountSpreadsheet({
                accessToken,
                refreshToken,
                userEmail,
            });
            return getFlowEvents(startDate, endDate, { spreadsheetId, accessToken, refreshToken, userEmail, retry: true });
        }
        throw error;
    }

}
