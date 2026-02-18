"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t border-neutral-800 bg-neutral-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4 flex items-center">
              <div className="size-8 rounded bg-blue-600"></div>
              <span className="ml-2 text-lg font-semibold text-white">MentorIa</span>
            </div>
            <p className="mb-4 max-w-md text-sm text-neutral-400">
              L&apos;IA qui aide ton enfant à faire ses devoirs sans jamais donner la réponse.
              Adapté aux profils TDAH selon les recommandations de la{" "}
              <a href="https://www.has-sante.fr/jcms/p_3375491/fr/tdah-de-l-enfant-et-de-l-adolescent" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-200">HAS (2023)</a>.
            </p>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/accueil" className="text-neutral-400 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/accueil#fonctionnalites" className="text-neutral-400 hover:text-white transition-colors">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link href="/accueil#tarifs" className="text-neutral-400 hover:text-white transition-colors">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-neutral-400 hover:text-white transition-colors">
                  Essai gratuit
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:contact@mentoria.fr" className="text-neutral-400 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <Link href="/accueil#faq" className="text-neutral-400 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/cgv" className="text-neutral-400 hover:text-white transition-colors">
                  CGV
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="text-neutral-400 hover:text-white transition-colors">
                  Confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Barre du bas */}
        <div className="mt-12 border-t border-neutral-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-neutral-400">
              © {year ?? 2025} MentorIa. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-sm text-neutral-400">
              <Link href="/cgv" className="hover:text-white transition-colors">
                CGV
              </Link>
              <Link href="/confidentialite" className="hover:text-white transition-colors">
                Confidentialité
              </Link>
              <Link href="/mentions-legales" className="hover:text-white transition-colors">
                Mentions légales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}












