
import { createGroup, addMemberToGroup, listUserGroups, getGroupDetails, removeMemberFromGroup, getGroupMembers } from "../src/lib/groups/groupStore";
import { getSqlClient } from "../src/lib/events/client";

const DB_URL = process.env.DATABASE_URL!;
if (!DB_URL) { console.error("No DATABASE_URL"); process.exit(1); }
const sql = getSqlClient(DB_URL);

async function run() {
    console.log("=== Verification - Group Management ===");

    const ownerEmail = "owner@example.com";
    const memberEmail = "member@example.com";
    const groupName = "Test Group " + Date.now();

    try {
        // 1. Create Group
        console.log(`Creating group '${groupName}' for ${ownerEmail}...`);
        const groupId = await createGroup(groupName, "Test Description", ownerEmail);
        console.log(`Created Group ID: ${groupId}`);

        // 2. Add Member
        console.log(`Adding ${memberEmail} to group...`);
        await addMemberToGroup(groupId, memberEmail);

        // 3. Verify Lists
        const ownerGroups = await listUserGroups(ownerEmail);
        console.log(`Owner has ${ownerGroups.length} groups.`);
        if (!ownerGroups.find(g => g.id === groupId)) throw new Error("Group not found in owner list");

        const memberGroups = await listUserGroups(memberEmail);
        console.log(`Member has ${memberGroups.length} groups.`);
        if (!memberGroups.find(g => g.id === groupId)) throw new Error("Group not found in member list");

        // 4. Verify Details & Members
        const details = await getGroupDetails(groupId, ownerEmail);
        console.log(`Group Details: ${details?.name} (Role: ${details?.role})`);

        const members = await getGroupMembers(groupId);
        console.log(`Group has ${members.length} members.`);
        if (members.length !== 2) throw new Error("Incorrect member count");

        // 5. Remove Member
        console.log("Removing member...");
        await removeMemberFromGroup(groupId, memberEmail);
        const membersAfter = await getGroupMembers(groupId);
        console.log(`Group now has ${membersAfter.length} members.`);
        if (membersAfter.length !== 1) throw new Error("Member removal failed");

        console.log("SUCCESS: All checks passed.");

    } catch (e) {
        console.error("Verification Failed:", e);
    } finally {
        // Cleanup (Optional, but good for test hygiene)
        // await sql`delete from nu.groups where name like 'Test Group%'`; // Be careful with cleanup
        process.exit(0);
    }
}

run();
