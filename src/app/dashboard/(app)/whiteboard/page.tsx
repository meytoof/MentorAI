"use client";

import { AIDrawingResponse } from "@/types/drawing";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "@/components/dashboard/ThemePicker";
import MascotPicker, { MASCOTTES, type MascotId } from "@/components/dashboard/MascotPicker";
import CustomizationDrawer from "@/components/dashboard/CustomizationDrawer";

interface Segment {
  id: string;
  text: string;
  role?: string;
  shortTip: string;
  lesson: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  keyPoints?: string[];
  segments?: Segment[];
  timestamp: Date;
  hasImage?: boolean;
  imagePreview?: string | null;
  evaluation?: "correct" | "incorrect" | "partial" | null;
}

interface TooltipState {
  segment: Segment;
  x: number;
  y: number;
}

export default function WhiteboardPage() {
  const { data: session } = useSession();
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [hoveredMsgIdx, setHoveredMsgIdx] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Challenge / Défi mode
  const [challengeActive, setChallengeActive] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<"correct" | "incorrect" | "partial" | null>(null);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [successCombo, setSuccessCombo] = useState(0);

  // Gamification
  const [mascot, setMascot] = useState<MascotId | null>(null);
  const [showMascotPicker, setShowMascotPicker] = useState(false);
  const [mascotPhrase, setMascotPhrase] = useState("");
  const mascotPhraseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { theme } = useTheme();

  const childName = (session?.user as { name?: string } | undefined)?.name ?? "toi";
  const isTdah = (session?.user as { isTdah?: boolean } | undefined)?.isTdah ?? false;
  const sessionMascot = (session?.user as { childMascot?: string | null } | undefined)?.childMascot as MascotId | null;

  // Init mascot from session
  useEffect(() => {
    if (sessionMascot) {
      setMascot(sessionMascot);
    }
  }, [sessionMascot]);

  // Show mascot picker 2s after load if no mascot
  useEffect(() => {
    if (!isTdah && sessionMascot === null && session?.user) {
      const t = setTimeout(() => setShowMascotPicker(true), 2000);
      return () => clearTimeout(t);
    }
  }, [isTdah, sessionMascot, session?.user]);

  // Rotate mascot phrase every 5 minutes
  useEffect(() => {
    if (!mascot) return;
    const mascotData = MASCOTTES.find((m) => m.id === mascot);
    if (!mascotData) return;
    const pick = () => {
      const phrases = mascotData.phrases;
      setMascotPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
    };
    pick();
    mascotPhraseTimerRef.current = setInterval(pick, 5 * 60 * 1000);
    return () => clearInterval(mascotPhraseTimerRef.current!);
  }, [mascot]);

  // Award XP fire-and-forget
  const awardXP = useCallback((points: number) => {
    fetch("/api/user/xp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isTdah) {
      setShowWelcome(false);
      return;
    }
    const t = setTimeout(() => setWelcomeDone(true), 2800);
    return () => clearTimeout(t);
  }, [isTdah]);

  useEffect(() => {
    if (isTdah) return;
    if (welcomeDone) {
      const t = setTimeout(() => setShowWelcome(false), 400);
      return () => clearTimeout(t);
    }
  }, [welcomeDone, isTdah]);

  useEffect(() => {
    if (isLoading) setAiSpeaking(true);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && messages.some((m) => m.role === "assistant")) {
      setAiSpeaking(true);
      const t = setTimeout(() => setAiSpeaking(false), 4000);
      return () => clearTimeout(t);
    }
  }, [isLoading, messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  function formatMessage(content: string, segments?: Segment[]) {
    if (!content) return "";
    let processedContent = content;
    let keyCounter = 0;
    const htmlEntities: { [key: string]: string } = {
      "&#39;": "'", "&apos;": "'", "&quot;": '"', "&amp;": "&", "&lt;": "<", "&gt;": ">", "&nbsp;": " ",
    };
    Object.entries(htmlEntities).forEach(([entity, char]) => {
      processedContent = processedContent.replace(new RegExp(entity, "g"), char);
    });
    processedContent = processedContent.replace(/<br\s*\/?>/gi, "\n");
    const parts: (string | React.ReactElement)[] = [];
    processedContent = processedContent.replace(/<(strong|b)>(.*?)<\/\1>/gi, (_, tag, text) => {
      parts.push(<strong key={`strong-${keyCounter++}`} className="font-bold">{text}</strong>);
      return `__STRONG_${keyCounter - 1}__`;
    });
    processedContent = processedContent.replace(/<(em|i)>(.*?)<\/\1>/gi, (_, tag, text) => {
      parts.push(<em key={`em-${keyCounter++}`} className="italic">{text}</em>);
      return `__EM_${keyCounter - 1}__`;
    });
    const examplePlaceholders: string[] = [];
    let exIdx = 0;
    processedContent = processedContent.replace(/<example>(.*?)<\/example>/gi, (_, text) => {
      examplePlaceholders.push((text || "").trim());
      return `__EX${exIdx++}__`;
    });
    const renderWithExamples = (str: string) => {
      const out: (string | React.ReactElement)[] = [];
      const parts = str.split(/(__EX\d+__)/g);
      parts.forEach((p) => {
        const m = p.match(/^__EX(\d+)__$/);
        if (m) {
          const ex = examplePlaceholders[parseInt(m[1], 10)];
          if (ex != null) out.push(<span key={`ex-${keyCounter++}`} className="font-semibold text-blue-600">{ex}</span>);
        } else if (p) {
          const lines = p.split("\n");
          lines.forEach((line, i) => {
            if (i > 0) out.push(<br key={`nlex-${keyCounter++}`} />);
            if (line) out.push(line);
          });
        }
      });
      return out;
    };
    const redRegex = /<red>(.*?)<\/red>/g;
    let match;
    let lastIndex = 0;
    const redParts: (string | React.ReactElement)[] = [];
    while ((match = redRegex.exec(processedContent)) !== null) {
      if (match.index > lastIndex) {
        const beforeText = processedContent.substring(lastIndex, match.index);
        const beforeParts = beforeText.split(/(__STRONG_\d+__|__EM_\d+__)/);
        beforeParts.forEach((part) => {
          if (part.startsWith("__STRONG_")) {
            const id = parseInt(part.replace("__STRONG_", "").replace("__", ""));
            redParts.push(parts.find((p, i) => i === id && typeof p !== "string") || part);
          } else if (part.startsWith("__EM_")) {
            const id = parseInt(part.replace("__EM_", "").replace("__", ""));
            redParts.push(parts.find((p, i) => i === id && typeof p !== "string") || part);
          } else if (part) redParts.push(...renderWithExamples(part));
        });
      }
      const mot = match[1].trim();
      const normalize = (str: string) =>
        str.trim().toLowerCase()
          .replace(/^(l'|la |le |les |un |une |des |du |de la |de l')/i, "")
          .replace(/[éèêë]/g, "e").replace(/[àâä]/g, "a").replace(/[ùûü]/g, "u")
          .replace(/[îï]/g, "i").replace(/[ôö]/g, "o").replace(/ç/g, "c").replace(/[^a-z0-9]/g, "");
      const motN = normalize(mot);
      const segment = segments?.find((s) => {
        const sN = normalize(s.text);
        return sN === motN || motN.startsWith(sN) || sN.startsWith(motN) || motN.includes(sN) || sN.includes(motN);
      });
      const tooltipText = segment?.shortTip || segment?.lesson || "";
      void tooltipText;
      redParts.push(
        <span
          key={`red-${keyCounter++}`}
          className={`relative inline-block font-semibold text-red-400 underline decoration-red-300/80 decoration-dotted underline-offset-2 ${segment ? "cursor-help" : ""}`}
          onMouseEnter={segment ? (e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setTooltip({ segment, x: rect.left + rect.width / 2, y: rect.top });
          } : undefined}
          onMouseLeave={segment ? () => setTooltip(null) : undefined}
        >
          {match[1]}
        </span>
      );
      lastIndex = redRegex.lastIndex;
    }
    if (lastIndex < processedContent.length) {
      const afterText = processedContent.substring(lastIndex);
      const afterParts = afterText.split(/(__STRONG_\d+__|__EM_\d+__)/);
      afterParts.forEach((part) => {
        if (part.startsWith("__STRONG_")) {
          const id = parseInt(part.replace("__STRONG_", "").replace("__", ""));
          redParts.push(parts.find((p, i) => i === id && typeof p !== "string") || part);
        } else if (part.startsWith("__EM_")) {
          const id = parseInt(part.replace("__EM_", "").replace("__", ""));
          redParts.push(parts.find((p, i) => i === id && typeof p !== "string") || part);
        } else if (part) redParts.push(...renderWithExamples(part));
      });
    }
    if (redParts.length > 0) return <>{redParts}</>;
    const finalParts = processedContent.split(/(__STRONG_\d+__|__EM_\d+__)/);
    const result: (string | React.ReactElement)[] = [];
    finalParts.forEach((part) => {
      if (part.startsWith("__STRONG_")) {
        const id = parseInt(part.replace("__STRONG_", "").replace("__", ""));
        const strongElement = parts.find((p, i) => i === id && typeof p !== "string");
        if (strongElement) result.push(strongElement);
      } else if (part.startsWith("__EM_")) {
        const id = parseInt(part.replace("__EM_", "").replace("__", ""));
        const emElement = parts.find((p, i) => i === id && typeof p !== "string");
        if (emElement) result.push(emElement);
      } else if (part) {
        const lines = part.split("\n");
        lines.forEach((line, lineIdx) => {
          if (lineIdx > 0) result.push(<br key={`br-${keyCounter++}`} />);
          result.push(line);
        });
      }
    });
    return <>{result.length > 0 ? result : <>{content}</>}</>;
  }

  const [opacities, setOpacities] = useState<Record<number, number>>({});
  useEffect(() => {
    if (isTdah) return;
    const interval = setInterval(() => {
      setOpacities(() => {
        const next: Record<number, number> = {};
        messages.forEach((msg, idx) => {
          if (msg.role === "assistant" && hoveredMsgIdx !== idx) {
            const age = (Date.now() - msg.timestamp.getTime()) / 1000;
            next[idx] = age >= 15 ? 0.8 : 1;
          } else next[idx] = 1;
        });
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [messages, hoveredMsgIdx, isTdah]);

  const assistantMessageCount = messages.filter((m) => m.role === "assistant").length;

  async function askAI() {
    if (!question.trim() && !imageFile) return;
    const userQuestion = question.trim() || "Analyse cette photo de devoir, identifie chaque exercice et propose comment le faire étape par étape sans donner les réponses.";
    setQuestion("");
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);
      let imageDataUrl: string | null = null;
      if (imageFile) {
        try { imageDataUrl = await readFileAsDataURL(imageFile); } catch (err) { console.error("Erreur de lecture de l'image:", err); }
      }
      const prevMessages = messages.filter(m => m.role === "user" || (m.role === "assistant" && !m.content.startsWith("✨")));
      const history = prevMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      setMessages((prev) => [...prev, { role: "user", content: userQuestion, timestamp: new Date(), hasImage: !!imageDataUrl, imagePreview }]);
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userQuestion, canvasImage: null, image: imageDataUrl, history }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data: AIDrawingResponse = await res.json();
        let bubbles = data.messageBubbles?.filter((b) => typeof b === "string" && b.trim()) ?? [];
        if (bubbles.length === 0) {
          const msg = (data.messageEnfant ?? data.hint ?? "").trim();
          const stepMatches = msg.match(/(?:Étape\s*\d+\s*[:.]?\s*[^É]*)/gi);
          if (stepMatches?.length) bubbles = stepMatches.map((s) => s.trim()).filter(Boolean);
          else if (msg) bubbles = [msg];
        }

        const evaluation = data.evaluation ?? null;
        setLastEvaluation(evaluation);

        if (evaluation === "correct") {
          setSuccessCombo(prev => prev + 1);
          setShowSuccessFlash(true);
          setTimeout(() => setShowSuccessFlash(false), 1800);
          awardXP(25 + successCombo * 5);
        } else if (evaluation === "incorrect") {
          setSuccessCombo(0);
        }

        const newAssistantMessages: ChatMessage[] = bubbles.map((bulle, i) => ({
          role: "assistant" as const,
          content: bulle.trim(),
          segments: data.segments,
          timestamp: new Date(),
          evaluation: i === 0 ? evaluation : null,
        }));
        setMessages((prev) => [...prev, ...newAssistantMessages]);

        const lastBubble = bubbles[bubbles.length - 1] ?? "";
        const endsWithQuestion = /\?\s*["»]?\s*$/.test(lastBubble);
        setChallengeActive(endsWithQuestion);

        if (data.encouragement) {
          setMessages((prev) => [...prev, { role: "assistant", content: `✨ ${data.encouragement}`, timestamp: new Date() }]);
        }
        awardXP(10);
      } else {
        await res.json().catch(() => ({}));
        setMessages((prev) => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue. Réessaie !", timestamp: new Date() }]);
      }
    } catch (error: unknown) {
      console.error("Erreur:", error);
      if (error instanceof Error && error.name === "AbortError") {
        setMessages((prev) => [...prev, { role: "assistant", content: "L'IA met trop de temps à répondre. Réessaie avec une question plus simple.", timestamp: new Date() }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue. Réessaie !", timestamp: new Date() }]);
      }
    } finally {
      setIsLoading(false);
      setImageFile(null);
      setImagePreview(null);
    }
  }

  const mascotData = mascot ? MASCOTTES.find((m) => m.id === mascot) : null;

  // Theme background: gradients for standard, solid colors for TDAH
  const themeGradient =
    theme === "space" ? "linear-gradient(135deg, #0a0118 0%, #1a0a3e 40%, #0d0820 100%)" :
    theme === "ocean" ? "linear-gradient(135deg, #0c1f3f 0%, #0e4060 40%, #0a1a30 100%)" :
    theme === "forest" ? "linear-gradient(135deg, #0a1f0a 0%, #0f3320 40%, #082010 100%)" :
    "linear-gradient(135deg, #0f1624 0%, #1a2744 20%, #1e3a5f 40%, #162d4a 60%, #0f1a2e 80%, #0f1624 100%)";

  const tdahBg =
    theme === "space" ? "#0d0820" :
    theme === "ocean" ? "#0c1a30" :
    theme === "forest" ? "#0a170a" :
    "#0d1117";

  return (
    <div
      className="isolate relative flex h-full min-h-0 flex-col overflow-hidden"
      style={isTdah ? { backgroundColor: tdahBg } : undefined}
      data-theme={theme}
    >
      {/* Mascot Picker Modal */}
      {showMascotPicker && (
        <MascotPicker
          currentMascot={mascot}
          onSelect={(m) => setMascot(m)}
          onClose={() => setShowMascotPicker(false)}
        />
      )}

      {/* Success flash overlay */}
      {showSuccessFlash && (
        <div className="pointer-events-none fixed inset-0 z-[9998] animate-[success-flash_1.8s_ease-out_forwards]">
          <div className="absolute inset-0 bg-emerald-900/40" />
          <div className="flex h-full items-center justify-center">
            <div className="animate-[success-pop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards] flex flex-col items-center gap-4">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-500/30 ring-[5px] ring-emerald-400/60 shadow-[0_0_60px_rgba(16,185,129,0.4)]">
                <svg className="h-16 w-16 text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" className="animate-[check-draw_0.4s_ease-out_0.2s_both]" style={{ strokeDasharray: 30, strokeDashoffset: 30 }} />
                </svg>
              </div>
              <p className="text-3xl font-extrabold text-emerald-200 drop-shadow-[0_2px_12px_rgba(16,185,129,0.6)]">
                {successCombo > 1 ? `${successCombo}× Combo ! 🔥` : "Bravo ! 🎉"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip global fixed */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[9999] whitespace-normal rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-normal leading-relaxed text-white shadow-2xl ring-1 ring-white/15 transition-opacity duration-150"
          style={{
            maxWidth: "300px",
            minWidth: "200px",
            left: Math.min(tooltip.x, window.innerWidth - 320),
            top: Math.max(8, tooltip.y - 10),
            transform: "translate(-50%, -100%)",
          }}
        >
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-amber-400">💡 Le saviez-tu ?</span>
          <span className="block text-white/95">{tooltip.segment.shortTip}</span>
          {tooltip.segment.lesson && tooltip.segment.lesson !== tooltip.segment.shortTip && (
            <span className="mt-2 block border-t border-white/15 pt-2 text-xs italic text-white/70">{tooltip.segment.lesson}</span>
          )}
        </div>
      )}

      {/* Background gradient */}
      {!isTdah && (
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: themeGradient,
            backgroundSize: theme === "classic" ? "200% 200%" : "100% 100%",
            animation: theme === "classic" ? "gradient-drift 45s ease-in-out infinite" : "none",
          }}
        />
      )}

      {/* Top area: mascot OR animated bubble */}
      {!isTdah && (
        <div className="flex flex-shrink-0 items-center pt-4 pb-2 px-5 sm:px-10">
          <div className="flex items-center gap-3">
            {mascotData ? (
              <button
                onClick={() => setShowMascotPicker(true)}
                className="group flex items-center gap-2"
                title="Changer de mascotte"
              >
                <span
                  className="text-4xl"
                  style={{ animation: "mascot-float 3s ease-in-out infinite", display: "block" }}
                >
                  {mascotData.emoji}
                </span>
                {mascotPhrase && (
                  <span className="hidden max-w-xs text-xs italic text-white/40 sm:block">&ldquo;{mascotPhrase}&rdquo;</span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowMascotPicker(true)}
                className="h-12 w-12 rounded-full border-2 border-blue-500/60 bg-blue-500/20 transition-all duration-300 hover:border-blue-400 hover:bg-blue-500/30"
                style={{ animation: aiSpeaking ? "voice-pulse-active 1.2s ease-in-out infinite" : "voice-pulse 3s ease-in-out infinite" }}
                title="Choisir une mascotte"
              />
            )}
          </div>
        </div>
      )}

      {/* TDAH top: simple greeting */}
      {isTdah && showWelcome && (
        <div className="flex flex-shrink-0 items-center py-3 px-5">
          <p className="text-lg font-medium text-white/95">Bonjour {childName || "toi"}.</p>
        </div>
      )}

      {showWelcome && !isTdah && (
        <div className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center ${welcomeDone ? "animate-[welcome-out_0.4s_ease-out_forwards]" : "animate-[welcome-in_0.6s_ease-out_forwards]"}`}>
          <div className={`flex flex-col items-center justify-center gap-4 ${welcomeDone ? "opacity-0" : ""}`} style={{ transition: "opacity 0.4s" }}>
            {mascotData ? (
              <span className="text-6xl" style={{ animation: "mascot-float 2s ease-in-out infinite" }}>{mascotData.emoji}</span>
            ) : (
              <div className={`h-20 w-20 rounded-full border-2 border-blue-500/60 bg-blue-500/20 ${welcomeDone ? "" : "animate-[voice-pulse_0.8s_ease-in-out_infinite]"}`} />
            )}
            <p className="text-xl font-medium text-white/95">Bonjour {childName || "toi"} ! 👋</p>
            <p className="text-sm text-white/60">Je suis là pour t&apos;aider.</p>
          </div>
        </div>
      )}

      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-10">
        <div className="mx-auto flex max-w-3xl flex-col">
          <div className="space-y-4">
            {messages.length === 0 && !showWelcome && (
              <div className={`mt-8 px-6 py-8 text-center text-base ${isTdah ? "rounded-lg border border-neutral-700 bg-neutral-800/50 text-neutral-300" : "rounded-2xl border border-white/10 bg-white/5 text-white/70"}`}>
                <p className={isTdah ? "font-medium text-white" : "font-medium text-white/90"}>Prends une photo ou poses une question.</p>
                <p className={`mt-2 ${isTdah ? "text-sm text-neutral-400" : "text-sm text-white/50"}`}>Par exemple : &quot;Explique-moi l&apos;associativité&quot; ou &quot;Aide-moi sur ce devoir&quot;.</p>
              </div>
            )}
            {messages.map((msg, idx) => {
              const evalBubbleClass = msg.evaluation === "correct"
                ? "border-emerald-400/60 bg-emerald-950/80 text-white/95"
                : msg.evaluation === "incorrect"
                  ? "border-orange-400/50 bg-orange-950/70 text-white/95"
                  : msg.evaluation === "partial"
                    ? "border-amber-400/50 bg-amber-950/70 text-white/95"
                    : "";
              return (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} ${msg.evaluation === "correct" && !isTdah ? "animate-[success-bubble_0.5s_ease-out]" : !isTdah ? "animate-[bubble-in_0.35s_ease-out]" : ""}`} onMouseEnter={() => setHoveredMsgIdx(idx)} onMouseLeave={() => setHoveredMsgIdx(null)}>
                <div className={`max-w-[92%] rounded-2xl px-5 py-4 text-base leading-relaxed ${isTdah ? "rounded-lg" : "transition-opacity duration-300"} ${msg.role === "user" ? "bg-blue-600/90 text-white" : evalBubbleClass || (isTdah ? "bg-neutral-800/90 text-white border border-neutral-700" : "bg-white/10 text-white/95 backdrop-blur-sm border border-white/10")}`} style={{ opacity: msg.role === "user" ? 1 : (isTdah ? 1 : (opacities[idx] ?? 1)) }}>
                  {msg.evaluation && (
                    <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                      msg.evaluation === "correct"
                        ? "bg-emerald-500/25 text-emerald-200"
                        : msg.evaluation === "incorrect"
                          ? "bg-orange-500/25 text-orange-200"
                          : "bg-amber-500/25 text-amber-200"
                    }`}>
                      <span>{msg.evaluation === "correct" ? "✅" : msg.evaluation === "incorrect" ? "💪" : "🔶"}</span>
                      <span>{msg.evaluation === "correct" ? "Bonne réponse !" : msg.evaluation === "incorrect" ? "Pas tout à fait..." : "Tu y es presque !"}</span>
                    </div>
                  )}
                  {msg.hasImage && msg.imagePreview && (
                    <div className="mb-3 flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-lg border border-white/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={msg.imagePreview} alt="Devoir" className="h-full w-full object-cover" />
                      </div>
                      <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/80">Image</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-[17px] [&_.text-red-600]:text-red-400 [&_.text-blue-600]:text-blue-300">{formatMessage(msg.content, msg.segments)}</div>
                </div>
              </div>
              );
            })}
            {isLoading && (
              <div className={`flex justify-start ${!isTdah ? "animate-[bubble-in_0.3s_ease-out]" : ""}`}>
                <div className={`flex items-center gap-3 px-5 py-3 text-base ${isTdah ? "rounded-lg border border-neutral-700 bg-neutral-800/50 text-neutral-400" : "rounded-2xl border border-white/10 bg-white/5 text-white/70"}`}>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-blue-500" />
                  <span>Je réfléchis...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      </main>

      <footer className={`flex-shrink-0 border-t px-5 py-4 sm:px-10 ${isTdah ? "border-neutral-700 bg-neutral-900/80" : "border-white/10 bg-black/20 backdrop-blur-sm"}`}>
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => (document.getElementById("homework-image-input") as HTMLInputElement | null)?.click()} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-50 ${isTdah ? "rounded-md border border-neutral-600 bg-neutral-800 text-neutral-200 hover:bg-neutral-700" : "rounded-full border border-white/20 bg-white/5 text-white/80 hover:bg-white/10"}`} disabled={isLoading}>📷 Photo</button>
            {imagePreview && (
              <div className={`flex items-center gap-3 px-3 py-2 ${isTdah ? "rounded-md border border-blue-600/50 bg-blue-500/10" : "rounded-full border border-blue-500/40 bg-blue-500/10"}`}>
                <div className="h-8 w-8 overflow-hidden rounded-full border border-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                </div>
                <span className="text-sm font-medium text-blue-300">Prêt</span>
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="text-sm text-blue-400 underline">Retirer</button>
              </div>
            )}
          </div>
          {challengeActive && (
            <div className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold ${isTdah ? "bg-amber-900/60 text-amber-100 border border-amber-600/40" : "bg-amber-900/50 text-amber-100 border border-amber-500/40"}`}>
              <span className="text-base">🎯</span>
              <span>Défi en cours — à toi de répondre !</span>
              {successCombo > 1 && (
                <span className="ml-auto rounded-full bg-emerald-600/30 px-2.5 py-0.5 text-xs font-bold text-emerald-200 ring-1 ring-emerald-500/40">
                  {successCombo}× combo 🔥
                </span>
              )}
            </div>
          )}
          <div className="flex gap-3">
            <input className={`flex-1 px-5 py-3 text-base text-white focus:outline-none disabled:opacity-50 ${challengeActive ? "placeholder-amber-200/60 focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/50" : "placeholder-white/50 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40"} ${isTdah ? "rounded-md border border-neutral-600 bg-neutral-800" : `rounded-full border bg-white/5 ${challengeActive ? "border-amber-400/40" : "border-white/20"}`}`} placeholder={challengeActive ? "Écris ta réponse au défi..." : "Pose une question ou envoie une photo..."} value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && askAI()} disabled={isLoading} />
            <button onClick={askAI} disabled={isLoading || (!question.trim() && !imageFile)} className={`inline-flex h-12 w-12 flex-shrink-0 items-center justify-center font-bold text-lg disabled:opacity-50 ${challengeActive ? "bg-amber-500 text-amber-950 hover:bg-amber-400" : "bg-blue-600 text-white hover:bg-blue-500"} ${isTdah ? "rounded-md" : "rounded-full"}`}>→</button>
          </div>
          <input id="homework-image-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (!file) { setImageFile(null); setImagePreview(null); return; } setImageFile(file); setImagePreview(URL.createObjectURL(file)); }} />
        </div>
      </footer>

      {/* Customization side drawer (Pomodoro, Theme, Ambient, Mascot) */}
      <CustomizationDrawer
        isTdah={isTdah}
        mascot={mascot}
        onOpenMascotPicker={() => setShowMascotPicker(true)}
        questionCount={assistantMessageCount}
        onPomodoroComplete={(minutes) => { void minutes; awardXP(50); }}
      />
    </div>
  );
}
