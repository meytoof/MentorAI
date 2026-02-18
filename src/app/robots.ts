import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXTAUTH_URL ?? "https://mentoria.fr";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/accueil", "/signup", "/cgv", "/confidentialite", "/mentions-legales"],
        disallow: ["/dashboard/", "/api/", "/trial-expired"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
