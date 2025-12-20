
import { loadEnvConfig } from "@next/env";
import { aggregatePlatformMetrics, incrementDailyMetric } from "../src/lib/analytics/telemetryStore";
import { getSqlClient } from "../src/lib/events/client";

// Load env vars
loadEnvConfig(process.cwd());

// Mock data generators
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

async function simulateTraffic() {
    console.log("=== Simulating 10M User Narrative Traffic ===");
    const sql = getSqlClient();

    // We will simulate the last 7 days
    const days = 7;
    const now = new Date();

    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStr = date.toISOString().split('T')[0];

        console.log(`Generating data for ${dayStr}...`);

        // 1. DAU - Scale heavily for the narrative
        // Base DAU around 8-10M for the "10M User" claim
        const dau = randomInt(8500000, 10500000);
        await incrementDailyMetric(dayStr, 'platform.dau', dau);

        // 2. Life - Tasks
        // "100M Tasks" -> daily volume huge. ~10 tasks per user? 100M.
        const tasks = Math.floor(dau * randomInt(8, 12));
        await incrementDailyMetric(dayStr, 'life.tasks.created', tasks);

        // Goals Closed (Net 200% growth? let's just put big numbers)
        const goals = Math.floor(dau * 0.5); // 5M goals
        await incrementDailyMetric(dayStr, 'life.goals.completed', goals);

        // 3. Story - "10M Stories, 4M Characters"
        const stories = Math.floor(dau * 1.2); // ~12M stories
        await incrementDailyMetric(dayStr, 'story.generated', stories);

        // 4. Emotions (derived from stories usually, but we inject metric directly)
        const emotions = stories * 4; // "4M emotions"? no, prompt said "4M characters displaying 4M emotions". 
        // Let's assume high numbers.
        await incrementDailyMetric(dayStr, 'story.emotions.detected', emotions);

        // 5. Social
        const messages = dau * randomInt(20, 50); // High chat volume
        await incrementDailyMetric(dayStr, 'social.messages.sent', messages);

        // 6. Games
        const bingos = Math.floor(dau * 0.3);
        await incrementDailyMetric(dayStr, 'games.bingo.completed', bingos);
    }

    console.log("Simulation complete. Metrics populated.");
    process.exit(0);
}

simulateTraffic();
