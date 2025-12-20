/**
 * World Graph Schema
 * 
 * Defines the unified graph structure for Tasks, Projects, Goals, and Life Focus.
 * This powers the "Mental Map" visualization and contextual linking.
 */

// 1. Node Types
export interface BaseNode {
    id: string;
    label: string;
    created_at: string;
    metadata?: Record<string, any>;
}

export interface TaskNode extends BaseNode {
    type: 'task';
    status: 'todo' | 'doing' | 'done' | 'blocked';
    lf_id: number;
}

export interface ProjectNode extends BaseNode {
    type: 'project';
    status: 'active' | 'hold' | 'archived';
}

export interface GoalNode extends BaseNode {
    type: 'goal';
    target_date?: string;
    progress: number; // 0-100
}

export interface LifeFocusNode extends BaseNode {
    type: 'life_focus';
    lf_id: number; // 1-9
}

export type WorldNode = TaskNode | ProjectNode | GoalNode | LifeFocusNode;


// 2. Edge Types
export type EdgeType = 'parent_of' | 'contributes_to' | 'belongs_to' | 'depends_on';

export interface WorldEdge {
    source: string;  // Node ID
    target: string;  // Node ID
    type: EdgeType;
}

// 3. The Graph Container
export interface WorldGraph {
    nodes: Record<string, WorldNode>;
    edges: WorldEdge[];
}

// 4. Traversal Helpers (Interfaces Only)
export interface GraphTraversal {
    getProjectTasks(projectId: string, limit?: number): TaskNode[];
    getGoalLineage(goalId: string): { projects: ProjectNode[], tasks: TaskNode[] };
    getLifeFocusTree(lfId: number): WorldGraph; // Subgraph for one LF
}
