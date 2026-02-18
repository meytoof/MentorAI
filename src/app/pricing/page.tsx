"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const plans = [
  {
    id: "free",
    name: "Essai Gratuit",
    price: "0€",
    period: "1 jour",
    description: "Découvre Maieutique sans engagement",
    features: [
      "Accès complet 7 jours",
      "Aide aux devoirs IA illimitée",
      "Mode TDAH inclus",
      "Photos de devoirs",
    ],
    cta: "Commencer l'essai",
    highlight: false,
    mode: null,
    priceEnvKey: null,
  },
  {
    id: "monthly",
    name: "Maieutique Mensuel",
    price: "14,90€",
    period: "/ mois",
    description: "Accès illimité, résiliable à tout moment",
    features: [
      "Accès illimité à vie du plan",
      "Aide IA personnalisée",
      "Mode TDAH avancé",
      "Photos de devoirs",
      "Historique des conversations",
      "Support prioritaire",
    ],
    cta: "Choisir ce plan",
    highlight: true,
    mode: "subscription",
    priceEnvKey: "monthly",
  },
  {
    id: "lifetime",
    name: "Maieutique à Vie",
    price: "80€",
    period: "une fois",
    description: "Paiement unique, accès permanent",
    features: [
      "Tout du plan Mensuel",
      "Accès permanent sans abonnement",
      "Mises à jour incluses à vie",
      "Badge 'Fondateur'",
    ],
    cta: "Obtenir l'accès à vie",
    highlight: false,
    mode: "payment",
    priceEnvKey: "lifetime",
  },
];

function PricingContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "1";
  const canceled = searchParams.get("canceled") === "1";
  const [loading, setLoading] = useState<string | null>(null);

  async function handlePlan(plan: typeof plans[0]) {
    if (plan.id === "free") {
      router.push(session ? "/dashboard" : "/signup");
      return;
    }
    if (!session) {
      router.push("/signup?redirect=/pricing");
      return;
    }
    setLoading(plan.id);
    try {
      const priceId = plan.priceEnvKey === "monthly"
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME;

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, mode: plan.mode }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Erreur lors du paiement. Réessaie !");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] px-4 py-16">
      {/* Header */}
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <div className="mb-4 inline-block rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 ring-1 ring-blue-500/20">
          Tarifs simples et transparents
        </div>
        <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
          Aide aux devoirs IA pour <span className="text-blue-400">chaque enfant</span>
        </h1>
        <p className="text-lg text-white/60">
          Essaie gratuitement 1 jour. Aucune carte requise pour démarrer.
        </p>
      </div>

      {/* Banners */}
      {expired && (
        <div className="mx-auto mb-8 max-w-xl rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 text-center text-amber-300">
          ⏰ Ton essai est terminé. Choisis un plan pour continuer !
        </div>
      )}
      {canceled && (
        <div className="mx-auto mb-8 max-w-xl rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-center text-red-300">
          Le paiement a été annulé. Tu peux réessayer à tout moment.
        </div>
      )}

      {/* Cards */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-3xl p-8 transition-all ${
              plan.highlight
                ? "border-2 border-blue-500 bg-blue-500/10 shadow-[0_0_40px_rgba(59,130,246,0.15)]"
                : "border border-white/10 bg-white/5"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-5 py-1 text-sm font-semibold text-white shadow-lg">
                ⭐ Le plus populaire
              </div>
            )}
            <div className="mb-6">
              <h2 className="mb-1 text-xl font-bold text-white">{plan.name}</h2>
              <p className="text-sm text-white/50">{plan.description}</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-black text-white">{plan.price}</span>
              <span className="ml-2 text-white/50">{plan.period}</span>
            </div>
            <ul className="mb-8 flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-white/80">
                  <span className="mt-0.5 text-green-400">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handlePlan(plan)}
              disabled={loading === plan.id}
              className={`w-full rounded-2xl py-3.5 text-base font-semibold transition-all disabled:opacity-60 ${
                plan.highlight
                  ? "bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/25"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {loading === plan.id ? "Chargement..." : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="mt-12 text-center text-sm text-white/30">
        Paiements sécurisés par Stripe · Annulation en 1 clic · Support par email
      </p>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0a0f1e] text-white/60">Chargement...</div>}>
      <PricingContent />
    </Suspense>
  );
}
