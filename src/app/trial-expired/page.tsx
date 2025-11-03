export default function TrialExpiredPage() {
	return (
		<div className="mx-auto max-w-lg px-4 py-12 text-center">
			<h1 className="mb-4 text-2xl font-semibold">Essai gratuit expiré</h1>
			<p className="mb-6 text-gray-400">Votre période d'essai de 1 semaine est terminée.</p>
			<a className="rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800" href="/signup">Créer un nouveau compte</a>
		</div>
	);
}
