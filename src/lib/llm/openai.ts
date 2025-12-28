import OpenAI from "openai";

export async function openAiResponses({
    apiKey,
    model,
    input,
    baseURL,
    siteUrl,
    siteName,
    jsonMode,
}: {
    apiKey: string;
    model: string;
    input: string;
    baseURL?: string;
    siteUrl?: string;
    siteName?: string;
    jsonMode?: boolean;
}) {
    const client = new OpenAI({
        apiKey,
        baseURL,
        defaultHeaders: baseURL?.includes("openrouter")
            ? {
                "HTTP-Referer": siteUrl ?? "https://alfred.app", // Placeholder
                "X-Title": siteName ?? "Alfred", // Placeholder
            }
            : undefined,
    });

    const completion = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: input }],
        response_format: jsonMode ? { type: "json_object" } : undefined,
        max_tokens: 1000,
    });

    const text = completion.choices[0].message.content || (jsonMode ? "{}" : "");
    const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return {
        content: jsonMode ? JSON.parse(text) : text,
        usage: {
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens
        }
    };
}
