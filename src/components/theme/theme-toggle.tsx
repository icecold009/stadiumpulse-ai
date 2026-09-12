"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useTheme } from "@/components/theme/theme-provider";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
    const { theme, toggleTheme } = useTheme();
    const mounted = useSyncExternalStore(
        () => () => undefined,
        () => true,
        () => false,
    );
    const displayedTheme = mounted ? theme : "dark";
    const nextTheme = displayedTheme === "dark" ? "light" : "dark";

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`control button-quiet ${compact ? "h-9 min-h-9 w-9 p-0" : "min-h-10 px-3"}`}
            aria-label={`Switch to ${nextTheme} theme`}
            title={`Switch to ${nextTheme} theme`}
        >
            {displayedTheme === "dark" ? <Sun aria-hidden="true" className="h-4 w-4" /> : <Moon aria-hidden="true" className="h-4 w-4" />}
            {!compact ? <span>{displayedTheme === "dark" ? "Light mode" : "Dark mode"}</span> : null}
        </button>
    );
}
