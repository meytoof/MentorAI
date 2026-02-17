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
    default: "MentorIa - Aide aux devoirs IA pour enfants primaire | TDAH",
    template: "%s | MentorIa",
  },
  description: "L'IA qui aide ton enfant à faire ses devoirs sans jamais donner la réponse. Conçu pour le CP au CM2, validé avec des spécialistes TDAH. Photo de devoir, explications étape par étape.",
  keywords: ["aide aux devoirs", "primaire", "TDAH", "IA", "devoirs enfants", "CP", "CE1", "CE2", "CM1", "CM2"],
  authors: [{ name: "MentorIa" }],
  openGraph: {
    title: "MentorIa - Aide aux devoirs intelligente pour enfants",
    description: "L'IA qui aide ton enfant à faire ses devoirs sans jamais donner la réponse. Pensé pour les enfants TDAH.",
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}











