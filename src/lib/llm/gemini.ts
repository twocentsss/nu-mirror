import { GoogleGenerativeAI } from "@google/generative-ai";

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
    // Strip "models/" prefix if present to normalize
    const requestedModel = model.replace(/^models\//, "");

    // 2025 Model Candidates for best free-tier compatibility
    const modelCandidates: string[] = [];
    if (requestedModel && requestedModel.includes("gemini")) {
        modelCandidates.push(requestedModel);
    }
    modelCandidates.push(
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
        "gemini-1.5-pro"
    );

    const genAI = new GoogleGenerativeAI(apiKey);
    let lastError = "";

    for (const m of Array.from(new Set(modelCandidates))) {
        try {
            console.log(`[Gemini SDK] Trying candidate: ${m}`);
            const generativeModel = genAI.getGenerativeModel({
                model: m,
                generationConfig: jsonMode ? { responseMimeType: "application/json" } : undefined
            });

            const result = await generativeModel.generateContent(input);
            const response = await result.response;
            const text = response.text();

            return {
                content: jsonMode ? JSON.parse(text) : text,
                usage: {
                    prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
                    completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
                    total_tokens: response.usageMetadata?.totalTokenCount || 0
                }
            };
        } catch (e: any) {
            lastError = e.message || "Unknown Gemini error";
            console.warn(`[Gemini SDK] Attempt failed for ${m}: ${lastError}`);

            // If it's a quota issue and we have more candidates, we continue.
            // But if it's a persistent error like "invalid model", we continue too.
        }
    }

    throw new Error(`Gemini API failed all candidates. Last error: ${lastError}`);
}

export async function geminiStream(params: {
    apiKey: string;
    model: string;
    input: string;
}) {
    const genAI = new GoogleGenerativeAI(params.apiKey);
    const m = params.model.replace(/^models\//, "") || "gemini-1.5-flash";
    const generativeModel = genAI.getGenerativeModel({ model: m });
    const result = await generativeModel.generateContentStream(params.input);
    return result.stream;
}
