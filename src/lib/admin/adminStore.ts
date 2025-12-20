import { getSqlClient } from "@/lib/events/client";
import { decryptSecret } from "@/lib/crypto/secrets";

// Use the global DATABASE_URL by default
const DB_URL = process.env.DATABASE_URL;

export type SystemKey = {
    key_id: string;
    provider: "openai" | "openrouter" | "gemini";
    key: string; // Decrypted
    label: string;
    limit: number;
};

export async function checkIsSuperAdmin(email: string): Promise<boolean> {
    if (!DB_URL || !email) return false;
    const sql = getSqlClient(DB_URL);
    try {
        const [row] = await sql`
            select email from nu.super_admins 
            where email = ${email}
        `;
        return !!row;
    } catch (e) {
        console.warn("[AdminStore] checkIsSuperAdmin failed", e);
        return false;
    }
}

export async function addSuperAdmin(email: string) {
    if (!DB_URL) return;
    const sql = getSqlClient(DB_URL);
    await sql`
        insert into nu.super_admins (email)
        values (${email})
        on conflict (email) do nothing
    `;
}

export async function getActiveSystemKeys(provider: string): Promise<SystemKey[]> {
    if (!DB_URL) return [];
    const sql = getSqlClient(DB_URL);
    try {
        const rows = await sql`
            select key_id, provider, encrypted_key, label, global_daily_limit_tokens
            from nu.system_llm_keys
            where is_active = true and provider = ${provider}
        `;

        return rows.map((r: any) => ({
            key_id: r.key_id,
            provider: r.provider as any,
            key: decryptSecret(r.encrypted_key),
            label: r.label,
            limit: r.global_daily_limit_tokens
        }));
    } catch (e) {
        console.warn("[AdminStore] getActiveSystemKeys failed", e);
        return [];
    }
}

export async function checkUserSystemUsage(email: string): Promise<number> {
    if (!DB_URL) return 0;
    const sql = getSqlClient(DB_URL);
    const day = new Date().toISOString().split('T')[0];

    try {
        const [row] = await sql`
            select tokens_used from nu.system_key_usage
            where user_email = ${email} and day = ${day}
        `;
        return row?.tokens_used ?? 0;
    } catch (e) {
        return 0; // Fail open (allow usage if DB err, or fail closed? strict limit -> fail closed, but for UX fail open is better)
    }
}

export async function incrementUserSystemUsage(email: string, tokens: number) {
    if (!DB_URL || tokens <= 0) return;
    const sql = getSqlClient(DB_URL);
    const day = new Date().toISOString().split('T')[0];

    try {
        await sql`
            insert into nu.system_key_usage (user_email, day, tokens_used)
            values (${email}, ${day}, ${tokens})
            on conflict (user_email, day)
            do update set tokens_used = nu.system_key_usage.tokens_used + ${tokens}
        `;
    } catch (e) {
        console.warn("[AdminStore] incrementUserSystemUsage failed", e);
    }
}
