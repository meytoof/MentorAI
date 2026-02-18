import type { Metadata } from "next";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
  title: "MentorIA — L'IA qui aide ton enfant à apprendre, sans jamais tricher",
  description: "MentorIA guide votre enfant étape par étape, sans donner les réponses. Conçu pour le primaire (CP–CM2) et validé pour les profils TDAH.",
};

export default function Home() {
  return <LandingClient />;
}
