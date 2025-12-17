
import { NextResponse } from 'next/server';
import { closeTask } from '@/lib/features/tasks/manager';

export async function POST(request: Request) {
    try {
        const { taskId } = await request.json();
        
        if (!taskId) {
            return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
        }

        await closeTask(taskId);
        
        return NextResponse.json({ success: true, taskId });
    } catch (error) {
        console.error('Error closing task:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
