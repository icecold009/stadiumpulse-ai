"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, MessageSquareText, SendHorizonal } from "lucide-react";
import ChatBubble from "@/components/copilot/chat-bubble";

type CopilotMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    groundedSummary?: string;
};

const initialMessages: CopilotMessage[] = [
    {
        id: "welcome",
        role: "assistant",
        content:
            "Ask about live venue data, incidents, sustainability trends, or staffing recommendations.",
    },
];

type StreamEvent =
    | {
        type: "meta";
        groundedSummary?: string;
        dataWindowMinutes?: number;
        zonesIncluded?: string[];
        alertCount?: number;
    }
    | {
        type: "delta";
        text: string;
    }
    | {
        type: "done";
        groundedSummary?: string;
    }
    | {
        type: "error";
        error: string;
    };

export default function CopilotPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState("");
    const [messages, setMessages] = useState<CopilotMessage[]>(initialMessages);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const wasOpen = useRef(false);

    const trimmedDraft = useMemo(() => draft.slice(0, 500), [draft]);

    useEffect(() => {
        const previouslyOpen = wasOpen.current;
        wasOpen.current = isOpen;
        if (!isOpen) {
            if (previouslyOpen) triggerRef.current?.focus();
            return;
        }

        textareaRef.current?.focus();
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                setIsOpen(false);
                return;
            }
            if (event.key !== "Tab" || !panelRef.current) return;
            const focusable = Array.from(
                panelRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
                )
            );
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable.at(-1)!;
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const nextDraft = trimmedDraft.trim();
        if (!nextDraft || isSubmitting) return;

        const userMessage: CopilotMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: nextDraft,
        };

        const assistantId = crypto.randomUUID();

        setMessages((currentMessages) => [
            ...currentMessages,
            userMessage,
            {
                id: assistantId,
                role: "assistant",
                content: "",
            },
        ]);
        setDraft("");
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/copilot", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ question: nextDraft }),
            });

            if (!response.ok || !response.body) {
                let errorMessage = "Failed to contact copilot.";
                try {
                    const data = await response.json();
                    errorMessage = data.error ?? errorMessage;
                } catch { }
                throw new Error(errorMessage);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let buffer = "";
            let assistantText = "";
            let groundedSummary = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split("\n\n");
                buffer = parts.pop() ?? "";

                for (const part of parts) {
                    const line = part
                        .split("\n")
                        .find((entry) => entry.startsWith("data: "));
                    if (!line) continue;

                    const payload = line.slice(6).trim();
                    if (!payload || payload === "[DONE]") continue;

                    const parsed = JSON.parse(payload) as StreamEvent;

                    if (parsed.type === "meta") {
                        groundedSummary = parsed.groundedSummary ?? groundedSummary;
                        setMessages((currentMessages) =>
                            currentMessages.map((message) =>
                                message.id === assistantId
                                    ? {
                                        ...message,
                                        groundedSummary,
                                    }
                                    : message
                            )
                        );
                        continue;
                    }

                    if (parsed.type === "delta") {
                        assistantText += parsed.text;
                        setMessages((currentMessages) =>
                            currentMessages.map((message) =>
                                message.id === assistantId
                                    ? {
                                        ...message,
                                        content: assistantText,
                                        groundedSummary,
                                    }
                                    : message
                            )
                        );
                        continue;
                    }

                    if (parsed.type === "done") {
                        groundedSummary = parsed.groundedSummary ?? groundedSummary;
                        setMessages((currentMessages) =>
                            currentMessages.map((message) =>
                                message.id === assistantId
                                    ? {
                                        ...message,
                                        content: assistantText.trim(),
                                        groundedSummary,
                                    }
                                    : message
                            )
                        );
                        continue;
                    }

                    if (parsed.type === "error") {
                        throw new Error(parsed.error);
                    }
                }
            }

            setMessages((currentMessages) =>
                currentMessages.map((message) =>
                    message.id === assistantId
                        ? {
                            ...message,
                            content:
                                message.content.trim() ||
                                "I could not generate a response from the available data.",
                            groundedSummary,
                        }
                        : message
                )
            );
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Unexpected error.";

            setMessages((currentMessages) =>
                currentMessages.map((entry) =>
                    entry.id === assistantId
                        ? {
                            ...entry,
                            content: `Sorry — ${message}`,
                        }
                        : entry
                )
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen((currentOpen) => !currentOpen)}
                aria-expanded={isOpen}
                aria-controls="copilot-panel"
                className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border border-ai-highlight/60 bg-surface-raised px-4 py-3 text-sm font-semibold text-foreground shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition hover:border-ai-highlight hover:text-ai-highlight focus:outline-none focus:ring-2 focus:ring-ai-highlight focus:ring-offset-2 focus:ring-offset-background"
            >
                <MessageSquareText aria-hidden="true" className="h-4 w-4" />
                <span>{isOpen ? "Close copilot" : "Open copilot"}</span>
            </button>

            <aside
                ref={panelRef}
                id="copilot-panel"
                className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-105 flex-col border-l border-border bg-surface-raised shadow-[0_24px_80px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
                aria-label="AI copilot panel"
                role="dialog"
                aria-modal={isOpen ? "true" : undefined}
                aria-hidden={!isOpen}
                inert={!isOpen}
            >
                <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ai-highlight">
                            AI Copilot
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-foreground">
                            Grounded operational help
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-muted transition hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"
                        aria-label="Close copilot panel"
                    >
                        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                    </button>
                </header>

                <div
                    className="flex-1 overflow-y-auto px-4 py-5"
                    role="log"
                    aria-live="polite"
                    aria-relevant="additions text"
                >
                    <div className="space-y-3">
                        {messages.map((message) => (
                            <ChatBubble
                                key={message.id}
                                role={message.role}
                                content={message.content}
                                groundedSummary={message.groundedSummary}
                            />
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="border-t border-border p-4">
                    <label className="block">
                        <span className="sr-only">Copilot question</span>
                        <textarea
                            ref={textareaRef}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value.slice(0, 500))}
                            rows={4}
                            maxLength={500}
                            placeholder="Ask about alerts, staffing, or sustainability trends..."
                            className="min-h-26 w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
                            disabled={isSubmitting}
                        />
                    </label>

                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-text-muted">
                        <span>{trimmedDraft.length}/500 characters</span>
                        <button
                            type="submit"
                            disabled={isSubmitting || !trimmedDraft.trim()}
                            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-raised"
                        >
                            <SendHorizonal aria-hidden="true" className="h-4 w-4" />
                            {isSubmitting ? "Sending..." : "Send"}
                        </button>
                    </div>
                </form>
            </aside>
        </>
    );
}
