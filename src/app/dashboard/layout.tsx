import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/accueil?login=1");

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trialEndsAt: true, stripeCurrentPeriodEnd: true, isLifetime: true, onboardingDone: true },
  });

  if (!user || !hasActiveAccess(user)) {
    redirect("/pricing?expired=1");
  }

  if (!user.onboardingDone) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0f1624]">
      <DashboardNav user={session.user} />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
