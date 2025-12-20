
import { leaseKey, releaseLlmKey, cooldownLlmKey } from "../src/lib/llm/router";
import { getSqlClient } from "../src/lib/events/client";
import { encryptSecret } from "../src/lib/crypto/secrets";
import { newUlid } from "../src/lib/id";

// MOCK ENVIRONMENT
const TEST_EMAIL = "test_smart_route@example.com";
const DB_URL = process.env.DATABASE_URL!;
if (!DB_URL) { console.error("No DATABASE_URL"); process.exit(1); }

const sql = getSqlClient(DB_URL);

async function run() {
    console.log("=== Verification - Smart Routing & Admin APIs ===");

    // 1. Setup Multiple System Keys (Good & Bad)
    const badKeyId = newUlid();
    const goodKeyId = newUlid();
    const badKey = "sk-bad-123456";
    const goodKey = "sk-good-123456"; // Mock good key

    try {
        console.log("Inserting system keys (1 Bad, 1 Good)...");
        await sql`
            insert into nu.system_llm_keys (key_id, provider, encrypted_key, label, global_daily_limit_tokens)
            values 
                (${badKeyId}, 'openai', ${encryptSecret(badKey)}, 'Bad Key', 1000),
                (${goodKeyId}, 'openai', ${encryptSecret(goodKey)}, 'Good Key', 1000)
        `;

        // 2. Test Smart Routing Logic (Simulate Retry Loop)
        // We will manually call leaseKey, "fail", cooldown, and call again to see if we get the other key.

        console.log("Attempt 1: Leasing a key...");
        // Exclusion list empty initially
        const excluded: string[] = [];

        // This should randomly pick one. If it picks good, we exclude and try again to force picking bad (or vice versa).
        let lease1 = await leaseKey(TEST_EMAIL, 'openai', 'dummy', undefined, excluded);
        if (!lease1) throw new Error("Lease 1 failed");

        console.log(`Lease 1 got: ${lease1.keyId} (${lease1.apiKey === badKey ? "BAD" : "GOOD"})`);

        // Simulate failure of Lease 1
        console.log("Simulating failure of Lease 1...");
        excluded.push(lease1.keyId);
        // await cooldownLlmKey(lease1.keyId, 60000); // Optional: router checks excluded anyway

        console.log("Attempt 2: Leasing with exclusion...");
        let lease2 = await leaseKey(TEST_EMAIL, 'openai', 'dummy', undefined, excluded);
        if (!lease2) throw new Error("Lease 2 failed");

        console.log(`Lease 2 got: ${lease2.keyId} (${lease2.apiKey === badKey ? "BAD" : "GOOD"})`);

        if (lease1.keyId === lease2.keyId) {
            console.error("FAILED: Got same key despite exclusion!");
        } else {
            console.log("SUCCESS: Rotated to different key.");
        }

        // 3. Test Usage Tracking via SQL directly
        // We already tested this in Phase 1 verification script.

        // 4. Test User Usage API (Mock Request)
        console.log("Simulating Admin API usage fetch...");
        // Cannot easily test Next.js API handler here without full mock, 
        // but we can verify DB query logic works.
        const usageRows = await sql`select * from nu.system_key_usage where user_email = ${TEST_EMAIL}`;
        console.log(`Found ${usageRows.length} usage records for test user.`);

    } catch (e) {
        console.error("Verification Failed:", e);
    } finally {
        console.log("Cleanup...");
        await sql`delete from nu.system_llm_keys where key_id in (${badKeyId}, ${goodKeyId})`;
        process.exit(0);
    }
}

run();
