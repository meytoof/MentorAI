import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/accueil?login=1");
  const userId = (session.user as { id: string }).id;
  const userEmail = (session.user as { email?: string | null }).email ?? null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trialEndsAt: true },
  });
  const isQuentinLifetime = userEmail?.toLowerCase().startsWith("quentinlevis");
  if (
    !user ||
    (!isQuentinLifetime && new Date(user.trialEndsAt).getTime() < Date.now())
  ) {
    redirect("/trial-expired");
  }

  return <>{children}</>;
}
