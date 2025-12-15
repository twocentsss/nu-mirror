import { readAllRows, updateRowById, appendRow } from "@/lib/google/sheetStore";
import { encryptSecret } from "@/lib/crypto/secrets";
import { newUlid } from "@/lib/id";

export type LlmProvider = "openai" | "openrouter" | "gemini";
export type StoredKeyRow = {
    id: string;
    user_email: string;
    provider: LlmProvider;
    label: string;
    encrypted_key_b64: string;
    disabled: boolean;
    daily_limit?: number; // Max tokens per day (0 = unlimited)
    preferred?: boolean; // Prefer this key when routing
};

export async function listKeysForUser(
    userEmail: string,
    provider: LlmProvider,
    spreadsheetId: string,
    tokens?: { accessToken?: string; refreshToken?: string },
): Promise<StoredKeyRow[]> {
    const { rows } = await readAllRows({
        spreadsheetId,
        tab: "LLM_KEYS",
        accessToken: tokens?.accessToken,
        refreshToken: tokens?.refreshToken,
    });

    return rows
        .map((r) => ({
            id: String(r?.[0] ?? ""),
            user_email: String(r?.[1] ?? ""),
            provider: String(r?.[2] ?? "openai") as LlmProvider,
            label: String(r?.[3] ?? ""),
            encrypted_key_b64: String(r?.[4] ?? ""),
            disabled: String(r?.[7] ?? "0") === "1",
            daily_limit: Number(r?.[8] ?? 0) || 0,
            preferred: String(r?.[9] ?? "0") === "1",
        }))
        .filter((k) => k.id && k.user_email.toLowerCase() === userEmail.toLowerCase() && k.provider === provider && !k.disabled);
}

export async function addKeyForUser(params: {
    userEmail: string;
    provider: LlmProvider;
    label?: string;
    apiKey: string;
    spreadsheetId: string;
    accessToken?: string;
    refreshToken?: string;
    daily_limit?: number;
    preferred?: boolean;
}) {
    const id = newUlid();
    const now = new Date().toISOString();
    const encrypted = encryptSecret(params.apiKey);

    await appendRow({
        spreadsheetId: params.spreadsheetId,
        tab: "LLM_KEYS",
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
        values: [
            id,
            params.userEmail,
            params.provider,
            params.label ?? "",
            encrypted,
            now,
            now,
            "0", // disabled
            String(params.daily_limit ?? 0), // daily_limit
            params.preferred ? "1" : "0" // preferred
        ],
    });

    return { id };
}

export async function disableKey(params: {
    keyId: string;
    spreadsheetId: string;
    accessToken?: string;
    refreshToken?: string;
}) {
    // row format: [id, user_email, provider, label, encrypted, created_at, updated_at, disabled]
    // We'll read and rewrite the row by id (using your sheetStore updateRowById).
    const { rows } = await readAllRows({
        spreadsheetId: params.spreadsheetId,
        tab: "LLM_KEYS",
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
    });
    const row = rows.find((r) => String(r?.[0] ?? "") === params.keyId);
    if (!row) return { ok: false };

    const updated = [...row];
    updated[6] = new Date().toISOString();
    updated[7] = "1";

    await updateRowById({
        spreadsheetId: params.spreadsheetId,
        tab: "LLM_KEYS",
        id: params.keyId,
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
        values: updated,
    });

    return { ok: true };
}

export async function setKeyPreference(params: {
    keyId: string;
    spreadsheetId: string;
    accessToken?: string;
    refreshToken?: string;
}) {
    const { rows } = await readAllRows({
        spreadsheetId: params.spreadsheetId,
        tab: "LLM_KEYS",
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
    });

    const targetRow = rows.find((r) => String(r?.[0] ?? "") === params.keyId);
    if (!targetRow) return { ok: false, error: "Key not found" };

    const provider = String(targetRow[2] ?? "");
    const userEmail = String(targetRow[1] ?? "");

    // We need to update all keys for this user (GLOBAL preference, not just per provider)
    // Set target to 1, others to 0
    const updates = [];
    for (const row of rows) {
        const rId = String(row?.[0] ?? "");
        const rEmail = String(row?.[1] ?? "");
        // const rProvider = String(row?.[2] ?? "");

        if (rEmail === userEmail) {
            const isTarget = rId === params.keyId;
            const currentPref = String(row?.[9] ?? "0");
            const newPref = isTarget ? "1" : "0";

            if (currentPref !== newPref) {
                const updated = [...row];
                updated[6] = new Date().toISOString(); // updated_at
                updated[9] = newPref;
                updates.push({ id: rId, values: updated });
            }
        }
    }

    for (const update of updates) {
        await updateRowById({
            spreadsheetId: params.spreadsheetId,
            tab: "LLM_KEYS",
            id: update.id,
            accessToken: params.accessToken,
            refreshToken: params.refreshToken,
            values: update.values,
        });
    }

    return { ok: true };
}
