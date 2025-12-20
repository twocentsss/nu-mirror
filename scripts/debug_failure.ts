
import { getSqlClient } from "../src/lib/events/client";
import { getActiveSystemKeys, checkUserSystemUsage } from "../src/lib/admin/adminStore";
import { leaseKey } from "../src/lib/llm/router";
import { decryptSecret } from "../src/lib/crypto/secrets";

const DB_URL = process.env.DATABASE_URL!;
if (!DB_URL) { console.error("No DATABASE_URL"); process.exit(1); }
const sql = getSqlClient(DB_URL);

async function run() {
    console.log("=== Debugging Admin Keys & Routing ===");

    // 1. Check System Keys in DB
    console.log("Checking 'nu.system_llm_keys'...");
    try {
        const keys = await sql`select * from nu.system_llm_keys`;
        console.log(`Found ${keys.length} keys in DB.`);
        keys.forEach(k => {
            console.log(` - ID: ${k.key_id}, Provider: ${k.provider}, Label: ${k.label}, Active: ${k.is_active}, Limit: ${k.global_daily_limit_tokens}`);
            // Check decryption
            try {
                const dec = decryptSecret(k.encrypted_key);
                console.log(`   (Decryption Check: OK, starts with ${dec.substring(0, 4)}...)`);
            } catch (e) {
                console.error(`   (Decryption FAILED: ${(e as any).message})`);
            }
        });
    } catch (e) {
        console.error("DB Error listing keys:", e);
    }

    // 2. Check Active Keys via Store
    console.log("\nChecking getActiveSystemKeys('openai')...");
    try {
        const active = await getActiveSystemKeys('openai');
        console.log(`Store returned ${active.length} active OpenAI keys.`);
        active.forEach(k => console.log(` - ${k.label} (${k.limit})`));
    } catch (e) {
        console.error("Store Error:", e);
    }

    // 3. Simulate Lease (Primary Logic)
    const TEST_EMAIL = "debug_user@example.com";
    console.log(`\nSimulating leaseKey for ${TEST_EMAIL} (OpenAI)...`);
    try {
        // Mocking empty user keys by passing dummy spreadsheet
        const lease = await leaseKey(TEST_EMAIL, 'openai', 'dummy_sheet_id');
        if (lease) {
            console.log("Lease SUCCESS:", { keyId: lease.keyId, isSystem: lease.isSystem, provider: lease.apiKey.startsWith('sk-') ? 'openai' : 'other' });
        } else {
            console.log("Lease FAILED (returned null).");
        }
    } catch (e) {
        console.error("Lease Error:", e);
    }

    process.exit(0);
}

run();
