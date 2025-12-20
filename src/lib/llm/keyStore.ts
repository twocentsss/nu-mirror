import { getSqlClient } from "@/lib/events/client";
import { encryptSecret } from "@/lib/crypto/secrets";
import { newUlid } from "@/lib/id";

const DB_URL = process.env.DATABASE_URL;

export type LlmProvider = "openai" | "openrouter" | "gemini" | "anthropic" | "mistral";
export type StoredKeyRow = {
    id: string;
    user_email: string;
    provider: LlmProvider;
    label: string;
    encrypted_key_b64: string;
    disabled: boolean;
    daily_limit?: number;
    preferred?: boolean;
};

export async function listKeysForUser(
    userEmail: string,
    provider?: LlmProvider,
): Promise<StoredKeyRow[]> {
    if (!DB_URL) return [];
    const sql = getSqlClient(DB_URL);
    try {
        const rows = await sql`
            select key_id, user_email, provider, label, encrypted_key, is_active, daily_limit_tokens, is_preferred
            from nu.user_llm_keys
            where user_email = ${userEmail} 
            ${provider ? sql`and provider = ${provider}` : sql``}
            and is_active = true
        `;

        return rows.map((r: any) => ({
            id: r.key_id,
            user_email: r.user_email,
            provider: r.provider as LlmProvider,
            label: r.label || "",
            encrypted_key_b64: r.encrypted_key,
            disabled: !r.is_active,
            daily_limit: Number(r.daily_limit_tokens || 0),
            preferred: r.is_preferred
        }));
    } catch (e) {
        console.warn("[KeyStore] listKeysForUser failed", e);
        return [];
    }
}

export async function addKeyForUser(params: {
    userEmail: string;
    provider: LlmProvider;
    label?: string;
    apiKey: string;
    daily_limit?: number;
    preferred?: boolean;
}) {
    if (!DB_URL) throw new Error("Missing DATABASE_URL");
    const id = newUlid();
    const encrypted = encryptSecret(params.apiKey);
    const sql = getSqlClient(DB_URL);

    await sql.begin(async (sql: any) => {
        // If this is set as preferred, unset other preferred keys for this user
        if (params.preferred) {
            await sql`
                update nu.user_llm_keys
                set is_preferred = false, updated_at = now()
                where user_email = ${params.userEmail}
            `;
        }

        await sql`
            insert into nu.user_llm_keys (
                key_id, user_email, provider, label, encrypted_key, 
                is_active, is_preferred, daily_limit_tokens
            )
            values (
                ${id}, ${params.userEmail}, ${params.provider}, ${params.label || ""}, ${encrypted},
                true, ${!!params.preferred}, ${params.daily_limit || 0}
            )
        `;
    });

    return { id };
}

export async function disableKey(params: {
    keyId: string;
}) {
    if (!DB_URL) return { ok: false };
    const sql = getSqlClient(DB_URL);
    try {
        await sql`
            update nu.user_llm_keys
            set is_active = false, updated_at = now()
            where key_id = ${params.keyId}
        `;
        return { ok: true };
    } catch (e) {
        return { ok: false };
    }
}

export async function setKeyPreference(params: {
    keyId: string;
}) {
    if (!DB_URL) return { ok: false };
    const sql = getSqlClient(DB_URL);
    try {
        const [target] = await sql`
            select user_email, provider from nu.user_llm_keys where key_id = ${params.keyId}
        `;
        if (!target) return { ok: false, error: "Key not found" };

        const { user_email, provider } = target;

        await sql.begin(async (sql: any) => {
            // Unset all for this user
            await sql`
            update nu.user_llm_keys
            set is_preferred = false, updated_at = now()
            where user_email = ${user_email}
        `;
            // Set target
            await sql`
            update nu.user_llm_keys
            set is_preferred = true, updated_at = now()
            where key_id = ${params.keyId}
        `;
        });
        return { ok: true };
    } catch (e) {
        return { ok: false, error: "Failed to update preference" };
    }
}

