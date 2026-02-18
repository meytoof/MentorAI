import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const now = new Date();

  const [totalUsers, activeUsers, onboardedUsers, totalConversations] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        OR: [
          { isLifetime: true },
          { stripeCurrentPeriodEnd: { gt: now } },
          { trialEndsAt: { gt: now } },
        ],
      },
    }),
    prisma.user.count({ where: { onboardingDone: true } }),
    prisma.conversation.count(),
  ]);

  const onboardingRate = totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 0;

  const stats = [
    { label: "Utilisateurs", value: totalUsers, color: "text-blue-400" },
    { label: "Abonnés actifs", value: activeUsers, color: "text-green-400" },
    { label: "Taux onboarding", value: `${onboardingRate}%`, color: "text-violet-400" },
    { label: "Conversations", value: totalConversations, color: "text-amber-400" },
  ];

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-white">Dashboard Admin</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-white/40">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
