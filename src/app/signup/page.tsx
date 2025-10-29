"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });
    if (res.ok) {
      router.push("/signin");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Erreur inconnue");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
            Commencez votre essai gratuit d&apos;1 jour
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
                Accédez instantanément à l&apos;essai gratuit
              </p>
            </div>
            <form
              onSubmit={(e) => {
                if (!accept) {
                  e.preventDefault();
                  setError("Veuillez accepter les conditions d'utilisation");
                  return;
                }
                if (password !== confirmPassword) {
                  e.preventDefault();
                  setError("Les mots de passe ne correspondent pas");
                  return;
                }
                return onSubmit(e);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm text-neutral-300">Email</label>
                <input
                  className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none ring-0 focus:border-neutral-700"
                  placeholder="nom@exemple.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-neutral-300">
                  Confirmer le mot de passe
                </label>
                <input
                  className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none ring-0 focus:border-neutral-700"
                  placeholder="Répétez le mot de passe"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-neutral-300">Nom</label>
                <input
                  className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none ring-0 focus:border-neutral-700"
                  placeholder="Prénom Nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-neutral-300">Mot de passe</label>
                <div className="relative">
                  <input
                    className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 pr-10 text-neutral-100 placeholder-neutral-500 outline-none ring-0 focus:border-neutral-700"
                    placeholder="Au moins 6 caractères"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-2 my-auto rounded px-2 text-xs text-neutral-400 hover:text-neutral-200"
                  >
                    {showPassword ? "Masquer" : "Afficher"}
                  </button>
                </div>
                <p className="text-xs text-neutral-500">
                  8+ caractères recommandés. Utilisez lettres, chiffres et
                  symboles.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <input
                  id="accept"
                  type="checkbox"
                  checked={accept}
                  onChange={(e) => setAccept(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-neutral-700 bg-neutral-950 text-blue-600 focus:ring-0"
                />
                <label htmlFor="accept" className="text-sm text-neutral-300">
                  J&apos;accepte les{" "}
                  <a href="/cgv" className="text-blue-400 hover:underline">
                    conditions d&apos;utilisation
                  </a>{" "}
                  et la{" "}
                  <a
                    href="/confidentialite"
                    className="text-blue-400 hover:underline"
                  >
                    politique de confidentialité
                  </a>
                  .
                </label>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-md bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700"
              >
                Créer mon compte
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-neutral-400">
              Déjà un compte ?{" "}
              <a href="/signin" className="text-blue-400 hover:underline">
                Se connecter
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
