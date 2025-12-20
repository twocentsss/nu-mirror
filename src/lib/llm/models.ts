
export interface LlmModel {
    id: string;
    name: string;
    provider: "openai" | "openrouter" | "gemini" | "anthropic" | "mistral";
    description?: string;
    isFree?: boolean;
    contextWindow?: number;
}

export const RECOMMENDED_MODELS: LlmModel[] = [
    // OpenAI
    { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", description: "Default, balanced" },
    { id: "gpt-4o", name: "GPT-4o", provider: "openai", description: "Smartest" },

    // Gemini
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "gemini", description: "Fast & Capable" },
    { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash (Preview)", provider: "gemini", description: "Cutting Edge" },

    // Anthropic
    { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet", provider: "anthropic", description: "Highest Reasoning" },
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", provider: "anthropic", description: "Fastest Claude" },

    // OpenRouter Free Models
    {
        id: "meta-llama/llama-3.2-3b-instruct:free",
        name: "Llama 3.2 3B Instruct (Free)",
        provider: "openrouter",
        isFree: true,
        contextWindow: 131072,
        description: "Meta's efficient 3B model"
    },
    {
        id: "qwen/qwen-2.5-vl-7b-instruct:free",
        name: "Qwen 2.5-VL 7B (Free)",
        provider: "openrouter",
        isFree: true,
        contextWindow: 32768,
        description: "Vision-Language model by Alibaba"
    },
    {
        id: "qwen/qwen3-4b:free",
        name: "Qwen 3 4B (Free)",
        provider: "openrouter",
        isFree: true,
        contextWindow: 41000,
        description: "Latest Qwen 3 series with reasoning"
    },
    {
        id: "google/gemma-3-12b-it:free",
        name: "Gemma 3 12B (Free)",
        provider: "openrouter",
        isFree: true,
        contextWindow: 33000,
        description: "Google's smart multimodal 12B"
    },
    {
        id: "google/gemma-3-4b-it:free",
        name: "Gemma 3 4B (Free)",
        provider: "openrouter",
        isFree: true,
        contextWindow: 33000,
        description: "Google's efficient multimodal 4B"
    },
    {
        id: "google/gemma-3n-e4b-it:free",
        name: "Gemma 3n 4B (Free)",
        provider: "openrouter",
        isFree: true,
        contextWindow: 8000,
        description: "MatFormer optimized Gemma"
    },
    {
        id: "google/gemma-3n-e2b-it:free",
        name: "Gemma 3n 2B (Free)",
        provider: "openrouter",
        isFree: true,
        contextWindow: 8000,
        description: "MatFormer optimized lightweight"
    }
];
