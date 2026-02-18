import { prisma } from "@/lib/prisma";
import AdminCharts from "./AdminCharts";

// Group an array of Dates into {date, count} for the last N days
function groupByDay(dates: Date[], days = 30): { date: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const d of dates) {
    const key = d.toISOString().slice(0, 10);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const result: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key.slice(5).replace("-", "/"), count: counts[key] ?? 0 });
  }
  return result;
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    onboardedUsers,
    totalConversations,
    allUsers,
    recentUsers,
    recentConversations,
    levelGroups,
  ] = await Promise.all([
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
    // For status distribution
    prisma.user.findMany({
      select: { isLifetime: true, stripeCurrentPeriodEnd: true, trialEndsAt: true },
    }),
    // Signups last 30 days
    prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    // Conversations last 30 days
    prisma.conversation.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    // School level distribution
    prisma.user.findMany({
      where: { schoolLevel: { not: null }, onboardingDone: true },
      select: { schoolLevel: true },
    }),
  ]);

  const onboardingRate = totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 0;

  const stats = [
    { label: "Utilisateurs", value: totalUsers, color: "text-blue-400" },
    { label: "Abonnés actifs", value: activeUsers, color: "text-green-400" },
    { label: "Taux onboarding", value: `${onboardingRate}%`, color: "text-violet-400" },
    { label: "Conversations", value: totalConversations, color: "text-amber-400" },
  ];

  // Status distribution
  const lifetime = allUsers.filter((u) => u.isLifetime).length;
  const subscribed = allUsers.filter(
    (u) => !u.isLifetime && u.stripeCurrentPeriodEnd && u.stripeCurrentPeriodEnd > now,
  ).length;
  const trial = allUsers.filter(
    (u) =>
      !u.isLifetime &&
      (!u.stripeCurrentPeriodEnd || u.stripeCurrentPeriodEnd <= now) &&
      u.trialEndsAt > now,
  ).length;
  const expired = allUsers.filter(
    (u) =>
      !u.isLifetime &&
      (!u.stripeCurrentPeriodEnd || u.stripeCurrentPeriodEnd <= now) &&
      u.trialEndsAt <= now,
  ).length;

  const statusDistribution = [
    { name: "Essai", value: trial, color: "#3b82f6" },
    { name: "Abonné", value: subscribed, color: "#22c55e" },
    { name: "Lifetime", value: lifetime, color: "#f59e0b" },
    { name: "Expiré", value: expired, color: "#ef4444" },
  ];

  // School level distribution
  const levelCounts: Record<string, number> = {};
  for (const u of levelGroups) {
    if (u.schoolLevel) levelCounts[u.schoolLevel] = (levelCounts[u.schoolLevel] ?? 0) + 1;
  }
  const levelOrder = ["CP", "CE1", "CE2", "CM1", "CM2", "6e"];
  const levelDistribution = levelOrder
    .filter((l) => levelCounts[l])
    .map((l) => ({ level: l, count: levelCounts[l]! }));

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-white">Dashboard Admin</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-white/40">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <AdminCharts
        signupsByDay={groupByDay(recentUsers.map((u) => u.createdAt))}
        conversationsByDay={groupByDay(recentConversations.map((c) => c.createdAt))}
        statusDistribution={statusDistribution}
        levelDistribution={levelDistribution}
      />
    </div>
  );
}
