"use client";

import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";

function HoverHalo({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (ref.current) {
      ref.current.style.setProperty("--x", `${x}px`);
      ref.current.style.setProperty("--y", `${y}px`);
    }
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onMove}
      className="group relative"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-md opacity-0 blur-md transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(140px 140px at var(--x,50%) var(--y,50%), rgba(59,130,246,0.45), transparent 65%)",
        }}
      />
      {children}
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    if (!email || !password || !first || !last) {
      setError("Veuillez compléter tous les champs requis");
      return;
    }
    if (password.length < 6) {
      setError("Mot de passe trop court (min 6 caractères)");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: `${first} ${last}`.trim(),
          password,
          isTdah,
        }),
      });
      if (res.ok) {
        router.push("/accueil?login=1");
      } else {
        type ErrorResponse = { error?: string } | undefined;
        const j: ErrorResponse = await res.json().catch(() => undefined);
        setError(j?.error ?? "Erreur inconnue");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
            Commencez votre essai gratuit de 1 jour.
          </h1>
          <p className="mb-6 max-w-xl text-neutral-300">
            Une plateforme d&apos;aide aux devoirs qui motive votre enfant.
            Indices visuels, tableau interactif et méthode pas à pas pour
            apprendre en autonomie, sans donner la réponse finale.
          </p>
          <ul className="mb-8 grid grid-cols-1 gap-3 text-sm text-neutral-300 sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Assistance IA pédagogique</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Tableau interactif</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Sans carte pendant l&apos;essai</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Annulation à tout moment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>
                Pensé pour les TDAH et les troubles du spectre de l&apos;autisme
              </span>
            </li>
          </ul>
          <div className="flex items-center gap-6 text-sm text-neutral-400">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="size-8 rounded-full bg-neutral-700" />
              <div className="size-8 rounded-full bg-neutral-700" />
              <div className="size-8 rounded-full bg-neutral-700" />
            </div>
            <p>Rejoint par des parents motivés</p>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Créer un compte</h2>
              <p className="text-sm text-neutral-400">
                Accédez instantanément à votre espace
              </p>
            </div>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="mb-2 flex flex-col gap-2 sm:flex-row">
                <div className="w-full space-y-2">
                  <label
                    className="text-sm text-neutral-300"
                    htmlFor="firstname"
                  >
                    Prénom
                  </label>
                  <HoverHalo>
                    <input
                      name="firstname"
                      id="firstname"
                      className="relative z-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none transition-colors group-hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                      placeholder="Prénom"
                    />
                  </HoverHalo>
                </div>
                <div className="w-full space-y-2">
                  <label
                    className="text-sm text-neutral-300"
                    htmlFor="lastname"
                  >
                    Nom
                  </label>
                  <HoverHalo>
                    <input
                      name="lastname"
                      id="lastname"
                      className="relative z-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none transition-colors group-hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                      placeholder="Nom"
                    />
                  </HoverHalo>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-neutral-300" htmlFor="email">
                  Adresse email
                </label>
                <HoverHalo>
                  <input
                    name="email"
                    id="email"
                    type="email"
                    className="relative z-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none transition-colors group-hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                    placeholder="nom@exemple.com"
                  />
                </HoverHalo>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-neutral-300" htmlFor="password">
                  Mot de passe
                </label>
                <HoverHalo>
                  <input
                    name="password"
                    id="password"
                    type="password"
                    className="relative z-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none transition-colors group-hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                    placeholder="••••••••"
                  />
                </HoverHalo>
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm text-neutral-300"
                  htmlFor="confirmpassword"
                >
                  Confirmer le mot de passe
                </label>
                <HoverHalo>
                  <input
                    name="confirmpassword"
                    id="confirmpassword"
                    type="password"
                    className="relative z-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none transition-colors group-hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                    placeholder="••••••••"
                  />
                </HoverHalo>
              </div>
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                <p className="mb-3 text-sm font-medium text-blue-200">
                  Votre enfant a-t-il un trouble de l&apos;attention (TDAH) ?
                </p>
                <p className="mb-3 text-xs text-neutral-400">
                  Nous adapterons l&apos;interface : plus épurée et sans distractions pour faciliter la concentration.
                </p>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    name="isTdah"
                    id="is-tdah"
                    type="checkbox"
                    className="size-4 rounded border-neutral-700 bg-neutral-950 text-blue-600 focus:ring-0"
                  />
                  <span className="text-sm text-neutral-300">Oui, mon enfant est TDAH</span>
                </label>
              </div>
              <button
                disabled={isSubmitting}
                type="submit"
                className="h-11 w-full rounded-md bg-blue-600 px-4 text-center font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                {isSubmitting ? "Inscription..." : "S'inscrire"}
              </button>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-neutral-800 dark:bg-zinc-900 dark:text-neutral-100 dark:hover:bg-zinc-800"
                >
                  <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.7h5.2c-.2 1.2-1.5 3.6-5.2 3.6-3.1 0-5.7-2.6-5.7-5.7s2.6-5.7 5.7-5.7c1.8 0 3 .8 3.7 1.5l2.5-2.5C16.7 3.7 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1-.1-1.4H12z"
                    />
                    <path
                      fill="#34A853"
                      d="M3.9 7.5l3 2.2C7.8 8 9.7 6.6 12 6.6c1.8 0 3 .8 3.7 1.5l2.5-2.5C16.7 3.7 14.6 2.8 12 2.8c-3.6 0-6.8 2.1-8.1 5z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M12 21.2c2.6 0 4.7-.9 6.3-2.3l-2.9-2.4c-.8.6-1.9 1-3.4 1-3.7 0-5-2.4-5.2-3.6H1.6v2.3c1.3 3 4.3 5 8.4 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M21.2 12c0-.6-.1-1-.1-1.4H12v3.7h5.2c-.3 1.6-1.8 3-5.2 3-2.4 0-4.3-1.4-5-3.4H1.6v2.3c1.3 3 4.3 5 8.4 5 5.3 0 8.8-3.7 8.8-9z"
                    />
                  </svg>
                  Continuer avec Google
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
