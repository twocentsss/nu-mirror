import { readAllRows } from "../google/sheetStore";
import { getAccountSpreadsheetId } from "../google/accountSpreadsheet";
import { redis } from "../kv/redis";

const STORAGE_URL_CACHE = new Map<string, { url: string; ts: number }>();
const MEM_TTL = 5 * 60 * 1000; // 5 mins in memory
const REDIS_TTL = 24 * 60 * 60; // 24 hours in Redis

/**
 * Resolves the personal Postgres storage URL for a user by looking into their
 * private Google Sheet (Meta tab).
 * 
 * Scalability Fix: Uses Redis for a 24h cache to prevent Google Sheets throttling.
 */
export async function resolveStorageUrl(params: {
    userEmail?: string;
    accessToken?: string;
    refreshToken?: string;
}): Promise<string | null> {
    const globalUrl = process.env.DATABASE_URL || null;

    if (!params.userEmail) {
        return globalUrl;
    }

    // 1. Check L1 Cache (Memory)
    const cached = STORAGE_URL_CACHE.get(params.userEmail);
    if (cached && Date.now() - cached.ts < MEM_TTL) {
        return cached.url;
    }

    // 2. Check L2 Cache (Redis)
    if (redis) {
        try {
            const redisKey = `nu:storage_url:${params.userEmail}`;
            const url = await redis.get<string>(redisKey);
            if (url) {
                STORAGE_URL_CACHE.set(params.userEmail, { url, ts: Date.now() });
                return url;
            }
        } catch (err) {
            console.error("[resolveStorageUrl] Redis L2 check failed", err);
        }
    }

    // 3. Fallback to Sheets (Discovery)
    try {
        const { spreadsheetId } = await getAccountSpreadsheetId({
            userEmail: params.userEmail,
            accessToken: params.accessToken,
            refreshToken: params.refreshToken
        });

        const { rows } = await readAllRows({
            spreadsheetId,
            tab: "Meta",
            accessToken: params.accessToken,
            refreshToken: params.refreshToken
        });

        const dbUrlRow = rows.find(r => r[0] === "DATABASE_URL");
        if (dbUrlRow?.[1]) {
            const url = String(dbUrlRow[1]);

            // Populate Caches
            STORAGE_URL_CACHE.set(params.userEmail, { url, ts: Date.now() });
            if (redis) {
                await redis.set(`nu:storage_url:${params.userEmail}`, url, { ex: REDIS_TTL });
            }

            return url;
        }
    } catch (err) {
        console.warn(`[resolveStorageUrl] Failed to fetch from Sheet for ${params.userEmail}`, err);
    }

    return globalUrl;
}

export interface StorageStatus {
    isByo: boolean;
    trialStartAt?: string;
    daysLeft?: number;
}

export async function getStorageStatus(params: {
    userEmail: string;
    accessToken?: string;
    refreshToken?: string;
}): Promise<StorageStatus> {
    try {
        const { spreadsheetId } = await getAccountSpreadsheetId({
            userEmail: params.userEmail,
            accessToken: params.accessToken,
            refreshToken: params.refreshToken
        });

        const { rows } = await readAllRows({
            spreadsheetId,
            tab: "Meta",
            accessToken: params.accessToken,
            refreshToken: params.refreshToken
        });

        const isByo = rows.some(r => r[0] === "DATABASE_URL" && r[1]);
        const trialStartRow = rows.find(r => r[0] === "TRIAL_START_AT");

        const status: StorageStatus = { isByo };

        if (!isByo && trialStartRow?.[1]) {
            const start = new Date(String(trialStartRow[1]));
            const now = new Date();
            const diffDays = 7 - (now.getTime() - start.getTime()) / (1000 * 3600 * 24);
            status.trialStartAt = String(trialStartRow[1]);
            status.daysLeft = Math.max(0, Math.floor(diffDays));
        }

        return status;
    } catch (err) {
        return { isByo: false };
    }
}
