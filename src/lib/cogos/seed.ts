import { getSqlClient, getTenantSchema } from "@/lib/events/client";

const LIFE_FOCUSES = [
    { id: 1, name: "Core" },
    { id: 2, name: "Self" },
    { id: 3, name: "Circle" },
    { id: 4, name: "Grind" },
    { id: 5, name: "Level Up" },
    { id: 6, name: "Impact" },
    { id: 7, name: "Play" },
    { id: 8, name: "Insight" },
    { id: 9, name: "Chaos" },
];

export async function seedDefaultsForUser(tenantId: string) {
    try {
        const sql = getSqlClient();
        // Default to 'nu' schema unless we have a specific tenant logic
        // But since we are using tenant schemas, let's derive it.
        const schema = getTenantSchema(tenantId);

        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        const quarterName = `Q${quarter} ${now.getFullYear()}`;
        const monthName = now.toLocaleDateString('en-US', { month: 'long' });
        const monthYear = `${monthName} ${now.getFullYear()}`;

        let createdGoals = 0;
        let createdProjects = 0;

        for (const lf of LIFE_FOCUSES) {
            // Check if goal already exists for this LF and quarter
            // IMPORTANT: Using dynamic schema requires ensuring it exists, which auth flow handles.
            const existingGoal = await sql.unsafe(
                `SELECT goal_id FROM ${schema}.goals 
         WHERE tenant_id = $1 AND lf_id = $2 AND title = $3 AND status = 'active'`,
                [tenantId, lf.id, `${lf.name} - ${quarterName}`]
            );

            let goalId;
            if (existingGoal.length === 0) {
                // Create quarterly goal
                goalId = crypto.randomUUID();
                await sql.unsafe(
                    `INSERT INTO ${schema}.goals (tenant_id, goal_id, lf_id, title, status, rationale, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'active', $5, now(), now())`,
                    [
                        tenantId,
                        goalId,
                        lf.id,
                        `${lf.name} - ${quarterName}`,
                        `Default quarterly goal for ${lf.name} life focus`
                    ]
                );
                createdGoals++;
            } else {
                goalId = existingGoal[0].goal_id;
            }

            // Check if project already exists for this goal and month
            const existingProject = await sql.unsafe(
                `SELECT project_id FROM ${schema}.projects 
         WHERE tenant_id = $1 AND goal_id = $2 AND title = $3 AND status = 'active'`,
                [tenantId, goalId, `${lf.name} - ${monthYear}`]
            );

            if (existingProject.length === 0) {
                // Create monthly project
                const projectId = crypto.randomUUID();
                await sql.unsafe(
                    `INSERT INTO ${schema}.projects (tenant_id, project_id, goal_id, title, status, description, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'active', $5, now(), now())`,
                    [
                        tenantId,
                        projectId,
                        goalId,
                        `${lf.name} - ${monthYear}`,
                        `Default monthly project for ${lf.name} life focus`
                    ]
                );
                createdProjects++;
            }
        }

        return { createdGoals, createdProjects };
    } catch (err) {
        console.error("[Seed Defaults Lib] Error:", err);
        throw err;
    }
}
