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
				const user = await prisma.user.findUnique({ where: { email } });
				if (!user) return null;
				const ok = await bcrypt.compare(password, user.passwordHash);
				if (!ok) return null;
				return { id: user.id, email: user.email, name: user.name } as any;
			},
		}),
	],
	pages: {
		signIn: "/signin",
	},
	session: { strategy: "jwt" },
	callbacks: {
		jwt: async ({ token, user }) => {
			if (user?.id) token.userId = (user as any).id;
			return token;
		},
		session: async ({ session, token }) => {
			if (token?.userId && session.user) {
				(session.user as any).id = token.userId;
			}
			return session;
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
};

export const { auth } = NextAuth(authOptions);
