import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  mascot: z.enum(["owl", "fox", "turtle", "frog", "lion", "elephant", "dolphin", "panda"]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid mascot" }, { status: 400 });

  await prisma.user.update({
    where: { id: userId },
    data: { childMascot: parsed.data.mascot },
  });

  return NextResponse.json({ ok: true });
}
