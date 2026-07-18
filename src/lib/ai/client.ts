import "server-only";
import Anthropic from "@anthropic-ai/sdk";
export { COPILOT_MODEL, RECOMMENDATION_MODEL } from "@/lib/ai/config";

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
    if (anthropicClient) return anthropicClient;

    const apiKey = process.env.FIREWORKS_API_KEY ?? process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        throw new Error(
            "Missing FIREWORKS_API_KEY (or ANTHROPIC_API_KEY) env var. Add one to .env.local and your deployment env settings."
        );
    }

    anthropicClient = new Anthropic({
        apiKey,
        baseURL: "https://api.fireworks.ai/inference",
    });

    return anthropicClient;
}
