"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, ChevronRight, MessageSquareText, SendHorizonal, ShieldCheck, Sparkles, X } from "lucide-react";
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

const suggestedQuestions = [
    "Which zone needs attention?",
    "Summarize open incidents",
    "Where should staff move?",
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
                type="button"
                aria-label="Close copilot panel"
                tabIndex={isOpen ? 0 : -1}
                onClick={() => setIsOpen(false)}
                className={`fixed inset-0 z-40 bg-background/65 backdrop-blur-[2px] transition-opacity ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
            />
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen((currentOpen) => !currentOpen)}
                aria-expanded={isOpen}
                aria-controls="copilot-panel"
                className="group fixed bottom-6 right-6 z-40 inline-flex h-13 items-center gap-3 rounded-2xl border border-ai-highlight/45 bg-[linear-gradient(135deg,rgba(139,92,246,0.22),rgba(28,36,45,0.98)_60%)] px-4 text-sm font-semibold text-foreground shadow-[0_18px_55px_rgba(0,0,0,0.48),0_0_28px_rgba(139,92,246,0.09)] transition hover:-translate-y-0.5 hover:border-ai-highlight/80 focus:outline-none focus:ring-2 focus:ring-ai-highlight focus:ring-offset-2 focus:ring-offset-background"
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ai-highlight text-white shadow-[0_6px_18px_rgba(139,92,246,0.28)]">
                    <MessageSquareText aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="text-left leading-tight"><span className="block text-[10px] font-medium uppercase tracking-[0.15em] text-text-muted">AI assistant</span>{isOpen ? "Close Copilot" : "Ask Copilot"}</span>
                <ChevronRight aria-hidden="true" className="h-4 w-4 text-text-muted transition group-hover:translate-x-0.5 group-hover:text-ai-highlight" />
            </button>

            <aside
                ref={panelRef}
                id="copilot-panel"
                className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-[460px] flex-col border-l border-ai-highlight/20 bg-[#10161d]/98 shadow-[0_24px_90px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
                aria-label="AI copilot panel"
                role="dialog"
                aria-modal={isOpen ? "true" : undefined}
                aria-hidden={!isOpen}
                inert={!isOpen}
            >
                <header className="relative overflow-hidden border-b border-border px-5 py-5">
                    <div aria-hidden="true" className="absolute -right-8 -top-14 h-32 w-32 rounded-full bg-ai-highlight/12 blur-3xl" />
                    <div className="relative flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-ai-highlight/30 bg-ai-highlight/12 text-ai-highlight">
                                <Bot aria-hidden="true" className="h-5 w-5" />
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="font-semibold text-foreground">PulseOps Copilot</h2>
                                    <span className="rounded-full border border-status-ok/25 bg-status-ok/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-status-ok">Live</span>
                                </div>
                                <p className="mt-1 text-xs text-text-muted">Grounded operational guidance</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition hover:border-accent/50 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"
                            aria-label="Close copilot panel"
                        >
                            <X aria-hidden="true" className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="relative mt-4 flex items-center gap-2 rounded-xl border border-ai-highlight/20 bg-ai-highlight/6 px-3 py-2 text-[11px] leading-5 text-text-muted">
                        <ShieldCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-ai-highlight" />
                        Recommendations require human review. No action is automatic.
                    </div>
                </header>

                <div
                    className="flex-1 overflow-y-auto px-4 py-5 sm:px-5"
                    role="log"
                    aria-live="polite"
                    aria-relevant="additions text"
                >
                    <div className="space-y-4">
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

                <form onSubmit={handleSubmit} className="border-t border-border bg-surface-raised/60 p-4 sm:p-5">
                    {messages.length === 1 ? (
                        <div className="mb-4">
                            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                                <Sparkles aria-hidden="true" className="h-3 w-3 text-ai-highlight" /> Try asking
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {suggestedQuestions.map((question) => (
                                    <button
                                        key={question}
                                        type="button"
                                        onClick={() => {
                                            setDraft(question);
                                            textareaRef.current?.focus();
                                        }}
                                        className="rounded-full border border-border bg-surface px-3 py-1.5 text-left text-xs text-text-muted transition hover:border-ai-highlight/45 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-highlight/50"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}
                    <label className="block">
                        <span className="sr-only">Copilot question</span>
                        <textarea
                            ref={textareaRef}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value.slice(0, 500))}
                            rows={3}
                            maxLength={500}
                            placeholder="Ask about alerts, staffing, or sustainability trends..."
                            className="min-h-24 w-full resize-none rounded-2xl border border-border bg-background/70 px-4 py-3 pr-12 text-sm leading-6 text-foreground outline-none placeholder:text-text-muted focus:border-ai-highlight/60 focus:ring-2 focus:ring-ai-highlight/20"
                            disabled={isSubmitting}
                        />
                    </label>

                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-text-muted">
                        <span>{trimmedDraft.length}/500 characters</span>
                        <button
                            type="submit"
                            disabled={isSubmitting || !trimmedDraft.trim()}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-background shadow-[0_8px_22px_rgba(61,214,196,0.16)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-raised"
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
