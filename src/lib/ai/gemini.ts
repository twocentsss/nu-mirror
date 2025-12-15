import { mustGetEnv } from "@/lib/env";
import { GoogleGenAI } from "@google/genai";

export type CogosBundle = {
  episode: any;
  tasks: any[];
  worklogs?: any[];
  decisionLogs?: any[];
  caseBriefs?: any[];
  notes?: string;
};

export async function geminiExtractCogos(
  text: string,
  userEmail: string,
): Promise<CogosBundle> {
  const apiKey = mustGetEnv("GEMINI_API_KEY");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const ai = new GoogleGenAI({ apiKey });
  const now = new Date().toISOString();

  const prompt = `
You are a deterministic extraction engine for CognitiveOS.
Return ONLY valid JSON. No markdown. No prose.

INPUT: English text describing a task/event/problem.

OUTPUT JSON shape:
{
  "episode": { ...Episode... },
  "tasks": [ ...Task... ],
  "worklogs": [],
  "decisionLogs": [],
  "caseBriefs": [],
  "notes": ""
}

RULES:
- Use the user's email "${userEmail}" as ownership.dri and ownership.decider unless a different explicit decider is stated.
- Produce realistic "tasks" with subtasks as separate Task objects (parent_task_id references parent).
- Task.status must be one of: intake, defined, decomposed, planned, doing, blocked, done, canceled.
- Include Definition of Done (definition.dod) for main task and key subtasks.
- Keep time fields as ISO dates when possible (YYYY-MM-DD). Otherwise omit them.
- Always fill: episode.id, episode.created_at, episode.raw_text, episode.dims fields.
- episode.dims.meaning.category must be one of: task,event,memory,note,inspiration,observation.
- episode.dims.action.class must be one of: create,update,delete,schedule,notify,reflect,move,decide,unknown.
- Put the FULL object JSON into each returned object's shape (no placeholders).

SCHEMAS (intent summary):
- Episode: id, raw_text, created_at, dims{entity,action,context,intent,outcome,time,meaning,station,...}
- Task: id, episode_id, parent_task_id?, title, raw_text?, definition?, priority?, ownership, time?, status, tags?, links?, created_at, updated_at

Generate a "reasonable" task tree:
- main task in status "defined" or "planned" based on clarity
- subtasks usually in "intake" or "defined"

Current timestamp: ${now}

Now extract from this input:
${text}
`;

  const resp = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const out = resp.text ?? "{}";
  try {
    return JSON.parse(out);
  } catch {
    return {
      episode: null,
      tasks: [],
      worklogs: [],
      decisionLogs: [],
      caseBriefs: [],
      notes: "Gemini output was not valid JSON.",
    };
  }
}
