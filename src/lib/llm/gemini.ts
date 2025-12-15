export async function geminiResponses({
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
    // Map common model names if needed, or use as is
    const modelName = model.includes("gemini") ? model : "gemini-1.5-flash"; // Default fallback

    // Google API uses specific URL pattern
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: input }] }],
            generationConfig: jsonMode ? { responseMimeType: "application/json" } : undefined
        }),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error?.message || "Gemini API failed");
    }

    try {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || (jsonMode ? "{}" : "");
        const meta = data.usageMetadata || {};

        return {
            content: jsonMode ? JSON.parse(text) : text,
            usage: {
                prompt_tokens: meta.promptTokenCount || 0,
                completion_tokens: meta.candidatesTokenCount || 0,
                total_tokens: meta.totalTokenCount || 0
            }
        };
    } catch {
        return { content: jsonMode ? {} : "", usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } };
    }
}
