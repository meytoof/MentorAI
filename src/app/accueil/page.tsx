import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      {/* Hero Section - Présentation SEO */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col justify-center">
            <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Aide aux devoirs intelligente pour enfants
            </h1>
            <p className="mb-4 text-lg text-neutral-300 sm:text-xl">
              Une plateforme d&apos;aide aux devoirs révolutionnaire qui guide
              votre enfant vers la solution sans donner les réponses
              directement. Stimulez la réflexion et l&apos;autonomie grâce à une
              assistance pédagogique adaptée.
            </p>
            <p className="mb-8 text-base text-neutral-400 sm:text-lg">
              Notre application utilise l&apos;intelligence artificielle pour
              fournir des indices visuels et des suggestions méthodologiques.
              Votre enfant apprend à résoudre les problèmes par lui-même, étape
              par étape, en développant sa confiance et ses compétences
              cognitives.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Essai gratuit une semaine
              </Link>
              <Link
                href="#fonctionnalites"
                className="inline-flex items-center justify-center rounded-md border border-neutral-600 bg-transparent px-6 py-3 text-base font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
              >
                En savoir plus
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative h-96 w-full rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-8">
              <div className="flex h-full items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800/50">
                <p className="text-center text-neutral-400">
                  Interface tableau interactive
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités */}
      <section
        id="fonctionnalites"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Fonctionnalités principales
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-neutral-400">
            Tout ce dont votre enfant a besoin pour progresser en toute
            autonomie
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/30 p-6">
            <div className="mb-4 text-2xl">🧠</div>
            <h3 className="mb-2 text-xl font-semibold">
              Assistance IA intelligente
            </h3>
            <p className="text-neutral-300">
              Posez une question et recevez des indices méthodologiques.
              L&apos;IA guide la réflexion sans révéler la réponse finale,
              favorisant l&apos;apprentissage autonome.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/30 p-6">
            <div className="mb-4 text-2xl">✏️</div>
            <h3 className="mb-2 text-xl font-semibold">Tableau interactif</h3>
            <p className="text-neutral-300">
              Interface intuitive avec tableau numérique pour dessiner,
              schématiser et visualiser les concepts. Idéal pour les exercices
              de mathématiques et de géométrie.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/30 p-6">
            <div className="mb-4 text-2xl">🎯</div>
            <h3 className="mb-2 text-xl font-semibold">Approche pédagogique</h3>
            <p className="text-neutral-300">
              Méthode socratique qui encourage la découverte par étapes. Votre
              enfant développe sa capacité de résolution de problèmes de manière
              naturelle.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/30 p-6">
            <div className="mb-4 text-2xl">🔒</div>
            <h3 className="mb-2 text-xl font-semibold">Sécurisé et privé</h3>
            <p className="text-neutral-300">
              Données protégées et environnement sécurisé. Votre enfant peut
              travailler en toute tranquillité sans distractions ni publicités.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/30 p-6">
            <div className="mb-4 text-2xl">⚡</div>
            <h3 className="mb-2 text-xl font-semibold">Rapide et accessible</h3>
            <p className="text-neutral-300">
              Interface optimisée pour une utilisation fluide. Compatible avec
              tablettes et ordinateurs pour apprendre partout, à tout moment.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/30 p-6">
            <div className="mb-4 text-2xl">📚</div>
            <h3 className="mb-2 text-xl font-semibold">Toutes matières</h3>
            <p className="text-neutral-300">
              Mathématiques, français, sciences, histoire-géographie... Notre
              outil s&apos;adapte à tous les types d&apos;exercices et de
              devoirs.
            </p>
          </div>
        </div>
      </section>

      {/* Section Tarifs */}
      <section
        id="tarifs"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Tarifs simples et transparents
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-neutral-400">
            Commencez avec un essai gratuit, puis choisissez l&apos;offre qui
            vous convient
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Essai gratuit */}
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/30 p-8 h-full flex flex-col">
            <h3 className="mb-2 text-2xl font-semibold">Essai gratuit</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">Gratuit</span>
            </div>
            <ul className="mb-8 space-y-3 text-neutral-300">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>1 jour d&apos;accès complet</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Toutes les fonctionnalités</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Assistance IA illimitée</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Tableau interactif</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="mt-auto block w-full rounded-md border border-neutral-600 bg-transparent px-6 py-3 text-center font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
            >
              Commencer l&apos;essai
            </Link>
          </div>

          {/* Plan mensuel */}
          <div className="rounded-lg border-2 border-blue-600 bg-neutral-800/50 p-8 ">
            <div className="mb-2 inline-block rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
              POPULAIRE
            </div>
            <h3 className="mb-2 text-2xl font-semibold">Mensuel</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">3€</span>
              <span className="text-neutral-400">/mois</span>
            </div>
            <ul className="mb-8 space-y-3 text-neutral-300">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Accès illimité</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Assistance IA en temps réel</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Support photo intégré</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Résiliation à tout moment</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="mt-auto block w-full rounded-md bg-blue-600 px-6 py-3 text-center font-medium text-white hover:bg-blue-700 transition-colors"
            >
              S&apos;abonner
            </Link>
          </div>

          {/* Plan annuel */}
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/30 p-8 h-full flex flex-col">
            <h3 className="mb-2 text-2xl font-semibold">A vie</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">80€</span>
            </div>
            <ul className="mb-8 space-y-3 text-neutral-300">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Accès illimité à vie</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="mt-auto block w-full rounded-md border border-neutral-600 bg-transparent px-6 py-3 text-center font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
            >
              S&apos;abonner
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
