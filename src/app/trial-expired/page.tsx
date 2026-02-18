import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Essai terminé — MentorIa",
  robots: { index: false },
};

export default function TrialExpiredPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f1624] px-4 py-16 text-center">
      <div className="w-full max-w-md">
        {/* Icône */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-3xl">
          ⏰
        </div>

        <h1 className="mb-3 text-2xl font-bold text-white">
          Ton essai gratuit est terminé
        </h1>
        <p className="mb-8 text-white/60">
          Tu as exploré MentorIa pendant 1 jour. Pour continuer à aider{" "}
          <span className="text-white/80">ton enfant avec ses devoirs</span>, choisis
          la formule qui te convient.
        </p>

        {/* Cartes tarifs */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Mensuel */}
          <div className="rounded-xl border border-blue-500/40 bg-blue-500/5 p-5 text-left">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-400">
              Mensuel
            </p>
            <p className="mb-1 text-2xl font-bold text-white">14,90 €</p>
            <p className="mb-3 text-xs text-white/50">par mois · résiliable à tout moment</p>
            <ul className="mb-4 space-y-1 text-xs text-white/70">
              <li>✓ Aide illimitée</li>
              <li>✓ Mode TDAH</li>
              <li>✓ Photos de devoirs</li>
            </ul>
            <Link
              href="/pricing"
              className="block w-full rounded-md bg-blue-600 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Choisir mensuel →
            </Link>
          </div>

          {/* Vie */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-left">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/50">
              Sérénité
            </p>
            <p className="mb-1 text-2xl font-bold text-white">80 €</p>
            <p className="mb-3 text-xs text-white/50">paiement unique · accès à vie</p>
            <ul className="mb-4 space-y-1 text-xs text-white/70">
              <li>✓ Accès à vie</li>
              <li>✓ Tout inclus</li>
              <li>✓ 1 enfant</li>
            </ul>
            <Link
              href="/pricing"
              className="block w-full rounded-md border border-white/20 py-2 text-center text-sm font-medium text-white/80 hover:bg-white/10 transition-colors"
            >
              Choisir sérénité →
            </Link>
          </div>
        </div>

        <Link
          href="/dashboard/compte"
          className="text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          ← Voir mon compte
        </Link>
      </div>
    </div>
  );
}
