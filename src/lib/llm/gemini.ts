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
    // Strip "models/" prefix if present to avoid duplication in URL
    let modelName = model.replace(/^models\//, "");

    // aggressively fix the -001 suffix which seems to be causing issues
    if (modelName === "gemini-1.5-flash-001") {
        modelName = "gemini-1.5-flash";
    }

    // Fallback if empty or generic
    if (!modelName || !modelName.includes("gemini")) {
        modelName = "gemini-flash-latest";
    }

    // Initial attempt URL
    let url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const makeRequest = async (requestUrl: string) => {
        return fetch(requestUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: input }] }],
                generationConfig: jsonMode ? { responseMimeType: "application/json" } : undefined
            }),
        });
    };

    let res = await makeRequest(url);

    // Fallback Logic: If 404, try explicit stable version "gemini-1.5-flash"
    if (res.status === 404 && modelName !== "gemini-1.5-flash") {
        console.warn(`Gemini model ${modelName} not found. Falling back to gemini-1.5-flash.`);
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        res = await makeRequest(url);
    }

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error?.message || `Gemini API failed with status ${res.status}`);
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
