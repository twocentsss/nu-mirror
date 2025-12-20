
import { appendRow, deleteRowById, readAllRows, updateRowById } from '../../google/sheetStore';
import { SHEET_TABS } from '../../google/schema';
import { Task } from '../../core/types';
import { ulid } from 'ulid';

/**
 * @deprecated This module is replaced by Event-Driven Architecture (EventClient + TaskProjector).
 * Do not use for new implementations. See src/app/api/tasks/* for new patterns.
 */
export async function closeTask(taskId: string, userId: string = 'system'): Promise<void> {
    // 1. Fetch current task to preserve other fields
    const { rows } = await readAllRows({ tab: SHEET_TABS.TASKS });
    const taskRow = rows.find(r => r[0] === taskId);

    if (!taskRow) throw new Error(`Task ${taskId} not found`);

    // Update status (index 2 based on schema)
    const updatedRow = [...taskRow];
    updatedRow[2] = 'done';
    updatedRow[8] = new Date().toISOString(); // updated_at

    await updateRowById({
        tab: SHEET_TABS.TASKS,
        id: taskId,
        values: updatedRow
    });

    // Log Event
    await logTaskEvent(taskId, 'close', 'in_progress', 'done', userId);
}

/**
 * Archives a task.
 * 1. Moves row from Tasks to Tasks_Archive
 * 2. Logs an 'archive' event
 */
export async function archiveTask(taskId: string, userId: string = 'system'): Promise<void> {
    const { rows } = await readAllRows({ tab: SHEET_TABS.TASKS });
    const taskRow = rows.find(r => r[0] === taskId);

    if (!taskRow) throw new Error(`Task ${taskId} not found`);

    // 1. Add to Archive
    const archiveRow = [...taskRow, new Date().toISOString()]; // Add archived_at
    await appendRow({
        tab: SHEET_TABS.TASKS_ARCHIVE,
        values: archiveRow
    });

    // 2. Remove from Active
    await deleteRowById({
        tab: SHEET_TABS.TASKS,
        id: taskId
    });

    // 3. Log Event
    await logTaskEvent(taskId, 'archive', 'done', 'archived', userId);
}

/**
 * Reopens a task (from Archive or Closed state).
 * If archived, moves back to Tasks.
 */
export async function reopenTask(taskId: string, userId: string = 'system'): Promise<void> {
    // Check Active first
    const { rows: activeRows } = await readAllRows({ tab: SHEET_TABS.TASKS });
    const activeTask = activeRows.find(r => r[0] === taskId);

    if (activeTask) {
        // Just update status
        const updatedRow = [...activeTask];
        updatedRow[2] = 'in_progress';
        updatedRow[8] = new Date().toISOString();

        await updateRowById({ tab: SHEET_TABS.TASKS, id: taskId, values: updatedRow });
        await logTaskEvent(taskId, 'reopen', 'done', 'in_progress', userId);
        return;
    }

    // Check Archive
    const { rows: archiveRows } = await readAllRows({ tab: SHEET_TABS.TASKS_ARCHIVE });
    const archiveTask = archiveRows.find(r => r[0] === taskId);

    if (archiveTask) {
        // Move back to Active
        // Remove archived_at (last column)
        const activeRow = archiveTask.slice(0, -1);
        activeRow[2] = 'in_progress'; // Force status
        activeRow[8] = new Date().toISOString();

        await appendRow({ tab: SHEET_TABS.TASKS, values: activeRow });
        await deleteRowById({ tab: SHEET_TABS.TASKS_ARCHIVE, id: taskId });
        await logTaskEvent(taskId, 'reopen', 'archived', 'in_progress', userId);
        return;
    }

    throw new Error(`Task ${taskId} not found in Active or Archive`);
}

async function logTaskEvent(taskId: string, type: string, oldVal: string, newVal: string, userId: string) {
    await appendRow({
        tab: SHEET_TABS.TASK_EVENTS,
        values: [
            ulid(),
            taskId,
            type,
            oldVal,
            newVal,
            new Date().toISOString(),
            userId
        ]
    });
}
