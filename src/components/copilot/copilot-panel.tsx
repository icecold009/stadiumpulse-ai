"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, MessageSquareText, SendHorizonal } from "lucide-react";

import ChatBubble from "@/components/copilot/chat-bubble";

type CopilotMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

const initialMessages: CopilotMessage[] = [
    {
        id: "welcome",
        role: "assistant",
        content: "Ask about live venue data, incidents, sustainability trends, or staffing recommendations.",
    },
];

export default function CopilotPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState("");
    const [messages, setMessages] = useState<CopilotMessage[]>(initialMessages);

    const trimmedDraft = useMemo(() => draft.slice(0, 500), [draft]);

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const nextDraft = trimmedDraft.trim();
        if (!nextDraft) {
            return;
        }

        setMessages((currentMessages) => [
            ...currentMessages,
            {
                id: crypto.randomUUID(),
                role: "user",
                content: nextDraft,
            },
        ]);
        setDraft("");

        // TODO: Call /api/copilot with the question and grounded data slice, then append the streamed assistant response.
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen((currentOpen) => !currentOpen)}
                aria-expanded={isOpen}
                aria-controls="copilot-panel"
                className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border border-ai-highlight/60 bg-surface-raised px-4 py-3 text-sm font-semibold text-foreground shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition hover:border-ai-highlight hover:text-ai-highlight focus:outline-none focus:ring-2 focus:ring-ai-highlight focus:ring-offset-2 focus:ring-offset-background"
            >
                <MessageSquareText className="h-4 w-4" />
                <span>{isOpen ? "Close copilot" : "Open copilot"}</span>
            </button>

            <aside
                id="copilot-panel"
                className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-105 flex-col border-l border-border bg-surface-raised shadow-[0_24px_80px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
                aria-label="AI copilot panel"
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
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-4 py-5">
                    <div className="space-y-3">
                        {messages.map((message) => (
                            <ChatBubble
                                key={message.id}
                                role={message.role}
                                content={message.content}
                            />
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="border-t border-border p-4">
                    <label className="block">
                        <span className="sr-only">Copilot question</span>
                        <textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value.slice(0, 500))}
                            rows={4}
                            maxLength={500}
                            placeholder="Ask about alerts, staffing, or sustainability trends..."
                            className="min-h-26 w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
                        />
                    </label>

                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-text-muted">
                        <span>{trimmedDraft.length}/500 characters</span>
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-raised"
                        >
                            <SendHorizonal className="h-4 w-4" />
                            Send
                        </button>
                    </div>
                </form>
            </aside>
        </>
    );
}
