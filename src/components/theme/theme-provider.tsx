"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "pulseops-theme";

function readStoredTheme(): Theme {
    try {
        const savedTheme = window.localStorage?.getItem(STORAGE_KEY);
        return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
    } catch {
        return "dark";
    }
}

function storeTheme(theme: Theme) {
    try {
        window.localStorage?.setItem(STORAGE_KEY, theme);
    } catch {
        // A restricted storage environment should still allow the toggle to work for the session.
    }
}

type ThemeContextValue = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark");
    const hasHydrated = useRef(false);

    useEffect(() => {
        const nextTheme = readStoredTheme();
        document.documentElement.dataset.theme = nextTheme;

        if (nextTheme !== "dark") {
            const adoption = window.setTimeout(() => {
                hasHydrated.current = true;
                setThemeState(nextTheme);
            }, 0);
            return () => window.clearTimeout(adoption);
        }

        hasHydrated.current = true;
    }, []);

    useEffect(() => {
        if (!hasHydrated.current) return;
        document.documentElement.dataset.theme = theme;
        storeTheme(theme);
    }, [theme]);

    const value: ThemeContextValue = {
        theme,
        setTheme: setThemeState,
        toggleTheme: () => setThemeState((current) => current === "dark" ? "light" : "dark"),
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used inside ThemeProvider.");
    return context;
}
