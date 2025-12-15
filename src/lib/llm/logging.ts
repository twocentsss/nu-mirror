import { makeGoogleClient } from "../google/googleClient";


import { getAccountSpreadsheetId } from "../google/accountSpreadsheet";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";

export type LLMUsageLog = {
    timestamp?: string;
    provider: "openai" | "openrouter" | "gemini";
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    context?: string; // e.g. "task_decomposition"
    keyId?: string;
};

const HEADERS = ["timestamp", "provider", "model", "prompt_tokens", "completion_tokens", "total_tokens", "context", "keyId"];

export async function logLlmUsage(log: LLMUsageLog) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return;

        const { accessToken, refreshToken } = session as any;
        if (!accessToken) return;

        const { sheets } = makeGoogleClient(accessToken, refreshToken);

        // Correct call signature
        const result = await getAccountSpreadsheetId({
            userEmail: session.user.email,
            accessToken,
            refreshToken
        }).catch(() => null);

        if (!result?.spreadsheetId) return;
        const { spreadsheetId } = result;

        // Ensure tab exists
        try {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        { addSheet: { properties: { title: "LLM_LOGS" } } }
                    ]
                }
            });
            // Add headers
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: "LLM_LOGS!A1",
                valueInputOption: "RAW",
                requestBody: { values: [HEADERS] }
            });
        } catch (e: any) {
            // Ignore if exists
        }

        const row = [
            new Date().toISOString(),
            log.provider,
            log.model,
            log.prompt_tokens,
            log.completion_tokens,
            log.total_tokens,
            log.context || "",
            log.keyId || ""
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "LLM_LOGS!A:A", // Append to end
            valueInputOption: "RAW",
            requestBody: { values: [row] },
        });
    } catch (err) {
        console.error("Failed to log LLM usage:", err);
    }
}

export async function getLlmUsageToday() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return {};

        const { accessToken, refreshToken } = session as any;
        if (!accessToken) return {};

        const { sheets } = makeGoogleClient(accessToken, refreshToken);

        const result = await getAccountSpreadsheetId({
            userEmail: session.user.email,
            accessToken,
            refreshToken
        }).catch(() => null);

        if (!result?.spreadsheetId) return {};
        const { spreadsheetId } = result;

        let res;
        try {
            res = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: "LLM_LOGS", // Fetch all data in the sheet
            });
        } catch (e: any) {
            // If usage sheet doesn't exist or other range error, return empty
            return { byProvider: {}, byKey: {}, grandTotal: 0 };
        }

        const rows = res.data.values || [];
        if (rows.length < 2) return {}; // Header only

        // Filter for today (UTC)
        const todayPrefix = new Date().toISOString().slice(0, 10);

        const stats: Record<string, { total: number }> = {
            openai: { total: 0 },
            openrouter: { total: 0 },
            gemini: { total: 0 }
        };
        const byKey: Record<string, number> = {};

        let grandTotal = 0;

        // Skip header
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const date = row[0];
            if (!date.startsWith(todayPrefix)) continue; // Not today

            const provider = (row[1] || "unknown").toLowerCase();
            const total = Number(row[5] || 0);
            const keyId = row[7] || "";

            if (!stats[provider]) stats[provider] = { total: 0 };
            stats[provider].total += total;
            grandTotal += total;

            if (keyId) {
                byKey[keyId] = (byKey[keyId] || 0) + total;
            }
        }

        return { byProvider: stats, byKey, grandTotal };
    } catch (err) {
        console.error("Failed to get stats", err);
        return {};
    }
}
