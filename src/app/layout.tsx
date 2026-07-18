import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";

import "./globals.css";

export const metadata: Metadata = {
    title: "PulseOps — Tournament Ops Command Center",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="bg-background text-foreground antialiased">
                {children}
            </body>
        </html>
    );
}
