import type { Metadata } from "next";
import Script from "next/script";
import "@fontsource-variable/dm-sans";
import "@fontsource/ibm-plex-mono";

import "./globals.css";
import ThemeProvider from "@/components/theme/theme-provider";

export const metadata: Metadata = {
    title: "PulseOps — Tournament Ops Command Center",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" data-theme="dark" suppressHydrationWarning>
            <head>
                <Script id="pulseops-theme-init" strategy="beforeInteractive">
                    {`try { var savedTheme = localStorage.getItem("pulseops-theme"); if (savedTheme === "light" || savedTheme === "dark") document.documentElement.dataset.theme = savedTheme; } catch (_) {}`}
                </Script>
            </head>
            <body className="bg-background text-foreground antialiased">
                <ThemeProvider>
                    {children}
                    <footer style={{ padding: "1rem", textAlign: "center", fontSize: ".8rem", opacity: 0.75 }}>
                        <a href="https://shauryasaria.me" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textUnderlineOffset: "0.2em" }}>
                            Personal website
                        </a>
                    </footer>
                </ThemeProvider>
            </body>
        </html>
    );
}
