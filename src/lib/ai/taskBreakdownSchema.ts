import { z } from "zod";

export const BreakdownQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum(["text", "choice"]),
  choices: z.array(z.string()).optional(),
});

export const SubtaskSchema = z.object({
  title: z.string().min(1),
  estimate_minutes: z.number().int().min(5).max(240).optional(),
  definition_of_done: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  depends_on: z.array(z.string()).optional(),
});

export const BreakdownResultSchema = z.object({
  summary: z.string().optional(),
  assumptions: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  subtasks: z.array(SubtaskSchema).min(1).max(20),
});

export type BreakdownQuestion = z.infer<typeof BreakdownQuestionSchema>;
export type BreakdownResult = z.infer<typeof BreakdownResultSchema>;
export type Subtask = z.infer<typeof SubtaskSchema>;
