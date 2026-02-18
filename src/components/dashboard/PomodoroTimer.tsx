"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "goal-modal" | "running" | "break" | "recap";

const DURATIONS = [
  { label: "10 min", value: 10, tdah: true },
  { label: "15 min", value: 15, tdah: false },
  { label: "25 min", value: 25, tdah: false },
  { label: "45 min", value: 45, tdah: false },
];

interface PomodoroTimerProps {
  isTdah?: boolean;
  questionCount?: number;
  onPomodoroComplete?: (minutes: number) => void;
  onPhaseChange?: (phase: string) => void;
  embedded?: boolean;
}

const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PomodoroTimer({ isTdah = false, questionCount = 0, onPomodoroComplete, onPhaseChange, embedded = false }: PomodoroTimerProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [duration, setDuration] = useState(isTdah ? 10 : 25);
  const [goal, setGoal] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = duration * 60;
  const progress = secondsLeft / totalSeconds;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const startTimer = useCallback(() => {
    setSecondsLeft(totalSeconds);
    setPhase("running");
  }, [totalSeconds]);

  useEffect(() => {
    if (phase !== "running") return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setSessionMinutes(duration);
          setPhase("break");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [phase, duration]);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  function handleGoalSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTimer();
  }

  function handleBreakDone() {
    const xp = 50;
    setXpEarned(xp);
    onPomodoroComplete?.(sessionMinutes);
    setPhase("recap");
  }

  function handleNewSession() {
    setPhase("idle");
    setGoal("");
    setSessionMinutes(0);
    setXpEarned(0);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Couleur selon le temps restant
  const color = progress > 0.5 ? "#3b82f6" : progress > 0.2 ? "#f59e0b" : "#ef4444";

  return (
    <>
      {embedded ? (
        <>
          {phase === "idle" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {DURATIONS.filter((d) => !isTdah || d.tdah || d.value >= 10).map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      duration === d.value ? "bg-blue-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPhase("goal-modal")}
                className="w-full rounded-xl bg-blue-600/80 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
              >
                Démarrer 🚀
              </button>
            </div>
          )}
          {phase === "running" && (
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <svg width="36" height="36" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle cx="44" cy="44" r={RADIUS} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset} transform="rotate(-90 44 44)" style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.5s" }} />
                </svg>
                <span className="font-mono text-lg font-semibold text-white">{timeStr}</span>
              </div>
              <button
                onClick={() => { clearInterval(intervalRef.current!); setPhase("idle"); }}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/20 hover:text-white"
              >
                Arrêter
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2">
          {phase === "idle" && (
            <button
              onClick={() => setPhase("goal-modal")}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-medium text-white/60 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
              title="Démarrer un Pomodoro"
            >
              <span>⏱</span>
              <span className="hidden sm:inline">Pomodoro</span>
            </button>
          )}
          {phase === "running" && (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-sm">
              <svg width="28" height="28" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle cx="44" cy="44" r={RADIUS} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset} transform="rotate(-90 44 44)" style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.5s" }} />
              </svg>
              <span className="text-sm font-mono font-semibold text-white">{timeStr}</span>
              <button onClick={() => { clearInterval(intervalRef.current!); setPhase("idle"); }} className="text-xs text-white/40 hover:text-white/80" title="Arrêter">✕</button>
            </div>
          )}
        </div>
      )}

      {/* Modal objectif */}
      {phase === "goal-modal" && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setPhase("idle"); }}>
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl" style={{ animation: "modal-in 0.2s ease-out" }}>
            <h2 className="mb-1 text-lg font-semibold text-white">🎯 Objectif de la session</h2>
            <p className="mb-4 text-sm text-white/50">Qu&apos;est-ce que tu veux réaliser ?</p>

            <div className="mb-4 flex flex-wrap gap-2">
              {DURATIONS.filter((d) => !isTdah || d.tdah || d.value >= 10).map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    duration === d.value ? "bg-blue-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleGoalSubmit}>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Ex: Finir les exercices de maths pages 42-43..."
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-blue-500/50 focus:outline-none resize-none"
              />
              <button
                type="submit"
                className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-500"
              >
                C&apos;est parti ! 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal pause / félicitation */}
      {phase === "break" && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl text-center" style={{ animation: "modal-in 0.2s ease-out" }}>
            <div className="mb-3 text-5xl">🎉</div>
            <h2 className="mb-2 text-xl font-bold text-white">Session terminée !</h2>
            <p className="mb-1 text-white/70">Tu as travaillé <strong className="text-white">{sessionMinutes} minutes</strong> d&apos;affilée.</p>
            {goal && <p className="mb-4 text-sm italic text-white/50">&ldquo;{goal}&rdquo;</p>}
            <p className="mb-5 text-sm text-amber-300">Prends une pause méritée de 5 minutes ☕</p>
            <button
              onClick={handleBreakDone}
              className="w-full rounded-xl bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-500"
            >
              Nouvelle session →
            </button>
          </div>
        </div>
      )}

      {/* Modal récap */}
      {phase === "recap" && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl" style={{ animation: "modal-in 0.2s ease-out" }}>
            <h2 className="mb-4 text-xl font-bold text-white text-center">⭐ Récap de session</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                <span className="text-white/70">⏱ Minutes travaillées</span>
                <span className="font-bold text-white">{sessionMinutes}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                <span className="text-white/70">❓ Questions posées</span>
                <span className="font-bold text-white">{questionCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-4 py-3 border border-amber-500/20">
                <span className="text-amber-300">⭐ XP gagné</span>
                <span className="font-bold text-amber-300">+{xpEarned}</span>
              </div>
            </div>
            <button
              onClick={handleNewSession}
              className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-500"
            >
              Retour au tableau
            </button>
          </div>
        </div>
      )}
    </>
  );
}
