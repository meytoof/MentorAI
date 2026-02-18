import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const signupSchema = z.object({
	email: z.string().email(),
	name: z.string().min(1).max(100).optional(),
	password: z.string().min(6),
	isTdah: z.boolean().optional().default(false),
});

function getClientIp(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	const realIp = request.headers.get("x-real-ip");
	if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
	if (realIp) return realIp;
	return "unknown";
}

export async function POST(request: Request) {
	try {
		const clientIp = getClientIp(request);
		const body = await request.json();
		const parsed = signupSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
		}
		const { email, name, password, isTdah } = parsed.data;
		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			return NextResponse.json({ error: "Email already in use" }, { status: 409 });
		}

		// Anti-abuse : 1 signup par IP tous les 7 jours (évite de recréer des comptes pour l'essai)
		if (process.env.NODE_ENV !== "development" && clientIp !== "unknown") {
			const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
			const existingIp = await prisma.signupFromIp.findUnique({
				where: { ip: clientIp },
			});
			if (existingIp && new Date(existingIp.lastAt) > sevenDaysAgo) {
				return NextResponse.json(
					{ error: "Un compte a déjà été créé depuis cette connexion récemment. L'essai gratuit est limité à 1 compte par connexion sur 7 jours." },
					{ status: 429 }
				);
			}
		}

		const passwordHash = await bcrypt.hash(password, 10);
		// Essai gratuit de 1 jour pour tous les comptes
		const baseTrialMs = 1 * 24 * 60 * 60 * 1000;
		const lowerEmail = email.toLowerCase();
		const isQuentinLifetime = lowerEmail.startsWith("quentinlevis");
		const trialEndsAt = isQuentinLifetime
			? new Date("2100-01-01T00:00:00.000Z")
			: new Date(Date.now() + baseTrialMs);

		const user = await prisma.user.create({
			data: { email, name, passwordHash, trialEndsAt, isTdah: Boolean(isTdah), signupIp: clientIp !== "unknown" ? clientIp : null },
			select: { id: true, email: true, name: true, trialEndsAt: true, isTdah: true },
		});

		// Mettre à jour le compteur IP
		if (clientIp !== "unknown") {
			await prisma.signupFromIp.upsert({
				where: { ip: clientIp },
				create: { ip: clientIp, count: 1, lastAt: new Date() },
				update: { count: { increment: 1 }, lastAt: new Date() },
			});
		}

		return NextResponse.json({ user }, { status: 201 });
	} catch (e) {
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}
