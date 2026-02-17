"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  defaultCallbackUrl?: string;
}

export default function LoginModal({ open, onClose, defaultCallbackUrl }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? defaultCallbackUrl ?? "/dashboard/whiteboard";

  const reset = useCallback(() => {
    setEmail("");
    setPassword("");
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false, callbackUrl });
      if (res?.ok) {
        onClose();
        window.location.href = callbackUrl;
      } else {
        setError("Identifiants invalides");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-sm rounded-xl border border-white/10 bg-neutral-900 p-6 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-white">Connexion</DialogTitle>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <input
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
              placeholder="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
