import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  childAge: z.number().int().min(6).max(15),
  schoolLevel: z.enum(["CP", "CE1", "CE2", "CM1", "CM2", "6e"]),
  hasRedoublement: z.boolean(),
  mentoriaReason: z.enum(["difficulties", "time", "tdah", "curiosity"]),
  difficultSubjects: z.array(z.string()).min(1).max(6),
  learningObjective: z.enum(["catchup", "maintain", "advance"]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }

  const { childAge, schoolLevel, hasRedoublement, mentoriaReason, difficultSubjects, learningObjective } = parsed.data;

  await prisma.user.update({
    where: { id: userId },
    data: {
      childAge,
      schoolLevel,
      hasRedoublement,
      mentoriaReason,
      difficultSubjects: JSON.stringify(difficultSubjects),
      learningObjective,
      onboardingDone: true,
    },
  });

  return NextResponse.json({ ok: true });
}
