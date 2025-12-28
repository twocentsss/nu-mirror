import OpenAI from "openai";

export type AiProvider = "heuristic" | "openai" | "gemini" | "openrouter";

function mustGetEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export async function callOpenAIJson<T>({
  model,
  schema,
  prompt,
}: {
  model: string;
  schema: any;
  prompt: string;
}): Promise<T> {
  const apiKey = mustGetEnv("OPENAI_API_KEY");
  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model,
    input: prompt,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "task_breakdown",
        schema,
        strict: true,
      },
    },
  } as any);

  const text = (response as any).output_text ?? "";
  return JSON.parse(text) as T;
}

export async function callGeminiJson<T>({
  model,
  schema,
  prompt,
}: {
  model: string;
  schema: any;
  prompt: string;
}): Promise<T> {
  const apiKey = mustGetEnv("GEMINI_API_KEY");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generation_config: {
      response_mime_type: "application/json",
      response_schema: schema,
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Gemini error ${resp.status}: ${errorText}`);
  }

  const json = await resp.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return JSON.parse(text) as T;
}

export async function callOpenRouterJson<T>({
  model,
  schema,
  prompt,
}: {
  model: string;
  schema: any;
  prompt: string;
}): Promise<T> {
  const apiKey = mustGetEnv("OPENROUTER_API_KEY");
  const base = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

  const resp = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_NAME || "alfred",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You output ONLY valid JSON matching the provided JSON schema." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "task_breakdown",
          schema,
          strict: true,
        },
      },
    }),
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`OpenRouter error ${resp.status}: ${errorText}`);
  }

  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(text) as T;
}
