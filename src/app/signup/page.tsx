"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";

function HoverHalo({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (ref.current) {
      ref.current.style.setProperty("--x", `${e.clientX - rect.left}px`);
      ref.current.style.setProperty("--y", `${e.clientY - rect.top}px`);
    }
  }
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onMove} className="group relative">
      <div aria-hidden className="pointer-events-none absolute -inset-2 rounded-md opacity-0 blur-md transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: "radial-gradient(140px 140px at var(--x,50%) var(--y,50%), rgba(59,130,246,0.45), transparent 65%)" }} />
      {children}
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const first = String(data.get("firstname") || "").trim();
    const last = String(data.get("lastname") || "").trim();
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const confirm = String(data.get("confirmpassword") || "");
    const isTdah = data.get("isTdah") === "on";

    if (!email || !password || !first || !last) { setError("Veuillez compléter tous les champs"); return; }
    if (password.length < 6) { setError("Mot de passe trop court (min 6 caractères)"); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas"); return; }

    setIsSubmitting(true);
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: `${first} ${last}`.trim(), password, isTdah }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string })?.error ?? "Erreur lors de l'inscription");
      }
      // Auto-login — plus de redirection manuelle
      const loginResult = await signIn("credentials", { email, password, redirect: false });
      if (loginResult?.ok) {
        router.push("/onboarding");
      } else {
        router.push("/accueil?login=1");
      }
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500/30 border-t-blue-500" />
          <p className="text-lg font-medium text-white">Création de ton espace...</p>
          <p className="text-sm text-neutral-400">Redirection automatique dans un instant</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">Commencez votre essai gratuit de 1 jour.</h1>
          <p className="mb-6 max-w-xl text-neutral-300">
            Une IA pédagogique qui guide votre enfant étape par étape — sans jamais donner la réponse finale.
          </p>
          <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-sm font-semibold text-blue-300">✓ Adapté TDAH selon les recommandations HAS (2023)</p>
            <p className="mt-1 text-xs text-neutral-400">
              Consignes fragmentées, une seule action par étape, feedback immédiat — conforme aux recommandations de la{" "}
              <a href="https://www.has-sante.fr/jcms/p_3375491/fr/tdah-de-l-enfant-et-de-l-adolescent" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Haute Autorité de Santé</a>.
            </p>
          </div>
          <ul className="mb-6 grid grid-cols-1 gap-2 text-sm text-neutral-300 sm:grid-cols-2">
            {["IA pédagogique (jamais la réponse directe)", "Photo du devoir analysée en secondes", "Sans carte bancaire pendant l'essai", "Annulation à tout moment", "Interface validée pour les profils TDAH"].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-blue-400">✓</span><span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="order-1 lg:order-2">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur">
            <h2 className="mb-1 text-xl font-semibold">Créer un compte</h2>
            <p className="mb-6 text-sm text-neutral-400">Essai 1 jour gratuit · accès immédiat</p>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="w-full space-y-1">
                  <label className="text-sm text-neutral-300" htmlFor="firstname">Prénom de l&apos;enfant</label>
                  <HoverHalo><input name="firstname" id="firstname" required placeholder="Léa" className="relative z-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30" /></HoverHalo>
                </div>
                <div className="w-full space-y-1">
                  <label className="text-sm text-neutral-300" htmlFor="lastname">Nom</label>
                  <HoverHalo><input name="lastname" id="lastname" required placeholder="Dupont" className="relative z-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30" /></HoverHalo>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-neutral-300" htmlFor="email">Email du parent</label>
                <HoverHalo><input name="email" id="email" type="email" required placeholder="parent@exemple.com" className="relative z-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30" /></HoverHalo>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-neutral-300" htmlFor="password">Mot de passe</label>
                <HoverHalo><input name="password" id="password" type="password" required minLength={6} placeholder="••••••••" className="relative z-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30" /></HoverHalo>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-neutral-300" htmlFor="confirmpassword">Confirmer</label>
                <HoverHalo><input name="confirmpassword" id="confirmpassword" type="password" required placeholder="••••••••" className="relative z-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30" /></HoverHalo>
              </div>
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                <p className="mb-1 text-sm font-medium text-blue-200">Votre enfant a-t-il un TDAH ?</p>
                <p className="mb-3 text-xs text-neutral-400">Interface épurée, zéro animation, consignes ultra-courtes — selon les recommandations INSERM et HyperSupers TDAH France.</p>
                <label className="flex cursor-pointer items-center gap-3">
                  <input name="isTdah" id="is-tdah" type="checkbox" className="size-4 rounded border-neutral-700 bg-neutral-950 text-blue-600 focus:ring-0" />
                  <span className="text-sm text-neutral-300">Oui, activer le mode TDAH</span>
                </label>
              </div>
              {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3"><p className="text-sm text-red-400">{error}</p></div>}
              <button disabled={isSubmitting} type="submit" className="h-11 w-full rounded-md bg-blue-600 font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {isSubmitting ? "Création en cours..." : "Commencer l'essai gratuit →"}
              </button>
              <p className="text-center text-xs text-neutral-500">Aucune carte · Aucun engagement · Annulation libre</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
