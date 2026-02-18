import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/admin"];

export async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
	if (!needsAuth) return NextResponse.next();

	const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
	if (!token?.userId) {
		const url = new URL("/accueil", req.url);
		url.searchParams.set("login", "1");
		url.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*", "/onboarding", "/admin/:path*"],
};
