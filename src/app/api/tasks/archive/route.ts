
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/authOptions';
import { archiveTask } from '@/lib/features/tasks/manager';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    // Optional: enforce auth, or allow system for now if that's the design
    const userId = session?.user?.email || 'system';

    try {
        const { taskId } = await request.json();

        if (!taskId) {
            return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
        }

        await archiveTask(taskId, userId);

        return NextResponse.json({ success: true, taskId });
    } catch (error) {
        console.error('Error archiving task:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
