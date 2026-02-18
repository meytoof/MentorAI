import { prisma } from "@/lib/prisma";
import ConversationCard from "./ConversationCard";

export default async function AdminConversationsPage() {
  const conversations = await prisma.conversation.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true, schoolLevel: true },
      },
    },
  });

  const serialized = conversations.map((c) => ({
    id: c.id,
    question: c.question,
    hint: c.hint,
    drawing: c.drawing ?? null,
    encouragement: c.encouragement ?? null,
    createdAt: c.createdAt.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    user: c.user,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">
        Conversations récentes <span className="text-sm font-normal text-white/40">(50 dernières)</span>
      </h1>

      <div className="flex flex-col gap-3">
        {serialized.map((c) => (
          <ConversationCard key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}
