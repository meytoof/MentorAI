import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import StripePortalButton from "./StripePortalButton";

export default async function ComptePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/accueil?login=1");
  const userId = (session.user as { id: string }).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true, name: true, trialEndsAt: true, createdAt: true,
      stripeCurrentPeriodEnd: true, isLifetime: true, stripeCustomerId: true, stripePriceId: true,
    },
  });

  if (!user) redirect("/accueil?login=1");

  const hasAccess = hasActiveAccess(user);
  const isInTrial = !user.isLifetime && !user.stripeCurrentPeriodEnd && user.trialEndsAt > new Date();
  const hasSubscription = !!user.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd > new Date();
  const trialEndsAtFormatted = user.trialEndsAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const subEndsFormatted = user.stripeCurrentPeriodEnd?.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-2xl font-semibold text-white">Mon compte</h1>
      <p className="mb-8 text-white/60">Gérez vos informations et votre abonnement.</p>

      <div className="space-y-6">
        {/* Infos */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-medium text-white">Informations</h2>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-white/50">Email</dt><dd className="font-medium text-white">{user.email}</dd></div>
            <div><dt className="text-white/50">Nom</dt><dd className="font-medium text-white">{user.name ?? "—"}</dd></div>
            <div>
              <dt className="text-white/50">Membre depuis</dt>
              <dd className="font-medium text-white">{user.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</dd>
            </div>
          </dl>
        </section>

        {/* Abonnement */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-medium text-white">Abonnement</h2>

          {user.isLifetime && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4">
              <p className="font-semibold text-green-300">🎉 Accès à vie · Fondateur</p>
              <p className="mt-1 text-sm text-green-200/70">Accès permanent à toutes les fonctionnalités.</p>
            </div>
          )}

          {hasSubscription && !user.isLifetime && (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-4">
                <p className="font-semibold text-blue-300">✅ Abonnement actif</p>
                <p className="mt-1 text-sm text-blue-200/70">Prochain renouvellement : {subEndsFormatted}</p>
              </div>
              {user.stripeCustomerId && <StripePortalButton />}
            </div>
          )}

          {isInTrial && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
                <p className="font-semibold text-amber-300">⏳ Essai gratuit</p>
                <p className="mt-1 text-sm text-amber-200/70">Expire le {trialEndsAtFormatted}</p>
              </div>
              <Link href="/pricing" className="inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
                Choisir un plan →
              </Link>
            </div>
          )}

          {!hasAccess && (
            <div className="space-y-4">
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4">
                <p className="font-semibold text-red-300">❌ Accès expiré</p>
                <p className="mt-1 text-sm text-red-200/70">Ton essai est terminé. Abonne-toi pour continuer.</p>
              </div>
              <Link href="/pricing" className="inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
                Voir les offres →
              </Link>
            </div>
          )}
        </section>
      </div>

      <div className="mt-8">
        <Link href="/dashboard/whiteboard" className="text-sm text-white/60 hover:text-white">← Retour au tableau</Link>
      </div>
    </div>
  );
}
