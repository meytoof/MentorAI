import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import StripePortalButton from "./StripePortalButton";
import TdahToggle from "./TdahToggle";

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  "Mathématiques": ["math", "calcul", "fraction", "nombre", "géométrie", "addition", "soustraction", "multiplication", "division", "problème", "mesure"],
  "Français": ["grammaire", "conjugaison", "orthographe", "verbe", "nom", "adjectif", "phrase", "lecture", "texte", "dictée", "écriture"],
  "Sciences": ["science", "nature", "animal", "plante", "corps", "physique", "chimie", "expérience", "matière", "énergie"],
  "Histoire-Géo": ["histoire", "géographie", "carte", "pays", "époque", "siècle", "roi", "guerre", "civilisation", "continent"],
  "Anglais": ["anglais", "english", "traduction", "vocabulaire", "verbe anglais", "grammaire anglaise"],
};

function detectSubject(text: string): string {
  const lower = text.toLowerCase();
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return subject;
  }
  return "Autre";
}

export default async function ComptePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/accueil?login=1");
  const userId = (session.user as { id: string }).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true, name: true, trialEndsAt: true, createdAt: true, isTdah: true,
      stripeCurrentPeriodEnd: true, isLifetime: true, stripeCustomerId: true, stripePriceId: true,
      xp: true, streak: true, lastSessionAt: true,
    },
  });

  if (!user) redirect("/accueil?login=1");

  const hasAccess = hasActiveAccess(user);
  const isInTrial = !user.isLifetime && !user.stripeCurrentPeriodEnd && user.trialEndsAt > new Date();
  const hasSubscription = !!user.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd > new Date();
  const trialEndsAtFormatted = user.trialEndsAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const subEndsFormatted = user.stripeCurrentPeriodEnd?.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // Conversations des 7 derniers jours
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentConversations = await prisma.conversation.findMany({
    where: { userId, createdAt: { gte: sevenDaysAgo } },
    select: { question: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const totalConversations = await prisma.conversation.count({ where: { userId } });

  // Dates uniques d'activité (7 derniers jours)
  const activeDays = [...new Set(recentConversations.map((c) => c.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })))];

  // Top 5 matières
  const subjectCounts: Record<string, number> = {};
  recentConversations.forEach((c) => {
    const subject = detectSubject(c.question);
    subjectCounts[subject] = (subjectCounts[subject] ?? 0) + 1;
  });
  const topSubjects = Object.entries(subjectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const lastSessionFormatted = user.lastSessionAt
    ? user.lastSessionAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
    : null;

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
          <div className="mt-5 border-t border-white/10 pt-5">
            <TdahToggle initialValue={user.isTdah} />
          </div>
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

        {/* Suivi de l'enfant */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-medium text-white">Suivi de l&apos;enfant</h2>

          {/* Stat cards */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-orange-300">🔥 {user.streak}</p>
              <p className="mt-1 text-xs text-white/50">Jours consécutifs</p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-amber-300">⭐ {user.xp}</p>
              <p className="mt-1 text-xs text-white/50">Points XP totaux</p>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-blue-300">{totalConversations}</p>
              <p className="mt-1 text-xs text-white/50">Questions posées</p>
            </div>
          </div>

          {/* Activité 7 derniers jours */}
          {activeDays.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Activité (7 derniers jours)</p>
              <div className="flex flex-wrap gap-2">
                {activeDays.map((day) => (
                  <span key={day} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    {day}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Matières abordées */}
          {topSubjects.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Matières abordées récemment</p>
              <div className="space-y-2">
                {topSubjects.map(([subject, count]) => (
                  <div key={subject} className="flex items-center justify-between text-sm">
                    <span className="text-white/80">{subject}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">{count} question{count > 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dernière session */}
          {lastSessionFormatted && (
            <p className="text-xs text-white/40">
              Dernière session : <span className="text-white/60">{lastSessionFormatted}</span>
            </p>
          )}

          {totalConversations === 0 && (
            <p className="text-sm text-white/40 italic">Aucune activité encore. Commencez à utiliser MentorIA !</p>
          )}
        </section>
      </div>

      <div className="mt-8">
        <Link href="/dashboard/whiteboard" className="text-sm text-white/60 hover:text-white">← Retour au tableau</Link>
      </div>
    </div>
  );
}
