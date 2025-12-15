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

    const content = completion.choices[0].message.content || "{}";
    return JSON.parse(content);
}
