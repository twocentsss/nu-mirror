import OpenAI from "openai";

export async function openAiResponses({
    apiKey,
    model,
    input,
    baseURL,
    siteUrl,
    siteName,
}: {
    apiKey: string;
    model: string;
    input: string;
    baseURL?: string;
    siteUrl?: string;
    siteName?: string;
}) {
    const client = new OpenAI({
        apiKey,
        baseURL,
        defaultHeaders: baseURL?.includes("openrouter")
            ? {
                "HTTP-Referer": siteUrl ?? "https://numirror.com", // Placeholder
                "X-Title": siteName ?? "NuMirror", // Placeholder
            }
            : undefined,
    });

    const completion = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: input }],
        response_format: { type: "json_object" },
        max_tokens: 1000,
    });

    const text = completion.choices[0].message.content || "{}";
    const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return {
        content: JSON.parse(text),
        usage: {
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens
        }
    };
}
