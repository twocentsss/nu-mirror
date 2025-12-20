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

    // 3. Check DB
    try {
        const { listKeysForUser } = await import("../llm/keyStore");
        const { decryptSecret } = await import("../crypto/secrets");

        const userKeys = await listKeysForUser(params.userEmail);
        if (userKeys && userKeys.length > 0) {
            // Find preferred or just use the first one
            const chosen = userKeys.find(k => k.preferred) || userKeys[0];
            const config = {
                provider: chosen.provider,
                apiKey: decryptSecret(chosen.encrypted_key_b64)
            };

            // Update Caches
            AI_KEY_CACHE.set(params.userEmail, { ...config, ts: Date.now() });
            if (redis) {
                const redisKey = `nu:ai_config:${params.userEmail}`;
                await redis.set(redisKey, config, { ex: REDIS_TTL });
            }

            return config;
        }
    } catch (err) {
        console.error("[resolveAiConfig] Postgres lookup failed", err);
    }

    // System Fallback
    if (process.env.OPENAI_API_KEY) {
        return { provider: "openai", apiKey: process.env.OPENAI_API_KEY };
    }

    return null;
}
