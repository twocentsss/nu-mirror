
import { appendRow, readAllRows, updateRowById } from '../../google/sheetStore';
import { SHEET_TABS } from '../../google/schema';
import { Problem } from '../../core/types';
import { ulid } from 'ulid';

export async function createProblem(title: string, hypothesis: string): Promise<Problem> {
    const problem: Problem = {
        id: ulid(),
        title,
        status: 'open',
        hypothesis,
        rca: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    await appendRow({
        tab: SHEET_TABS.PROBLEMS,
        values: [
            problem.id,
            problem.title,
            problem.status,
            problem.hypothesis,
            problem.rca,
            problem.created_at,
            problem.updated_at
        ]
    });

    await logProblemEvent(problem.id, 'create', `Created problem: ${title}`);
    return problem;
}

export async function solveProblem(id: string, rca: string): Promise<void> {
    const { rows } = await readAllRows({ tab: SHEET_TABS.PROBLEMS });
    const row = rows.find((r: any) => r[0] === id);

    if (!row) throw new Error(`Problem ${id} not found`);

    const updatedRow = [...row];
    updatedRow[2] = 'solved';
    updatedRow[4] = rca;
    updatedRow[6] = new Date().toISOString();

    await updateRowById({
        tab: SHEET_TABS.PROBLEMS,
        id,
        values: updatedRow
    });

    await logProblemEvent(id, 'solve', `Solved with RCA: ${rca}`);
}

async function logProblemEvent(problemId: string, type: string, details: string) {
    await appendRow({
        tab: SHEET_TABS.PROBLEM_EVENTS,
        values: [
            ulid(),
            problemId,
            type,
            details,
            new Date().toISOString()
        ]
    });
}
