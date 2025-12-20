
import { createGroup } from "../src/lib/groups/groupStore";
import { addGoal, toggleGoal, listGoals } from "../src/lib/groups/goalStore";

async function run() {
    console.log("=== Verification - Goals ===");

    const ownerEmail = "goals_owner@example.com";
    const groupName = "Goal Test Group " + Date.now();

    try {
        // 1. Create Group
        console.log(`Creating group '${groupName}'...`);
        const groupId = await createGroup(groupName, "Test Goals", ownerEmail);
        console.log(`Created Group ID: ${groupId}`);

        // 2. Add Goal
        console.log("Adding goal 'Finish Project'...");
        const goal1 = await addGoal(groupId, "Finish Project");
        console.log(`Goal 1 Created: ${goal1.id}`);

        // 3. List Goals
        let goals = await listGoals(groupId);
        console.log(`Retrieved ${goals.length} goals.`);
        if (goals.length !== 1 || goals[0].title !== "Finish Project") throw new Error("Incorrect goal list");

        // 4. Toggle Goal
        console.log("Toggling goal to complete...");
        const toggled = await toggleGoal(goal1.id, true);
        if (!toggled.is_completed) throw new Error("Goal failed to toggle");

        goals = await listGoals(groupId);
        if (!goals[0].is_completed) throw new Error("List did not reflect toggle");

        console.log("SUCCESS: Goals verified.");

    } catch (e) {
        console.error("Verification Failed:", e);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

run();
