import { redis } from "@/lib/kv/redis";
import { decryptSecret } from "@/lib/crypto/secrets";
import { listKeysForUser, StoredKeyRow } from "@/lib/llm/keyStore";
import { getActiveSystemKeys, checkUserSystemUsage } from "@/lib/admin/adminStore";


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
    provider: "openai" | "openrouter" | "gemini" | "anthropic",
    _spreadsheetId?: string,
    _tokens?: { accessToken?: string; refreshToken?: string },
    excludeKeyIds?: string[],
) {
    let keys: StoredKeyRow[] = [];

    try {
        // Fetch all keys to support better fallback/preferences
        keys = await listKeysForUser(userEmail);
    } catch (e) {
        console.warn(`[leaseKey] Failed to list keys for ${userEmail}:`, e);
        // Continue to fallback
    }

    const candidates: Array<{
        id: string;
        encrypted?: string;
        decryptedKey?: string;
        inflight: number;
        preferred: boolean;
        isSystem: boolean;
        keyProvider: string;
    }> = [];

    for (const k of keys) {
        if (excludeKeyIds?.includes(k.id)) continue;

        // If a specific provider was requested, we strongly prefer it.
        // But we allow others if they are the user's "preferred" key.
        const providerMatch = k.provider === provider;
        if (!providerMatch && !k.preferred) continue;

        const cd = await getCooldown(k.id);
        if (cd > nowMs()) continue;
        const inf = await getInflight(k.id);
        candidates.push({
            id: k.id,
            encrypted: k.encrypted_key_b64,
            inflight: inf,
            preferred: k.preferred ?? false,
            isSystem: false,
            keyProvider: k.provider
        });
    }

    console.log(`[leaseKey] Eligible user candidates found: ${candidates.length} (Requested: ${provider})`);


    // Fallback: System Keys
    if (candidates.length === 0) {
        console.log("[leaseKey] No user keys, trying fallback...");

        let sysKeys = await getActiveSystemKeys(provider);

        // If no keys for this provider, try compatible fallbacks
        if (sysKeys.length === 0) {
            if (provider === "openai") {
                console.log("[leaseKey] No OpenAI keys, trying OpenRouter fallback...");
                sysKeys = await getActiveSystemKeys("openrouter");
            } else if (provider === "openrouter") { // Rare case
                console.log("[leaseKey] No OpenRouter keys, trying OpenAI fallback...");
                sysKeys = await getActiveSystemKeys("openai");
            } else if (provider === "anthropic") {
                console.log("[leaseKey] No Anthropic keys, trying OpenRouter fallback...");
                sysKeys = await getActiveSystemKeys("openrouter");
            }
        }

        console.log(`[leaseKey] System keys found: ${sysKeys.length}`);

        // If still no system keys from DB, check environment variables
        if (sysKeys.length === 0) {
            console.log("[leaseKey] No DB system keys, checking environment variables...");
            if (provider === "openai" && process.env.OPENAI_API_KEY) {
                console.log("[leaseKey] Using OPENAI_API_KEY from environment");
                candidates.push({
                    id: "env_openai",
                    encrypted: "",
                    decryptedKey: process.env.OPENAI_API_KEY,
                    inflight: 0,
                    preferred: false,
                    isSystem: true,
                    keyProvider: "openai"
                });
            } else if (provider === "gemini" && process.env.GEMINI_API_KEY) {
                console.log("[leaseKey] Using GEMINI_API_KEY from environment");
                candidates.push({
                    id: "env_gemini",
                    encrypted: "",
                    decryptedKey: process.env.GEMINI_API_KEY,
                    inflight: 0,
                    preferred: false,
                    isSystem: true,
                    keyProvider: "gemini"
                });
            } else if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
                console.log("[leaseKey] Using ANTHROPIC_API_KEY from environment");
                candidates.push({
                    id: "env_anthropic",
                    encrypted: "",
                    decryptedKey: process.env.ANTHROPIC_API_KEY,
                    inflight: 0,
                    preferred: false,
                    isSystem: true,
                    keyProvider: "anthropic"
                });
            }
        } else if (sysKeys.length > 0) {
            const usage = await checkUserSystemUsage(userEmail);
            // Check if user is under the limit (e.g. 10k hardcoded for now or use key.limit)
            // We use the limit from the key or default 10k

            for (const k of sysKeys) {
                if (excludeKeyIds?.includes(k.key_id)) continue;
                const limit = k.limit || 10000;
                if (usage < limit) {
                    const cd = await getCooldown(k.key_id);
                    if (cd > nowMs()) continue;
                    const inf = await getInflight(k.key_id);
                    candidates.push({
                        id: k.key_id,
                        encrypted: "",
                        decryptedKey: k.key,
                        inflight: inf,
                        preferred: false,
                        isSystem: true,
                        keyProvider: k.provider
                    });
                }
            }
        }

        // Final fallback: if still no candidates after checking DB, try environment variables
        if (candidates.length === 0) {
            console.log("[leaseKey] No available candidates from DB, trying environment variables as last resort...");
            if ((provider === "openai" || provider === "openrouter") && process.env.OPENAI_API_KEY) {
                console.log("[leaseKey] Using OPENAI_API_KEY from environment");
                candidates.push({
                    id: "env_openai",
                    encrypted: "",
                    decryptedKey: process.env.OPENAI_API_KEY,
                    inflight: 0,
                    preferred: false,
                    isSystem: true,
                    keyProvider: "openai"
                });
            } else if (provider === "gemini" && process.env.GEMINI_API_KEY) {
                console.log("[leaseKey] Using GEMINI_API_KEY from environment");
                candidates.push({
                    id: "env_gemini",
                    encrypted: "",
                    decryptedKey: process.env.GEMINI_API_KEY,
                    inflight: 0,
                    preferred: false,
                    isSystem: true,
                    keyProvider: "gemini"
                });
            } else if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
                console.log("[leaseKey] Using ANTHROPIC_API_KEY from environment");
                candidates.push({
                    id: "env_anthropic",
                    encrypted: "",
                    decryptedKey: process.env.ANTHROPIC_API_KEY,
                    inflight: 0,
                    preferred: false,
                    isSystem: true,
                    keyProvider: "anthropic"
                });
            } else if (provider === "openrouter" && process.env.OPENROUTER_API_KEY) {
                console.log("[leaseKey] Using OPENROUTER_API_KEY from environment");
                candidates.push({
                    id: "env_openrouter",
                    encrypted: "",
                    decryptedKey: process.env.OPENROUTER_API_KEY,
                    inflight: 0,
                    preferred: false,
                    isSystem: true,
                    keyProvider: "openrouter"
                });
            }
        }
    }

    if (candidates.length === 0) return null;

    // Shuffle candidates to support random failover among equals (especially system keys)
    // We only shuffle if they have equal priority, but simpler to just shuffle first then sort strictly.
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    candidates.sort((a, b) => {
        // Preference 1: User Preferred AND Provider Match
        const aPrefMatch = a.preferred && a.keyProvider === provider;
        const bPrefMatch = b.preferred && b.keyProvider === provider;
        if (aPrefMatch && !bPrefMatch) return -1;
        if (!aPrefMatch && bPrefMatch) return 1;

        // Preference 2: Provider Match
        const aMatch = a.keyProvider === provider;
        const bMatch = b.keyProvider === provider;
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;

        // Preference 3: User Preferred (even if provider doesn't match)
        if (a.preferred && !b.preferred) return -1;
        if (!a.preferred && b.preferred) return 1;

        // Preference 4: Lower inflight
        return a.inflight - b.inflight;
    });

    const chosen = candidates[0];
    await inflightInc(chosen.id);

    return {
        keyId: chosen.id,
        apiKey: chosen.isSystem ? chosen.decryptedKey! : decryptSecret(chosen.encrypted!),
        preferred: chosen.preferred,
        isSystem: chosen.isSystem
    };
}

export async function releaseOpenAiKey(keyId: string) {
    await inflightDec(keyId);
}

export async function cooldownOpenAiKey(keyId: string, ms: number) {
    await setCooldown(keyId, nowMs() + ms);
}
