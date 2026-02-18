"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import LoginModal from "./LoginModal";

function LandingNavContent() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  useEffect(() => {
    if (searchParams.get("login") === "1") setLoginOpen(true);
  }, [searchParams]);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/6 bg-[#060c18]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/accueil" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">MentorIA</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/accueil#demo" className="text-sm text-white/55 transition-colors hover:text-white">Démo</Link>
            <Link href="/accueil#comment-ca-marche" className="text-sm text-white/55 transition-colors hover:text-white">Comment ça marche</Link>
            <Link href="/accueil#tdah" className="text-sm text-white/55 transition-colors hover:text-white">TDAH</Link>
            <Link href="/pricing" className="text-sm text-white/55 transition-colors hover:text-white">Tarifs</Link>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <span className="size-7 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                    {session.user?.name?.[0]?.toUpperCase() ?? session.user?.email?.[0]?.toUpperCase() ?? "U"}
                  </span>
                  <span className="hidden md:block">{session.user?.name ?? session.user?.email}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-md bg-gray-900 border border-white/10 shadow-lg z-50">
                    <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                      Mon tableau de bord
                    </Link>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/accueil" })}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5"
                    >
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setLoginOpen(true)}
                  className="hidden text-sm text-white/55 hover:text-white md:block transition-colors"
                >
                  Connexion
                </button>
                <Link
                  href="/signup"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                >
                  Essai gratuit →
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

export default function LandingNav() {
  return (
    <Suspense fallback={null}>
      <LandingNavContent />
    </Suspense>
  );
}
