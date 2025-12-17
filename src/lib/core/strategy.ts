/**
 * Nu Flow Protocol - Strategy Engine Models
 * Defines the structure for Strategies, Steps, Instances, and Executions.
 */

// --- 1. Strategy Template (The Recipe) ---

export interface StrategyStepTemplate {
    stepId: string;            // e.g., 'define_problem'
    order: number;             // Sequence order (1, 2, 3...)
    name: string;              // Human readable name
    description: string;       // Instructions for this step

    // What type(s) of output this step tends to generate
    outputSchemas?: string[];  // e.g., ['SubQuestions', 'Fishbone', 'ProblemStatement']
}

export interface StrategyKnowledgeBase {
    summary: string;
    references?: string[];     // URLs, docs, hadith refs, etc.
}

export interface StrategyTemplate {
    strategyId: string;        // e.g., 'PSF_6Step'
    name: string;              // e.g., 'Problem-Solving Framework - 6 Step'
    description: string;

    knowledgeBase?: StrategyKnowledgeBase;

    steps: StrategyStepTemplate[];
}

// --- 2. Strategy Instance (Running on a Task) ---

export type StrategyStatus = 'not_started' | 'in_progress' | 'completed';

export interface StrategyInstance {
    strategyInstanceId: string; // UIID
    strategyId: string;         // Link to template
    taskId: string;             // Link to parent task

    createdAt: string;          // ISO Timestamp
    completedAt?: string;
    status: StrategyStatus;

    // Open KV for strategy-specific data (e.g., 'rootProblem', 'constraints')
    data: Record<string, any>;
}

// --- 3. Strategy Step Execution (The Unit of Work) ---

export type StepExecutionStatus = 'not_started' | 'in_progress' | 'done';

export interface StrategyExecutableRef {
    name: string;              // Function name e.g., 'generateFishbone'
    args?: Record<string, any>;
    resultRef?: string;        // Pointer to output data
}

export interface StrategyStepExecution {
    stepExecutionId: string;   // UIID
    strategyInstanceId: string;
    taskId: string;
    stepId: string;            // Same as template stepId

    status: StepExecutionStatus;
    startedAt?: string;
    finishedAt?: string;

    // Inputs & Executables
    inputSources?: string[];   // e.g., ['sheet:LF_TASKS!A1:Z']
    executables?: StrategyExecutableRef[];

    // Outputs (Open KV)
    // e.g., { subQuestions: [...], fishbone: {...} }
    outputs: Record<string, any>;

    // Assertions generated/derived by this step
    assertionIds?: string[];
}
