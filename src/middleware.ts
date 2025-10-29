import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard"]; // prot e9ger le tableau et pages futures

export async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
	if (!needsAuth) return NextResponse.next();

	const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
	if (!token?.userId) {
		const url = new URL("/signin", req.url);
		url.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(url);
	}

	// v e9rif trial
	const user = await prisma.user.findUnique({ where: { id: String(token.userId) }, select: { trialEndsAt: true } });
	if (!user || new Date(user.trialEndsAt).getTime() < Date.now()) {
		return NextResponse.redirect(new URL("/trial-expired", req.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*"],
};
