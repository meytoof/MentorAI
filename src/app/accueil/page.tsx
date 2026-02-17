import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accueil",
  description: "MentorIa - L'IA qui aide ton enfant à faire ses devoirs sans jamais donner la réponse. Essai gratuit 1 jour. Conçu pour le primaire et les enfants TDAH.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Hero Section - Promesse forte + validation experts TDAH */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col justify-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              Aide aux devoirs pour le primaire
            </p>
            <h1 className="mb-4 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              L&apos;IA qui aide ton enfant à faire ses devoirs
              <span className="block text-blue-400">
                sans jamais donner la réponse.
              </span>
            </h1>
            <p className="mb-4 text-lg text-neutral-700 sm:text-xl">
              Prenez le devoir en photo, l&apos;IA surligne les éléments clés et
              explique avec des mini‑leçons simples. Votre enfant comprend
              vraiment ce qu&apos;il fait, sans jamais copier une réponse toute
              faite.
            </p>
            <p className="mb-8 text-base text-neutral-500 sm:text-lg">
              Conçu pour les enfants du CP au CM2 et{" "}
              <span className="font-semibold text-neutral-900">
                validé avec des spécialistes des troubles de l&apos;attention
                (TDAH)
              </span>
              : consignes courtes, étapes découpées et rappels visuels pensés
              pour garder le cap.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Commencer l&apos;essai gratuit 1 jour
              </Link>
              <Link
                href="#comment-ca-marche"
                className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-6 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Voir comment ça marche
              </Link>
            </div>
            <p className="mt-4 text-xs text-neutral-400">
              Aucun engagement pendant l&apos;essai. Pas de carte bancaire
              obligatoire en bêta.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative h-96 w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              <div className="flex h-full items-stretch rounded-xl bg-white shadow-sm">
                <div className="w-1/2 border-r border-neutral-100 px-5 py-4 text-sm">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Capture du devoir
                  </p>
                  <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-3 py-6 text-xs text-neutral-500">
                    Photo du cahier de maths<br />
                    <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                      Zones importantes détectées
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] text-neutral-500">
                    L&apos;IA repère la consigne, les nombres, les mots clés et
                    prépare des explications adaptées à son âge.
                  </p>
                </div>
                <div className="w-1/2 px-5 py-4 text-sm">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Validation TDAH
                  </p>
                  <div className="space-y-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-3 text-xs text-neutral-700">
                    <p className="text-[11px] font-semibold text-blue-700">
                      “Les consignes sont découpées en petites étapes,
                      parfaites pour les enfants avec TDAH.”
                    </p>
                    <p className="text-[11px] text-neutral-600">
                      <span className="font-medium">Psychologue spécialisée TDAH</span>, réseau partenaire
                    </p>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-[11px] text-neutral-600">
                    <li>• Pas de longs pavés de texte</li>
                    <li>• Une seule action par étape</li>
                    <li>• Encouragements fréquents pour rester motivé</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section
        id="comment-ca-marche"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Comment ça marche ?
            </h2>
            <p className="mb-6 text-neutral-700">
              En trois étapes, votre enfant obtient une aide claire, sans triche,
              que ce soit pour un exercice de maths, de français ou de lecture.
            </p>
            <ul className="space-y-4 text-sm text-neutral-800">
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold">
                  1
                </span>
                <div>
                  <p className="font-semibold">Prenez le devoir en photo</p>
                  <p className="text-neutral-500">
                    Photographiez la page de cahier ou la feuille d&apos;exercice.
                    L&apos;IA reconnait l&apos;énoncé et les consignes.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold">
                  2
                </span>
                <div>
                  <p className="font-semibold">
                    L&apos;IA surligne et explique les points clés
                  </p>
                  <p className="text-neutral-500">
                    Les mots importants sont mis en évidence. Au survol, une
                    mini‑leçon apparaît pour rappeler la règle ou la méthode.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold">
                  3
                </span>
                <div>
                  <p className="font-semibold">Votre enfant répond seul</p>
                  <p className="text-neutral-500">
                    L&apos;IA ne donne jamais la réponse finale. Elle pose des
                    questions simples pour l&apos;aider à trouver par lui‑même.
                  </p>
                </div>
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
            <p className="mb-4 text-sm font-semibold text-blue-700">
              Pensé pour le primaire (CP à CM2) et validé par des experts TDAH
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-white p-4 border border-neutral-200">
                <p className="text-sm font-semibold text-neutral-900">
                  CP – CE1
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  Lire la consigne, repérer les verbes d&apos;action, comprendre
                  les petits calculs.
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 border border-neutral-200">
                <p className="text-sm font-semibold text-neutral-900">
                  CE2 – CM1
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  Poser des opérations, revoir les temps en français, organiser
                  ses idées pour une rédaction.
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 md:col-span-2 border border-neutral-200">
                <p className="text-sm font-semibold text-neutral-900">CM2</p>
                <p className="mt-1 text-xs text-neutral-600">
                  Préparer l&apos;entrée au collège en consolidant les bases
                  (fractions, problèmes, grammaire) sans se contenter de copier
                  une réponse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités orientées bénéfices + TDAH */}
      <section
        id="fonctionnalites"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="text-center">
          <h2 className="mb-2 text-3xl font-bold sm:text-4xl">
            Ce que l&apos;IA fait (et ne fera jamais)
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-neutral-600">
            Un copilote pédagogique conçu avec des experts TDAH, pas une machine à tricher.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-4 text-2xl">🧠</div>
            <h3 className="mb-2 text-xl font-semibold">
              Explique, ne donne pas la réponse
            </h3>
            <p className="text-neutral-700">
              L&apos;IA reformule l&apos;énoncé, rappelle la règle et guide étape
              par étape. Elle ne remplit jamais la case à la place de votre
              enfant.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-4 text-2xl">✏️</div>
            <h3 className="mb-2 text-xl font-semibold">
              Surlignage & mini‑leçons au survol
            </h3>
            <p className="text-neutral-700">
              Les mots clés sont surlignés. Au survol, une petite explication
              apparaît pour rappeler la règle ou le vocabulaire.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-4 text-2xl">🎯</div>
            <h3 className="mb-2 text-xl font-semibold">
              Adapté au niveau de l&apos;enfant
            </h3>
            <p className="text-neutral-700">
              Langage simple pour les plus petits, exemples un peu plus
              structurés pour les CM1‑CM2. L&apos;objectif : qu&apos;il comprenne
              vraiment.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-4 text-2xl">💬</div>
            <h3 className="mb-2 text-xl font-semibold">
              Pensé pour les enfants TDAH
            </h3>
            <p className="text-neutral-700">
              Consignes courtes, découpées, avec des rappels visuels et des
              encouragements fréquents pour maintenir l&apos;attention.
              Validé avec des professionnels qui accompagnent des enfants TDAH
              au quotidien.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-4 text-2xl">🔒</div>
            <h3 className="mb-2 text-xl font-semibold">Sécurisé et ciblé</h3>
            <p className="text-neutral-700">
              Usage limité aux devoirs et notions scolaires. Si la question
              sort de ce cadre, l&apos;IA redirige poliment l&apos;enfant.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-4 text-2xl">📚</div>
            <h3 className="mb-2 text-xl font-semibold">Toutes matières</h3>
            <p className="text-neutral-700">
              Mathématiques, français, lecture, histoire‑géo, sciences…
              l&apos;outil s&apos;adapte au contenu du devoir envoyé.
            </p>
          </div>
        </div>
      </section>

      {/* Section Tarifs orientée conversion */}
      <section
        id="tarifs"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Tarifs simples pour des soirées devoirs plus sereines
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-neutral-400">
            Commencez par 1 jour d&apos;essai gratuit, puis choisissez la
            formule qui vous rassure. Une seule offre claire pour le lancement.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Essai gratuit */}
          <div className="rounded-lg border border-neutral-200 bg-white p-8 h-full flex flex-col">
            <h3 className="mb-2 text-2xl font-semibold">Essai gratuit 1 jour</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">0€</span>
            </div>
            <ul className="mb-8 space-y-3 text-neutral-700">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Accès complet à toutes les fonctionnalités</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Analyse de devoirs par photo</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Assistance IA pédagogique illimitée</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="mt-auto block w-full rounded-md border border-neutral-600 bg-transparent px-6 py-3 text-center font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
            >
              Commencer l&apos;essai
            </Link>
          </div>

          {/* Plan mensuel principal */}
          <div className="rounded-lg border-2 border-blue-600 bg-white p-8">
            <div className="mb-2 inline-block rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
              Recommandé
            </div>
            <h3 className="mb-2 text-2xl font-semibold">Abonnement mensuel</h3>
            <div className="mb-2">
              <span className="text-4xl font-bold">14,90€</span>
              <span className="text-neutral-400"> / mois</span>
            </div>
            <p className="mb-4 text-sm text-neutral-600">
              Pour un suivi régulier des devoirs tout au long de l&apos;année.
            </p>
            <ul className="mb-8 space-y-3 text-neutral-700">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Aide aux devoirs illimitée pour un enfant</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Historique des questions et continuité pédagogique</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Profil TDAH optimisé</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Annulable à tout moment</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="mt-auto block w-full rounded-md bg-blue-600 px-6 py-3 text-center font-medium text-white hover:bg-blue-700 transition-colors"
            >
              S&apos;abonner après l&apos;essai
            </Link>
          </div>

          {/* Plan long terme / à vie (optionnel) */}
          <div className="rounded-lg border border-neutral-200 bg-white p-8 h-full flex flex-col">
            <h3 className="mb-2 text-2xl font-semibold">Formule sérénité</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">80€</span>
              <span className="text-neutral-400 text-sm"> une fois</span>
            </div>
            <p className="mb-4 text-sm text-neutral-600">
              Pour les parents qui veulent un outil stable sur plusieurs années.
            </p>
            <ul className="mb-8 space-y-3 text-neutral-700">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Accès illimité à vie pour un enfant</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="mt-auto block w-full rounded-md border border-neutral-600 bg-transparent px-6 py-3 text-center font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
            >
              Choisir cette formule
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
