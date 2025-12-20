import { readAllRows } from "../google/sheetStore";
import { getAccountSpreadsheetId } from "../google/accountSpreadsheet";
import { decryptSecret } from "../crypto/secrets";
import { LlmProvider } from "../llm/keyStore";
import { redis } from "../kv/redis";

const AI_KEY_CACHE = new Map<string, { provider: LlmProvider; apiKey: string; ts: number }>();
const MEM_TTL = 5 * 60 * 1000; // 5 mins in memory
const REDIS_TTL = 24 * 60 * 60; // 24 hours in Redis

export interface ResolvedAiConfig {
    provider: LlmProvider;
    apiKey: string;
}

/**
 * Resolves the personal AI configuration for a user by looking into their
 * private Google Sheet (LLM_KEYS tab).
 */
export async function resolveAiConfig(params: {
    userEmail: string;
    accessToken?: string;
    refreshToken?: string;
}): Promise<ResolvedAiConfig | null> {
    // 1. Check L1 Cache (Memory)
    const cached = AI_KEY_CACHE.get(params.userEmail);
    if (cached && Date.now() - cached.ts < MEM_TTL) {
        return { provider: cached.provider, apiKey: cached.apiKey };
    }

    // 2. Check L2 Cache (Redis)
    if (redis) {
        try {
            const redisKey = `nu:ai_config:${params.userEmail}`;
            const stored = await redis.get<{ provider: LlmProvider; apiKey: string }>(redisKey);
            if (stored) {
                AI_KEY_CACHE.set(params.userEmail, { ...stored, ts: Date.now() });
                return stored;
            }
        } catch (err) {
            console.error("[resolveAiConfig] Redis L2 check failed", err);
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
            tab: "LLM_KEYS",
            accessToken: params.accessToken,
            refreshToken: params.refreshToken
        });

        const preferredRow = rows.find(r => r[9] === "1" && r[7] !== "1");

        if (preferredRow) {
            const provider = String(preferredRow[2]) as LlmProvider;
            const encryptedKey = String(preferredRow[4]);

            try {
                const apiKey = decryptSecret(encryptedKey);
                const config = { provider, apiKey };

                // Populate Caches
                AI_KEY_CACHE.set(params.userEmail, { ...config, ts: Date.now() });
                if (redis) {
                    await redis.set(`nu:ai_config:${params.userEmail}`, config, { ex: REDIS_TTL });
                }

                return config;
            } catch (decErr) {
                console.error(`[resolveAiConfig] Decryption failed for ${params.userEmail}`, decErr);
            }
        }
    } catch (err) {
        console.warn(`[resolveAiConfig] Failed to fetch from Sheet for ${params.userEmail}`, err);
    }

    // System Fallback
    if (process.env.OPENAI_API_KEY) {
        return { provider: "openai", apiKey: process.env.OPENAI_API_KEY };
    }

    return null;
}
