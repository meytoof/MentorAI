import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Maieutique — L'IA socratique d'aide aux devoirs | Primaire & TDAH",
    template: "%s | Maieutique",
  },
  description: "L'IA qui aide ton enfant à faire ses devoirs sans jamais donner la réponse. Méthode socratique, du CP au CM2, validé pour les profils TDAH. Photo de devoir, explications étape par étape.",
  keywords: ["aide aux devoirs", "primaire", "TDAH", "IA", "maïeutique", "méthode socratique", "devoirs enfants", "CP", "CE1", "CE2", "CM1", "CM2"],
  authors: [{ name: "Maieutique" }],
  openGraph: {
    title: "Maieutique — L'IA qui guide ton enfant sans donner les réponses",
    description: "Méthode socratique + IA : ton enfant apprend à réfléchir par lui-même. Pensé pour le primaire et les profils TDAH.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}











