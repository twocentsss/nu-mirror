import { IntentAtom, OptionSet, LedgerCharge } from "@/lib/quantum/types";
import { v4 as uuidv4 } from 'uuid';

// Simple Mock Client for now - in full system this hits EventLog
async function emit(type: string, body: any, tenantId: string) {
    console.log(`[EventLog] Emitting ${type}`, body);
    // Full impl: insert into nu.event_log ...
}

/**
 * Emit: Intent Captured
 * When the user first types "Clean desk" and saves.
 */
export async function emitIntentCaptured(atom: IntentAtom, tenantId: string = "default") {
    await emit("intent.captured", {
        atom_id: atom.id,
        text: atom.text,
        status: atom.status,
        created_at: atom.created_at
    }, tenantId);
}

/**
 * Emit: Options Generated
 * When the Generator explodes the intent into options.
 */
export async function emitOptionGenerated(optionSet: OptionSet, tenantId: string = "default") {
    await emit("option.generated", {
        option_set_id: optionSet.id,
        intent_id: optionSet.intent_id,
        options: optionSet.options.map(o => ({
            id: o.id,
            title: o.title,
            cost: { energy: o.energy_cost, time: o.duration_min }
        }))
    }, tenantId);
}

/**
 * Emit: Task Committed (Collapser)
 * When an option is selected and becomes a real Task.
 */
export async function emitTaskCommitted(
    taskId: string,
    optionId: string,
    charges: LedgerCharge[],
    tenantId: string = "default"
) {
    // 1. Commit Event
    await emit("option.collapsed", {
        option_id: optionId,
        task_id: taskId,
        reason: "user_selection"
    }, tenantId);

    // 2. Ledger Events (Charge the accounts)
    for (const charge of charges) {
        await emit("ledger.posted", {
            amount: charge.amount,
            unit: charge.account === 'time' ? 'minutes' : 'points',
            segment: charge.segment_id, // e.g. "Work"
            account: charge.account,    // e.g. "Time"
            ref_id: taskId,
            direction: charge.direction
        }, tenantId);
    }
}
