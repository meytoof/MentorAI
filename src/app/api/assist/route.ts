import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { question } = await request.json();
		if (!question || typeof question !== "string") {
			return NextResponse.json({ error: "Invalid question" }, { status: 400 });
		}
		// Placeholder simple: transformer la question en indice de type socratique
		// Ici on n'appelle pas encore un LLM; on masque la réponse finale intentionnellement.
		const hint = `Réfléchis par étapes: 1) Reformule le problème. 2) Identifie les données utiles. 3) Fais un schéma simple sur le tableau. 4) Essaie une première piste sans calcul final.`;
		return NextResponse.json({ hint });
	} catch (e) {
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}


