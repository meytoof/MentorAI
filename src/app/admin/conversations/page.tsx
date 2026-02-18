import { prisma } from "@/lib/prisma";

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

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">
        Conversations récentes <span className="text-sm font-normal text-white/40">(50 dernières)</span>
      </h1>

      <div className="flex flex-col gap-4">
        {conversations.map((c) => (
          <div key={c.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-white">{c.user.name ?? "Anonyme"}</span>
                <span className="text-white/40">{c.user.email}</span>
                {c.user.schoolLevel && (
                  <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-xs font-semibold text-blue-300">
                    {c.user.schoolLevel}
                  </span>
                )}
              </div>
              <time className="shrink-0 text-xs text-white/30">
                {c.createdAt.toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>

            <p className="mb-2 text-sm text-white">{c.question}</p>

            {c.hint && (
              <p className="mb-1 line-clamp-3 text-xs text-white/50">{c.hint}</p>
            )}

            {c.encouragement && (
              <p className="text-xs italic text-white/30">{c.encouragement}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
