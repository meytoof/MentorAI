"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const search = useSearchParams();
	const callbackUrl = search.get("callbackUrl") ?? "/dashboard";

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		const res = await signIn("credentials", { email, password, redirect: false, callbackUrl });
		if (res?.ok) {
			window.location.href = callbackUrl;
		} else {
			setError("Identifiants invalides");
		}
	}

	return (
		<div className="mx-auto max-w-md px-4 py-10">
			<h1 className="mb-6 text-2xl font-semibold">Connexion</h1>
			<form onSubmit={onSubmit} className="space-y-4">
				<input className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
				<input className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2" placeholder="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
				{error && <p className="text-sm text-red-400">{error}</p>}
				<button type="submit" className="w-full rounded-md bg-neutral-900 px-3 py-2 text-white hover:bg-neutral-800">Se connecter</button>
			</form>
		</div>
	);
}
