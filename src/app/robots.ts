import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/overview", "/ops", "/sustainability", "/volunteers"],
        },
        sitemap: "https://stadiumpulse-ai-nine.vercel.app/sitemap.xml",
    };
}
