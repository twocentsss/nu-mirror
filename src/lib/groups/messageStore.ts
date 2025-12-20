
import { getSqlClient } from "@/lib/events/client";
import { newUlid } from "@/lib/id";

const DB_URL = process.env.DATABASE_URL;

export type Message = {
    id: string;
    group_id: string;
    sender_email: string;
    content: string;
    created_at: string;
};

export async function sendMessage(groupId: string, senderEmail: string, content: string): Promise<Message> {
    if (!DB_URL) throw new Error("No DB");
    const sql = getSqlClient(DB_URL);
    const id = newUlid();

    const [msg] = await sql`
        insert into nu.messages (id, group_id, sender_email, content)
        values (${id}, ${groupId}, ${senderEmail}, ${content})
        returning *
    `;

    return msg as Message;
}

export async function listMessages(groupId: string, limit: number = 50): Promise<Message[]> {
    if (!DB_URL) return [];
    const sql = getSqlClient(DB_URL);

    const rows = await sql`
        select * from nu.messages 
        where group_id = ${groupId} 
        order by created_at desc 
        limit ${limit}
    `;

    // Return in chronological order for UI
    return (rows as unknown as Message[]).reverse();
}
