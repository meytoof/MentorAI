import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente | Maieutique",
  description: "CGV de Maieutique — aide aux devoirs IA pour enfants du primaire.",
};

export default function CGVPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/accueil" className="mb-8 inline-block text-sm text-blue-400 hover:underline">← Retour</Link>
      <h1 className="mb-2 text-3xl font-bold text-white">Conditions Générales de Vente</h1>
      <p className="mb-10 text-sm text-neutral-400">Dernière mise à jour : janvier 2025</p>
      <div className="space-y-8 text-neutral-300">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">1. Objet</h2>
          <p>Les présentes CGV régissent les relations contractuelles entre Maieutique et tout utilisateur souhaitant accéder aux services payants.</p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">2. Offres et tarifs</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li><strong className="text-white">Essai gratuit 1 jour</strong> — accès complet, sans engagement, sans carte bancaire.</li>
            <li><strong className="text-white">Abonnement mensuel — 14,90 € / mois</strong> — annulable à tout moment.</li>
            <li><strong className="text-white">Formule sérénité — 80 € une fois</strong> — accès à vie pour un enfant.</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">3. Paiement</h2>
          <p>Paiement sécurisé via Stripe. Maieutique ne stocke aucune donnée bancaire.</p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">4. Droit de rétractation</h2>
          <p>Conformément à l&apos;article L221-18 du Code de la consommation, vous disposez de 14 jours pour vous rétracter.</p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">5. Résiliation</h2>
          <p>L&apos;abonnement mensuel peut être résilié à tout moment depuis votre espace compte. Effet à la fin de la période en cours.</p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">6. Contact</h2>
          <p><a href="mailto:contact@maieutique.app" className="text-blue-400 hover:underline">contact@maieutique.app</a></p>
        </section>
      </div>
    </div>
  );
}
