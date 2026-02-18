import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales | Maieutique",
};

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/accueil" className="mb-8 inline-block text-sm text-blue-400 hover:underline">← Retour</Link>
      <h1 className="mb-2 text-3xl font-bold text-white">Mentions légales</h1>
      <p className="mb-10 text-sm text-neutral-400">Loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique</p>
      <div className="space-y-8 text-neutral-300">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">Éditeur</h2>
          <p>Maieutique — <a href="mailto:contact@maieutique.app" className="text-blue-400 hover:underline">contact@maieutique.app</a></p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">Hébergement</h2>
          <p>Vercel Inc. · 440 N Barranca Ave #4133, Covina, CA 91723, USA · <a href="https://vercel.com" className="text-blue-400 hover:underline">vercel.com</a></p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">Propriété intellectuelle</h2>
          <p>L&apos;ensemble du contenu est protégé par le droit d&apos;auteur. Toute reproduction sans autorisation est interdite.</p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">Cookies</h2>
          <p>Uniquement des cookies strictement nécessaires au fonctionnement (session d&apos;authentification). Aucun cookie publicitaire ou de tracking.</p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">Intelligence artificielle</h2>
          <p>Maieutique utilise des modèles IA (Groq / Meta Llama) pour générer des réponses pédagogiques. Ces réponses peuvent contenir des erreurs. Maieutique ne garantit pas leur exactitude absolue.</p>
        </section>
      </div>
    </div>
  );
}
