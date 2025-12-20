
import { createGroup } from "../src/lib/groups/groupStore";
import { sendMessage, listMessages } from "../src/lib/groups/messageStore";
import { getSqlClient } from "../src/lib/events/client";

const DB_URL = process.env.DATABASE_URL!;

async function run() {
    console.log("=== Verification - Messaging ===");

    const ownerEmail = "chat_owner@example.com";
    const groupName = "Chat Test Group " + Date.now();

    try {
        // 1. Create Group
        console.log(`Creating group '${groupName}'...`);
        const groupId = await createGroup(groupName, "Test Chat", ownerEmail);
        console.log(`Created Group ID: ${groupId}`);

        // 2. Send Message
        console.log("Sending message 1...");
        await sendMessage(groupId, ownerEmail, "Hello World!");

        console.log("Sending message 2...");
        await sendMessage(groupId, ownerEmail, "Second message");

        // 3. List Messages
        const msgs = await listMessages(groupId);
        console.log(`Retrieved ${msgs.length} messages:`);
        msgs.forEach(m => console.log(`- [${m.sender_email}]: ${m.content}`));

        if (msgs.length !== 2) throw new Error("Incorrect message count");
        if (msgs[0].content !== "Hello World!") throw new Error("Incorrect message order/content");

        console.log("SUCCESS: Messaging verified.");

    } catch (e) {
        console.error("Verification Failed:", e);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

run();
