import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ points: z.number().int().positive() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid points" }, { status: 400 });

  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, streak: true, lastSessionAt: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Recalcul streak : consécutivité par jour
  let newStreak = user.streak;
  if (user.lastSessionAt) {
    const lastDate = new Date(user.lastSessionAt);
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      // Même jour, streak inchangé
    } else if (diffDays === 1) {
      // Jour suivant : streak +1
      newStreak += 1;
    } else {
      // Rupture de streak
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: { increment: parsed.data.points },
      streak: newStreak,
      lastSessionAt: now,
    },
    select: { xp: true, streak: true },
  });

  return NextResponse.json({ xp: updated.xp, streak: updated.streak });
}
