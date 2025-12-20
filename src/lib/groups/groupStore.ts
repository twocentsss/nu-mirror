
import { getSqlClient } from "@/lib/events/client";
import { newUlid } from "@/lib/id";

const DB_URL = process.env.DATABASE_URL;

export type Group = {
    id: string;
    name: string;
    description: string | null;
    owner_email: string;
    created_at: string;
    role?: string; // If fetched in context of a user
};

export type GroupMember = {
    group_id: string;
    user_email: string;
    role: "admin" | "member";
    joined_at: string;
};

export async function createGroup(name: string, description: string, ownerEmail: string): Promise<string> {
    if (!DB_URL) throw new Error("No DB");
    const sql = getSqlClient(DB_URL);
    const id = newUlid();

    await sql.begin(async sql => {
        // Create Group
        await sql`
            insert into nu.groups (id, name, description, owner_email)
            values (${id}, ${name}, ${description}, ${ownerEmail})
        `;

        // Add Owner as Admin Member
        await sql`
            insert into nu.group_members (group_id, user_email, role)
            values (${id}, ${ownerEmail}, 'admin')
        `;
    });

    return id;
}

export async function listUserGroups(email: string): Promise<Group[]> {
    if (!DB_URL) return [];
    const sql = getSqlClient(DB_URL);

    // Join groups with members table
    const rows = await sql`
        select g.*, m.role
        from nu.groups g
        join nu.group_members m on g.id = m.group_id
        where m.user_email = ${email}
        order by g.created_at desc
    `;

    return rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        owner_email: r.owner_email,
        created_at: r.created_at,
        role: r.role
    }));
}

export async function getGroupDetails(groupId: string, userEmail?: string): Promise<Group | null> {
    if (!DB_URL) return null;
    const sql = getSqlClient(DB_URL);

    const [group] = await sql`select * from nu.groups where id = ${groupId}`;
    if (!group) return null;

    let role = undefined;
    if (userEmail) {
        const [member] = await sql`select role from nu.group_members where group_id = ${groupId} and user_email = ${userEmail}`;
        role = member?.role;
    }

    return { ...group, role } as Group;
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
    if (!DB_URL) return [];
    const sql = getSqlClient(DB_URL);
    const rows = await sql`
        select * from nu.group_members where group_id = ${groupId} order by joined_at asc
    `;
    return rows as any; // Cast
}

export async function addMemberToGroup(groupId: string, email: string, role: string = 'member') {
    if (!DB_URL) return;
    const sql = getSqlClient(DB_URL);
    await sql`
        insert into nu.group_members (group_id, user_email, role)
        values (${groupId}, ${email}, ${role})
        on conflict do nothing
    `;
}

export async function removeMemberFromGroup(groupId: string, email: string) {
    if (!DB_URL) return;
    const sql = getSqlClient(DB_URL);
    await sql`delete from nu.group_members where group_id = ${groupId} and user_email = ${email}`;
}
