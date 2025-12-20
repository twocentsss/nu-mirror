import { Mistral } from "@mistralai/mistralai";

export async function mistralResponses(params: {
    apiKey: string;
    model: string;
    input: string;
    jsonMode?: boolean;
}) {
    const client = new Mistral({ apiKey: params.apiKey });

    // Handle Mistral Agents if the model starts with "agent:"
    if (params.model.startsWith("agent:")) {
        const agentId = params.model.replace("agent:", "");
        const res = await client.agents.complete({
            agentId,
            messages: [{ role: "user", content: params.input }],
        });

        const choice = res.choices?.[0];
        const text = typeof choice?.message?.content === "string"
            ? choice.message.content
            : "";

        return {
            content: params.jsonMode ? JSON.parse(text) : text,
            usage: {
                prompt_tokens: res.usage?.promptTokens || 0,
                completion_tokens: res.usage?.completionTokens || 0,
                total_tokens: res.usage?.totalTokens || 0
            }
        };
    }

    // Standard Chat Completion
    const res = await client.chat.complete({
        model: params.model || "mistral-small-latest",
        messages: [{ role: "user", content: params.input }],
        responseFormat: params.jsonMode ? { type: "json_object" } : undefined,
    });

    const choice = res.choices?.[0];
    const text = typeof choice?.message?.content === "string"
        ? choice.message.content
        : "";

    return {
        content: params.jsonMode ? JSON.parse(text) : text,
        usage: {
            prompt_tokens: res.usage?.promptTokens || 0,
            completion_tokens: res.usage?.completionTokens || 0,
            total_tokens: res.usage?.totalTokens || 0
        }
    };
}
