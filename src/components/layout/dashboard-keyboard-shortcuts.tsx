"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
}

function focusElement(id: string) {
    const candidates = id === "alert-queue"
        ? [document.getElementById(id), ...Array.from(document.querySelectorAll<HTMLElement>("[data-alert-queue]"))]
        : [document.getElementById(id)];
    const element = candidates.find((candidate) => candidate instanceof HTMLElement && candidate.getClientRects().length > 0);
    if (!(element instanceof HTMLElement)) return;

    element.focus({ preventScroll: true });
    element.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

export default function DashboardKeyboardShortcuts() {
    const router = useRouter();

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;

            switch (event.key.toLowerCase()) {
                case "a":
                    event.preventDefault();
                    focusElement("alert-queue");
                    break;
                case "r":
                    event.preventDefault();
                    window.dispatchEvent(new Event("pulseops:refresh"));
                    router.refresh();
                    break;
                case "c":
                    event.preventDefault();
                    window.dispatchEvent(new Event("pulseops:copilot:toggle"));
                    break;
                case "m":
                    event.preventDefault();
                    focusElement("main-content");
                    break;
                default:
                    break;
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [router]);

    return (
        <p className="sr-only">
            Keyboard shortcuts: A focuses the alert queue, R refreshes the current view, C opens Copilot, and M returns focus to main content.
        </p>
    );
}
