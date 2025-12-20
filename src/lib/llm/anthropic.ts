export async function anthropicResponses({
    apiKey,
    model,
    input,
    jsonMode,
}: {
    apiKey: string;
    model: string;
    input: string;
    jsonMode?: boolean;
}) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
            model: model,
            max_tokens: 1024,
            messages: [
                { role: "user", content: input }
            ],
            system: jsonMode ? "You must respond only in valid JSON format." : undefined,
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Anthropic error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const usage = data.usage || { input_tokens: 0, output_tokens: 0 };

    return {
        content: jsonMode ? JSON.parse(text) : text,
        usage: {
            prompt_tokens: usage.input_tokens,
            completion_tokens: usage.output_tokens,
            total_tokens: usage.input_tokens + usage.output_tokens
        }
    };
}
