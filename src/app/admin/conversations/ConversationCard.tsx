"use client";

import { useState } from "react";

interface ConversationCardProps {
  c: {
    id: string;
    question: string;
    hint: string;
    drawing: string | null;
    encouragement: string | null;
    createdAt: string; // serialized date
    user: {
      name: string | null;
      email: string;
      schoolLevel: string | null;
    };
  };
}

export default function ConversationCard({ c }: ConversationCardProps) {
  const [expanded, setExpanded] = useState(false);

  let drawingParsed: Record<string, unknown> | null = null;
  if (c.drawing) {
    try {
      drawingParsed = JSON.parse(c.drawing) as Record<string, unknown>;
    } catch {
      // invalid JSON
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 transition-colors hover:border-white/20">
      {/* Header — always visible, click to toggle */}
      <button
        className="w-full text-left p-5"
        onClick={() => setExpanded((v) => !v)}
      >
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
          <div className="flex shrink-0 items-center gap-3">
            <time className="text-xs text-white/30">{c.createdAt}</time>
            <span className="text-white/30 transition-transform" style={{ display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
              ▾
            </span>
          </div>
        </div>

        <p className="text-sm font-medium text-white">{c.question}</p>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4 flex flex-col gap-4">
          {/* Hint */}
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">Indice IA</div>
            <p className="text-sm leading-relaxed text-white/70">{c.hint}</p>
          </div>

          {/* Encouragement */}
          {c.encouragement && (
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">Encouragement</div>
              <p className="text-sm italic text-white/50">{c.encouragement}</p>
            </div>
          )}

          {/* Drawing */}
          {drawingParsed && (
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">Données de dessin</div>
              <pre className="overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-white/40">
                {JSON.stringify(drawingParsed, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
