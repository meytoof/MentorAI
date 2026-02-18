import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const credentialsSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
	providers: [
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
				const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, isTdah: true, passwordHash: true, onboardingDone: true, isAdmin: true } });
				if (!user) return null;
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
		jwt: async ({ token, user }) => {
			if (user?.id) {
				token.userId = (user as { id: string }).id;
				token.name = (user as { name?: string }).name;
				token.email = (user as { email?: string }).email;
				token.isTdah = (user as { isTdah?: boolean }).isTdah ?? false;
				token.onboardingDone = (user as { onboardingDone?: boolean }).onboardingDone ?? false;
				token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
			}
			// Vérifie l'accès actif à chaque refresh du token
			if (token.userId) {
				const dbUser = await prisma.user.findUnique({
					where: { id: token.userId as string },
					select: { trialEndsAt: true, stripeCurrentPeriodEnd: true, isLifetime: true, onboardingDone: true, isAdmin: true },
				});
				if (dbUser) {
					const hasAccess =
						dbUser.isLifetime ||
						(dbUser.stripeCurrentPeriodEnd && dbUser.stripeCurrentPeriodEnd > new Date()) ||
						dbUser.trialEndsAt > new Date();
					token.hasActiveAccess = !!hasAccess;
					token.onboardingDone = dbUser.onboardingDone;
					token.isAdmin = dbUser.isAdmin;
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
			}
			return session;
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
};

export const { auth } = NextAuth(authOptions);
