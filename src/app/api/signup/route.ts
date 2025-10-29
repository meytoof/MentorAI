import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";

const signupSchema = z.object({
	email: z.string().email(),
	name: z.string().min(1).max(100).optional(),
	password: z.string().min(6),
});

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const parsed = signupSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
		}
		const { email, name, password } = parsed.data;
		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			return NextResponse.json({ error: "Email already in use" }, { status: 409 });
		}
		const passwordHash = await bcrypt.hash(password, 10);
		const trialEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
		const user = await prisma.user.create({
			data: { email, name, passwordHash, trialEndsAt },
			select: { id: true, email: true, name: true, trialEndsAt: true },
		});
		return NextResponse.json({ user }, { status: 201 });
	} catch (e) {
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}
