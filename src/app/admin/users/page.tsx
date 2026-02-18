import { prisma } from "@/lib/prisma";
import Link from "next/link";

const PAGE_SIZE = 50;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getStatus(user: {
  isLifetime: boolean;
  stripeCurrentPeriodEnd: Date | null;
  trialEndsAt: Date;
}): { label: string; color: string } {
  const now = new Date();
  if (user.isLifetime) return { label: "Vie", color: "text-amber-400" };
  if (user.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd > now) return { label: "Abonné", color: "text-green-400" };
  if (user.trialEndsAt > now) return { label: "Essai", color: "text-blue-400" };
  return { label: "Expiré", color: "text-red-400" };
}

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(String(params.page ?? "1"), 10));
  const skip = (page - 1) * PAGE_SIZE;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        childAge: true,
        schoolLevel: true,
        hasRedoublement: true,
        mentoriaReason: true,
        learningObjective: true,
        isTdah: true,
        onboardingDone: true,
        isLifetime: true,
        stripeCurrentPeriodEnd: true,
        trialEndsAt: true,
        createdAt: true,
      },
    }),
    prisma.user.count(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">
        Utilisateurs <span className="text-sm font-normal text-white/40">({total})</span>
      </h1>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-widest text-white/40">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Âge</th>
              <th className="px-4 py-3">Classe</th>
              <th className="px-4 py-3">Redobl.</th>
              <th className="px-4 py-3">Raison</th>
              <th className="px-4 py-3">Objectif</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Inscription</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const status = getStatus(u);
              return (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-white">
                    {u.name ?? "—"}
                    {u.isTdah && (
                      <span className="ml-1 rounded bg-violet-500/20 px-1 py-0.5 text-[10px] font-semibold text-violet-300">
                        TDAH
                      </span>
                    )}
                    {!u.onboardingDone && (
                      <span className="ml-1 rounded bg-orange-500/20 px-1 py-0.5 text-[10px] font-semibold text-orange-300">
                        No OB
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/60">{u.email}</td>
                  <td className="px-4 py-3 text-white/60">{u.childAge ?? "—"}</td>
                  <td className="px-4 py-3 text-white/60">{u.schoolLevel ?? "—"}</td>
                  <td className="px-4 py-3 text-white/60">
                    {u.hasRedoublement === null ? "—" : u.hasRedoublement ? "Oui" : "Non"}
                  </td>
                  <td className="px-4 py-3 text-white/60">{u.mentoriaReason ?? "—"}</td>
                  <td className="px-4 py-3 text-white/60">{u.learningObjective ?? "—"}</td>
                  <td className={`px-4 py-3 font-semibold ${status.color}`}>{status.label}</td>
                  <td className="px-4 py-3 text-white/40">
                    {u.createdAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/users?page=${page - 1}`}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/60 hover:bg-white/5"
            >
              ← Précédent
            </Link>
          )}
          <span className="text-sm text-white/40">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/users?page=${page + 1}`}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/60 hover:bg-white/5"
            >
              Suivant →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
