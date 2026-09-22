import type { Metadata } from "next";
import Script from "next/script";
import "@fontsource-variable/dm-sans";
import "@fontsource/ibm-plex-mono";

import "./globals.css";
import ThemeProvider from "@/components/theme/theme-provider";

export const metadata: Metadata = {
    metadataBase: new URL("https://stadiumpulse-ai-nine.vercel.app"),
    title: {
        default: "PulseOps — Tournament Ops Command Center",
        template: "%s | PulseOps — StadiumPulse AI",
    },
    description:
        "PulseOps is Shaurya Saria's human-controlled stadium operations command center using simulated telemetry and grounded recommendations.",
    applicationName: "PulseOps",
    authors: [{ name: "Shaurya Saria", url: "https://shauryasaria.me/" }],
    creator: "Shaurya Saria",
    keywords: ["PulseOps", "StadiumPulse AI", "stadium operations", "Shaurya Saria"],
    alternates: { canonical: "/login" },
    openGraph: {
        type: "website",
        url: "https://stadiumpulse-ai-nine.vercel.app/login",
        siteName: "Shaurya Saria Projects",
        title: "PulseOps — Tournament Ops Command Center",
        description:
            "A human-controlled stadium operations command center with simulated telemetry and grounded recommendations.",
        locale: "en_IN",
    },
    twitter: {
        card: "summary",
        title: "PulseOps — Tournament Ops Command Center",
        description:
            "A human-controlled stadium operations command center with simulated telemetry and grounded recommendations.",
    },
    robots: { index: true, follow: true },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" data-theme="dark" suppressHydrationWarning>
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify({"@context":"https://schema.org","@type":"SoftwareApplication","name":"PulseOps — Tournament Ops Command Center","description":"PulseOps is Shaurya Saria's human-controlled stadium operations command center using simulated telemetry and grounded recommendations.","applicationCategory":"BusinessApplication","operatingSystem":"Web","author":{"@type":"Person","name":"Shaurya Saria","url":"https://shauryasaria.me/","sameAs":["https://shauryasaria.me/","https://github.com/icecold009"]},"url":"https://stadiumpulse-ai-nine.vercel.app/login","sameAs":["https://github.com/icecold009/stadiumpulse-ai","https://shauryasaria.me/projects"]}) }}
                />
                <Script id="pulseops-theme-init" strategy="beforeInteractive">
                    {`try { var savedTheme = localStorage.getItem("pulseops-theme"); if (savedTheme === "light" || savedTheme === "dark") document.documentElement.dataset.theme = savedTheme; } catch (_) {}`}
                </Script>
            </head>
            <body className="bg-background text-foreground antialiased">
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}
