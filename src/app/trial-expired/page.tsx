export default function TrialExpiredPage() {
	return (
		<div className="min-h-screen bg-[#0f1624] pt-20">
		<div className="mx-auto max-w-lg px-4 py-12 text-center">
			<h1 className="mb-4 text-2xl font-semibold text-white">Essai gratuit expiré</h1>
			<p className="mb-6 text-white/60">Votre période d&apos;essai de 1 jour est terminée.</p>
			<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
				<a className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500" href="/accueil#tarifs">S&apos;abonner pour continuer</a>
				<a className="rounded-md border border-white/20 px-4 py-2 text-white/80 hover:bg-white/10" href="/dashboard/compte">Mon compte</a>
			</div>
			<p className="mt-6 text-xs text-white/50">
				Un compte a déjà été créé depuis votre connexion ? L&apos;accès à l&apos;essai gratuit est limité à 1 journée par connexion.
			</p>
		</div>
		</div>
	);
}
