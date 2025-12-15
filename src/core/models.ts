export type Lane = "TASK" | "EVENT" | "NOTE" | "MEMORY";
export type Complexity = "LOW" | "MEDIUM" | "HIGH";

export type IssueKind = "cause" | "requirement" | "option" | "risk";

export type IssueNode = {
  id: string;
  kind: IssueKind;
  text: string;
  children?: IssueNode[];
};

export type TaskNode = {
  id: string;
  title: string;
  dod?: string;
  lf?: number;
  children?: TaskNode[];
};

export type ProblemBrief = {
  statement: string;
  impact: string;
  outcome: string;
  dod: string;
  constraints: string[];
  timeBoundary: string;
  dri: string;
  decider: string;
};

export type CasePack = {
  caseBrief: string;
  bluf: string;
  slide: string;
  script: string;
};

export type Artifacts = {
  lane: Lane;
  complexity: Complexity;
  rawText: string;

  problemBrief: ProblemBrief;
  issueTree: IssueNode;
  taskTree: TaskNode;

  casePack: CasePack;
};
