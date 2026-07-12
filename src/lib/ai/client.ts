import "server-only";

import Anthropic from "@anthropic-ai/sdk";

export const ANTHROPIC_HAIKU_MODEL = "claude-3-5-haiku-latest";
export const ANTHROPIC_SONNET_MODEL = "claude-3-5-sonnet-latest";

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        throw new Error(
            "Missing ANTHROPIC_API_KEY environment variable. Set it in your server environment before calling the Anthropic client.",
        );
    }

    anthropicClient ??= new Anthropic({ apiKey });

    return anthropicClient;
}
