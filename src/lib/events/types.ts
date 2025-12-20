// Core types re-defined here to match TONL schema self-containment
// Actually core types doesn't have Id/Ts/Key/KV, we should check or define them here.
// Let's define them here to be self-contained matching TONL schema.

export type Id = string; // uuid
export type Ts = number; // unix ms
export type Key = string;
export type Path = string;
export type Hash = string;

export interface KV {
    k: Key;
    v: any;
}

export type EvtType =
    | 'activity.created' | 'activity.updated'
    | 'task.created' | 'task.updated' | 'task.status_set'
    | 'task.archived' | 'task.restored'
    | 'ledger.posted'
    | 'audit.segment.scored'
    | 'report.generated'
    // Social Domain
    | 'social.post_created' | 'social.reaction_added'
    | 'social.friend_requested' | 'social.friend_accepted'
    | 'social.wall_shared'
    // Games Domain
    | 'game.bingo_marked' | 'game.bingo_won' | 'game.match_started'
    // Creative Domain
    | 'creative.story_drafted' | 'creative.asset_generated' | 'creative.comic_published'
    | 'story.generated'
    // Platform / Scaling
    | 'platform.addon_enabled' | 'platform.storage_attached'
    ;

export interface Envelope {
    id: Id;
    ts: Ts;
    src: string;
    ver: string;
    kind: 'cmd' | 'evt' | 'qry' | 'res' | 'err';
    trace: {
        traceId: Id;
        spanId: Id;
        parentSpanId?: Id;
    };
    auth?: {
        actorId?: Id;
        tenantId?: Id;
        scopes?: string[];
    };
    meta?: KV[];
}

export interface Event<TBody = any> {
    env: Envelope;
    type: EvtType;
    agg: {
        kind: string; // "activity" | "task" | "ledger" ...
        id: Id;
    };
    seq: number;
    prevHash?: Hash;
    body: TBody;
    hash?: Hash;
}

// Specific Event Bodies

export interface LedgerPostedBody {
    amount: number;
    unit: string;
    bucket: string; // e.g., "grind", "core"
    memo: string;
    refId?: string; // task_uuid
    segments?: Record<string, any>; // critical for report mapping
}

export interface TaskStatusSetBody {
    status: string;
    prevStatus: string;
    reason?: string;
}
