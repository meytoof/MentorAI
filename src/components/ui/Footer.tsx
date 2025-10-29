import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4 flex items-center">
              <div className="size-8 rounded bg-blue-600"></div>
              <span className="ml-2 text-lg font-semibold text-white">Devoirs</span>
            </div>
            <p className="mb-4 max-w-md text-sm text-neutral-400">
              Plateforme d'aide aux devoirs intelligente qui guide les enfants 
              vers l'autonomie et la confiance en soi grâce à une assistance 
              pédagogique adaptée.
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
                <Link href="#fonctionnalites" className="text-neutral-400 hover:text-white transition-colors">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link href="#tarifs" className="text-neutral-400 hover:text-white transition-colors">
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
                <Link href="/contact" className="text-neutral-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/aide" className="text-neutral-400 hover:text-white transition-colors">
                  Centre d'aide
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
              © {new Date().getFullYear()} Devoirs. Tous droits réservés.
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

