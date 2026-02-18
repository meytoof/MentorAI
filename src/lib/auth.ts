import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";

const credentialsSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
		Credentials({
			name: "credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			authorize: async (raw) => {
				const parsed = credentialsSchema.safeParse(raw);
				if (!parsed.success) return null;
				const { email, password } = parsed.data;
				const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, isTdah: true, passwordHash: true, onboardingDone: true, isAdmin: true, childMascot: true, xp: true, streak: true } });
				if (!user || !user.passwordHash) return null;
				const ok = await bcrypt.compare(password, user.passwordHash);
				if (!ok) return null;
				const { passwordHash: _, ...safeUser } = user;
				return safeUser;
			},
		}),
	],
	pages: {
		signIn: "/accueil",
	},
	session: { strategy: "jwt" },
	callbacks: {
		signIn: async ({ user, account }) => {
			if (account?.provider === "google" && user.email) {
				const existing = await prisma.user.findUnique({ where: { email: user.email } });
				if (!existing) {
					const lowerEmail = user.email.toLowerCase();
					const isDevBypass = lowerEmail.startsWith("quentinlevis");
					const trialEndsAt = isDevBypass
						? new Date("2100-01-01T00:00:00.000Z")
						: new Date(Date.now() + 24 * 60 * 60 * 1000);
					await prisma.user.create({
						data: {
							email: user.email,
							name: user.name || null,
							trialEndsAt,
							isLifetime: isDevBypass,
						},
					});
				}
				return true;
			}
			return true;
		},
		jwt: async ({ token, user, account }) => {
			if (user) {
				if (account?.provider === "google") {
					const dbUser = await prisma.user.findUnique({
						where: { email: user.email! },
						select: { id: true, name: true, email: true, isTdah: true, onboardingDone: true, isAdmin: true, childMascot: true, xp: true, streak: true },
					});
					if (dbUser) {
						token.userId = dbUser.id;
						token.name = dbUser.name;
						token.email = dbUser.email;
						token.isTdah = dbUser.isTdah;
						token.onboardingDone = dbUser.onboardingDone;
						token.isAdmin = dbUser.isAdmin;
						token.childMascot = dbUser.childMascot ?? null;
						token.xp = dbUser.xp;
						token.streak = dbUser.streak;
					}
				} else if (user.id) {
					token.userId = (user as { id: string }).id;
					token.name = (user as { name?: string }).name;
					token.email = (user as { email?: string }).email;
					token.isTdah = (user as { isTdah?: boolean }).isTdah ?? false;
					token.onboardingDone = (user as { onboardingDone?: boolean }).onboardingDone ?? false;
					token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
					token.childMascot = (user as { childMascot?: string | null }).childMascot ?? null;
					token.xp = (user as { xp?: number }).xp ?? 0;
					token.streak = (user as { streak?: number }).streak ?? 0;
				}
			}
			if (token.userId) {
				const dbUser = await prisma.user.findUnique({
					where: { id: token.userId as string },
					select: { trialEndsAt: true, stripeCurrentPeriodEnd: true, isLifetime: true, onboardingDone: true, isAdmin: true, isTdah: true, childMascot: true, xp: true, streak: true },
				});
				if (dbUser) {
					const hasAccess =
						dbUser.isLifetime ||
						(dbUser.stripeCurrentPeriodEnd && dbUser.stripeCurrentPeriodEnd > new Date()) ||
						dbUser.trialEndsAt > new Date();
					token.hasActiveAccess = !!hasAccess;
					token.onboardingDone = dbUser.onboardingDone;
					token.isAdmin = dbUser.isAdmin;
					token.isTdah = dbUser.isTdah;
					token.childMascot = dbUser.childMascot ?? null;
					token.xp = dbUser.xp;
					token.streak = dbUser.streak;
				}
			}
			return token;
		},
		session: async ({ session, token }) => {
			if (token?.userId && session.user) {
				(session.user as { id?: string }).id = token.userId as string;
				(session.user as { name?: string | null }).name = (token.name as string) ?? null;
				(session.user as { isTdah?: boolean }).isTdah = (token.isTdah as boolean) ?? false;
				(session.user as { hasActiveAccess?: boolean }).hasActiveAccess = (token.hasActiveAccess as boolean) ?? false;
				(session.user as { onboardingDone?: boolean }).onboardingDone = (token.onboardingDone as boolean) ?? false;
				(session.user as { isAdmin?: boolean }).isAdmin = (token.isAdmin as boolean) ?? false;
				(session.user as { childMascot?: string | null }).childMascot = (token.childMascot as string | null) ?? null;
				(session.user as { xp?: number }).xp = (token.xp as number) ?? 0;
				(session.user as { streak?: number }).streak = (token.streak as number) ?? 0;
			}
			return session;
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
};

export const { auth } = NextAuth(authOptions);
