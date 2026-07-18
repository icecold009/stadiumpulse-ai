import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const COPILOT_MODEL = "accounts/fireworks/models/kimi-k2p6";
export const RECOMMENDATION_MODEL =
    process.env.FIREWORKS_RECOMMENDATION_MODEL ??
    "accounts/fireworks/models/deepseek-v4-pro";

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
