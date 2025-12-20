
import { getSqlClient } from "@/lib/events/client";
import { newUlid } from "@/lib/id";

const DB_URL = process.env.DATABASE_URL;

export type GroupGoal = {
    id: string;
    group_id: string;
    title: string;
    is_completed: boolean;
    created_at: string;
};

export async function addGoal(groupId: string, title: string): Promise<GroupGoal> {
    if (!DB_URL) throw new Error("No DB");
    const sql = getSqlClient(DB_URL);
    const id = newUlid();

    const [goal] = await sql`
        insert into nu.group_goals (id, group_id, title)
        values (${id}, ${groupId}, ${title})
        returning *
    `;

    return goal as GroupGoal;
}

export async function toggleGoal(goalId: string, isCompleted: boolean): Promise<GroupGoal> {
    if (!DB_URL) throw new Error("No DB");
    const sql = getSqlClient(DB_URL);

    const [goal] = await sql`
        update nu.group_goals
        set is_completed = ${isCompleted}
        where id = ${goalId}
        returning *
    `;

    return goal as GroupGoal;
}

export async function listGoals(groupId: string): Promise<GroupGoal[]> {
    if (!DB_URL) return [];
    const sql = getSqlClient(DB_URL);

    const rows = await sql`
        select * from nu.group_goals 
        where group_id = ${groupId} 
        order by created_at asc
    `;

    return rows as unknown as GroupGoal[];
}
