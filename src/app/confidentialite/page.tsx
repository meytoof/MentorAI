import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité | MentorIa",
  description: "Comment MentorIa protège les données de votre enfant. Conforme RGPD.",
};

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/accueil" className="mb-8 inline-block text-sm text-blue-400 hover:underline">← Retour</Link>
      <h1 className="mb-2 text-3xl font-bold text-white">Politique de confidentialité</h1>
      <p className="mb-10 text-sm text-neutral-400">Conforme RGPD · Dernière mise à jour : janvier 2025</p>
      <div className="space-y-8 text-neutral-300">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">1. Responsable du traitement</h2>
          <p>MentorIa — <a href="mailto:contact@mentoria.fr" className="text-blue-400 hover:underline">contact@mentoria.fr</a></p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">2. Données collectées</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li><strong className="text-white">Compte</strong> : email, prénom, profil TDAH (oui/non).</li>
            <li><strong className="text-white">Questions</strong> : stockées pour la continuité pédagogique (12 mois max).</li>
            <li><strong className="text-white">Photos de devoirs</strong> : transmises à l&apos;IA, <strong>non stockées</strong> sur nos serveurs.</li>
            <li><strong className="text-white">Paiement</strong> : géré exclusivement par Stripe (PCI DSS).</li>
            <li><strong className="text-white">IP</strong> : conservée temporairement à des fins anti-abus uniquement.</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">3. Protection des données des mineurs</h2>
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-sm">
            Le compte est créé par le parent ou tuteur légal. Nous ne collectons pas de données directement auprès des enfants. Conformément au RGPD art. 8, le consentement parental est requis pour les moins de 15 ans.
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">4. Sous-traitants</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li><strong className="text-white">Groq</strong> — traitement IA (USA, garanties adéquates).</li>
            <li><strong className="text-white">Stripe</strong> — paiement (PCI DSS).</li>
            <li><strong className="text-white">Vercel</strong> — hébergement.</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">5. Vos droits</h2>
          <p>Accès, rectification, effacement, portabilité, opposition. Contact : <a href="mailto:contact@mentoria.fr" className="text-blue-400 hover:underline">contact@mentoria.fr</a>. Réponse sous 30 jours. Réclamation : <a href="https://www.cnil.fr" className="text-blue-400 hover:underline">cnil.fr</a></p>
        </section>
      </div>
    </div>
  );
}
