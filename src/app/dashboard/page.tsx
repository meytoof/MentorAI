import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");
  const userId = (session.user as { id: string }).id;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trialEndsAt: true },
    });
    if (!user || new Date(user.trialEndsAt).getTime() < Date.now()) {
      redirect("/trial-expired");
    }
  }
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-4 text-2xl font-semibold">Tableau de bord</h1>
      <p className="mb-6 text-gray-400">
        Pose une question et ouvre le tableau pour dessiner des indices.
      </p>
      <div className="flex gap-3">
        <Link
          href="/dashboard/whiteboard"
          className="rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800"
        >
          Ouvrir le tableau
        </Link>
      </div>
    </div>
  );
}
