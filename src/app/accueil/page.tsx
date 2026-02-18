import type { Metadata } from "next";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
  title: "Maieutique — L'IA socratique qui aide ton enfant à apprendre, sans jamais tricher",
  description: "Maieutique guide votre enfant étape par étape, sans donner les réponses. Méthode socratique + IA, conçu pour le primaire (CP–CM2) et validé pour les profils TDAH.",
};

export default function Home() {
  return <LandingClient />;
}
