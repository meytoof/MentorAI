import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1e]">
        <div className="text-center">
          <p className="text-4xl font-bold text-red-400">403</p>
          <p className="mt-2 text-white/60">Accès refusé — connexion requise</p>
        </div>
      </div>
    );
  }

  const userId = (session.user as { id: string }).id;
  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });

  if (!dbUser?.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1e]">
        <div className="text-center">
          <p className="text-4xl font-bold text-red-400">403</p>
          <p className="mt-2 text-white/60">Accès refusé — droits administrateur requis</p>
          <Link href="/dashboard/whiteboard" className="mt-4 inline-block text-sm text-blue-400 hover:underline">
            ← Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/users", label: "Utilisateurs" },
    { href: "/admin/conversations", label: "Conversations" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0f1624]">
      {/* Sidebar */}
      <aside className="flex w-52 flex-col border-r border-white/10 bg-[#0a0f1e] px-4 py-6">
        <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-white/30">Admin</p>
        <nav className="flex flex-col gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <Link href="/dashboard/whiteboard" className="text-xs text-white/30 hover:text-white/60">
            ← App
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
