import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ComptePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/accueil?login=1");
  const userId = (session.user as { id: string }).id;
  const userEmail = (session.user as { email?: string | null }).email ?? null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, trialEndsAt: true, createdAt: true },
  });

  if (!user) redirect("/accueil?login=1");

  const isQuentinLifetime = userEmail?.toLowerCase().startsWith("quentinlevis");
  const trialEnded = !isQuentinLifetime && new Date(user.trialEndsAt).getTime() < Date.now();
  const trialEndsAtFormatted = new Date(user.trialEndsAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-2xl font-semibold text-white">Mon compte</h1>
      <p className="mb-8 text-white/60">
        Gérez vos informations et votre abonnement.
      </p>

      <div className="space-y-6">
        {/* Infos compte */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-medium text-white">Informations</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-white/50">Email</dt>
              <dd className="font-medium text-white">{user.email}</dd>
            </div>
            <div>
              <dt className="text-white/50">Nom</dt>
              <dd className="font-medium text-white">{user.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-white/50">Membre depuis</dt>
              <dd className="font-medium text-white">
                {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
          </dl>
        </section>

        {/* Abonnement */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-medium text-white">Abonnement</h2>
          {isQuentinLifetime ? (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-200">
              <p className="font-medium">Accès à vie</p>
              <p className="text-sm text-green-200/80">Votre compte est actif.</p>
            </div>
          ) : trialEnded ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">
              <p className="font-medium">Essai terminé</p>
              <p className="text-sm text-amber-200/80">
                Votre essai gratuit de 1 jour est terminé. Abonnez-vous pour continuer.
              </p>
              <Link
                href="/accueil#tarifs"
                className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Voir les offres
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <p className="font-medium text-white">Essai gratuit 1 jour</p>
                <p className="text-sm text-white/60">
                  Expire le {trialEndsAtFormatted}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/accueil#tarifs"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                  Améliorer mon abonnement
                </Link>
                <span className="text-sm text-white/50">
                  (résiliation automatique à la fin de l&apos;essai si non abonné)
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Liens SaaS */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-medium text-white">Gestion</h2>
          <ul className="space-y-2">
            <li>
              <Link
                href="/accueil#tarifs"
                className="text-blue-400 hover:underline"
              >
                Changer d&apos;offre (mensuel ↔ formule sérénité)
              </Link>
            </li>
            <li>
              <Link
                href="/accueil#tarifs"
                className="text-blue-400 hover:underline"
              >
                Résilier mon abonnement
              </Link>
            </li>
          </ul>
          <p className="mt-4 text-xs text-white/50">
            Les paiements et factures sont gérés par notre prestataire. En bêta, l&apos;abonnement n&apos;est pas encore actif.
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Link
          href="/dashboard/whiteboard"
          className="text-sm text-white/60 hover:text-white"
        >
          ← Retour au tableau
        </Link>
      </div>
    </div>
  );
}
