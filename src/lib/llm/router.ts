import { redis } from "@/lib/kv/redis";
import { decryptSecret } from "@/lib/crypto/secrets";
import { listKeysForUser } from "@/lib/llm/keyStore";

function nowMs() { return Date.now(); }

const memCooldown = new Map<string, number>();
const memInflight = new Map<string, number>();

async function getCooldown(keyId: string) {
    if (redis) {
        const v = await redis.get<number>(`llm:cooldown:${keyId}`);
        return v ?? 0;
    }
    return memCooldown.get(keyId) ?? 0;
}

async function setCooldown(keyId: string, untilMs: number) {
    if (redis) {
        await redis.set(`llm:cooldown:${keyId}`, untilMs, { px: Math.max(1, untilMs - nowMs()) });
        return;
    }
    memCooldown.set(keyId, untilMs);
}

async function inflightInc(keyId: string) {
    if (redis) return await redis.incr(`llm:inflight:${keyId}`);
    const v = (memInflight.get(keyId) ?? 0) + 1;
    memInflight.set(keyId, v);
    return v;
}

async function inflightDec(keyId: string) {
    if (redis) return await redis.decr(`llm:inflight:${keyId}`);
    const v = Math.max(0, (memInflight.get(keyId) ?? 0) - 1);
    memInflight.set(keyId, v);
    return v;
}

async function getInflight(keyId: string) {
    if (redis) return (await redis.get<number>(`llm:inflight:${keyId}`)) ?? 0;
    return memInflight.get(keyId) ?? 0;
}

export async function leaseKey(
    userEmail: string,
    provider: "openai" | "openrouter" | "gemini",
    spreadsheetId: string,
    tokens?: { accessToken?: string; refreshToken?: string },
) {
    const keys = await listKeysForUser(userEmail, provider, spreadsheetId, tokens);
    if (keys.length === 0) return null;

    const candidates: Array<{ id: string; encrypted: string; inflight: number }> = [];
    for (const k of keys) {
        const cd = await getCooldown(k.id);
        if (cd > nowMs()) continue;
        const inf = await getInflight(k.id);
        candidates.push({ id: k.id, encrypted: k.encrypted_key_b64, inflight: inf });
    }

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.inflight - b.inflight);

    const chosen = candidates[0];
    await inflightInc(chosen.id);

    return {
        keyId: chosen.id,
        apiKey: decryptSecret(chosen.encrypted),
    };
}

export async function releaseOpenAiKey(keyId: string) {
    await inflightDec(keyId);
}

export async function cooldownOpenAiKey(keyId: string, ms: number) {
    await setCooldown(keyId, nowMs() + ms);
}
