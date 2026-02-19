"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StripeVerify() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get("success");
  const [status, setStatus] = useState<"idle" | "verifying" | "done" | "error">("idle");
  const [accessInfo, setAccessInfo] = useState<{ type: "lifetime" | "subscription"; periodEnd: string | null } | null>(null);

  useEffect(() => {
    if (success !== "1") return;
    setStatus("verifying");

    fetch("/api/stripe/verify", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        console.log("Stripe verify:", data.status);
        if (data.status === "lifetime" || data.status === "lifetime_activated") {
          setAccessInfo({ type: "lifetime", periodEnd: null });
        } else if (data.status === "subscription_activated" || data.status === "no_paid_session") {
          setAccessInfo({ type: "subscription", periodEnd: data.periodEnd ?? null });
        }
        setStatus("done");
        setTimeout(() => {
          const url = new URL(window.location.href);
          url.searchParams.delete("success");
          url.searchParams.delete("session_id");
          router.replace(url.pathname);
        }, 6000);
      })
      .catch(() => setStatus("error"));
  }, [success, router]);

  if (status === "idle") return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1624] p-8 text-center shadow-2xl">
        {status === "verifying" && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-blue-500" />
            <h2 className="text-xl font-bold text-white">Vérification du paiement...</h2>
            <p className="mt-2 text-sm text-white/60">Un instant, on synchronise ton compte.</p>
          </>
        )}
        {status === "done" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-400/40">
              <svg className="h-9 w-9 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-emerald-300">Paiement confirmé !</h2>
            <p className="mt-2 text-sm text-white/60">Ton accès est maintenant actif. Bons devoirs !</p>
            {accessInfo && (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                {accessInfo.type === "lifetime" ? (
                  <p className="text-sm font-medium text-emerald-300">
                    Accès à vie — illimité
                  </p>
                ) : accessInfo.periodEnd ? (
                  <>
                    <p className="text-xs text-white/50 uppercase tracking-wide mb-0.5">Abonnement actif jusqu&apos;au</p>
                    <p className="text-sm font-semibold text-emerald-300">
                      {new Date(accessInfo.periodEnd).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </>
                ) : null}
              </div>
            )}
          </>
        )}
        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 ring-4 ring-red-400/40">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-red-300">Erreur de vérification</h2>
            <p className="mt-2 text-sm text-white/60">Le paiement a peut-être été traité. Rafraîchis la page ou contacte le support.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-white/10 px-6 py-2 text-sm font-medium text-white hover:bg-white/20"
            >
              Rafraîchir
            </button>
          </>
        )}
      </div>
    </div>
  );
}
