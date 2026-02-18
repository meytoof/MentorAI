"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme, type Theme } from "./ThemePicker";
import PomodoroTimer from "./PomodoroTimer";
import { MASCOTTES, type MascotId } from "./MascotPicker";

const THEMES: { id: Theme; label: string; from: string; to: string }[] = [
  { id: "classic", label: "Classique", from: "#0f1624", to: "#1a2744" },
  { id: "space", label: "Espace", from: "#0a0118", to: "#1a0a3e" },
  { id: "ocean", label: "Océan", from: "#0c1f3f", to: "#0e4060" },
  { id: "forest", label: "Forêt", from: "#0a1f0a", to: "#0f3320" },
];

const AMBIANCES = [
  { id: "rain", label: "Pluie", emoji: "🌧️", file: "/sounds/rain.mp3", calm: true },
  { id: "library", label: "Bibliothèque", emoji: "📚", file: "/sounds/library.mp3", calm: true },
  { id: "forest", label: "Forêt", emoji: "🌿", file: "/sounds/forest.mp3", calm: true },
  { id: "lofi", label: "Lo-Fi", emoji: "🎵", file: "/sounds/lofi.mp3", calm: false },
  { id: "waves", label: "Vagues", emoji: "🌊", file: "/sounds/waves.mp3", calm: true },
] as const;

type AmbianceId = (typeof AMBIANCES)[number]["id"];

const TDAH_MAX_OPENS = 3;
const TDAH_COOLDOWN_MS = 5 * 60 * 1000;
const TDAH_AUTO_CLOSE_MS = 20_000;

interface CustomizationDrawerProps {
  isTdah: boolean;
  mascot: MascotId | null;
  onOpenMascotPicker: () => void;
  questionCount: number;
  onPomodoroComplete: (minutes: number) => void;
}

export default function CustomizationDrawer({
  isTdah,
  mascot,
  onOpenMascotPicker,
  questionCount,
  onPomodoroComplete,
}: CustomizationDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // TDAH protection
  const tdahOpensRef = useRef<number[]>([]);
  const [cooldownEnd, setCooldownEnd] = useState(0);
  const [tdahToast, setTdahToast] = useState("");
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ambient audio
  const [currentSound, setCurrentSound] = useState<AmbianceId | null>(null);
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Pomodoro phase tracking for floating indicator
  const [pomodoroRunning, setPomodoroRunning] = useState(false);

  // TDAH auto-close progress bar
  const [autoCloseProgress, setAutoCloseProgress] = useState(100);
  const autoCloseStartRef = useRef(0);
  const animFrameRef = useRef(0);

  // --- Audio lifecycle ---
  useEffect(() => {
    if (!currentSound) return;
    const ambiance = AMBIANCES.find((a) => a.id === currentSound);
    if (!ambiance) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(ambiance.file);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;
    if (soundPlaying) audio.play().catch(() => setSoundPlaying(false));
    return () => { audio.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSound]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (soundPlaying) audioRef.current.play().catch(() => setSoundPlaying(false));
    else audioRef.current.pause();
  }, [soundPlaying]);

  // --- TDAH auto-close with animated progress bar ---
  useEffect(() => {
    if (!isTdah || !isOpen) {
      setAutoCloseProgress(100);
      cancelAnimationFrame(animFrameRef.current);
      return;
    }
    autoCloseStartRef.current = Date.now();
    const animate = () => {
      const elapsed = Date.now() - autoCloseStartRef.current;
      const remaining = Math.max(0, 100 - (elapsed / TDAH_AUTO_CLOSE_MS) * 100);
      setAutoCloseProgress(remaining);
      if (remaining > 0) animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    autoCloseRef.current = setTimeout(() => setIsOpen(false), TDAH_AUTO_CLOSE_MS);
    return () => {
      if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isTdah, isOpen]);

  // --- Toast auto-hide ---
  useEffect(() => {
    if (!tdahToast) return;
    toastRef.current = setTimeout(() => setTdahToast(""), 4000);
    return () => { if (toastRef.current) clearTimeout(toastRef.current); };
  }, [tdahToast]);

  // --- Cooldown countdown for re-render ---
  const [, tick] = useState(0);
  useEffect(() => {
    if (cooldownEnd <= 0) return;
    const interval = setInterval(() => {
      if (Date.now() >= cooldownEnd) {
        setCooldownEnd(0);
        clearInterval(interval);
      }
      tick((n) => n + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownEnd]);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    if (isTdah) {
      const now = Date.now();
      if (cooldownEnd > now) {
        const secs = Math.ceil((cooldownEnd - now) / 1000);
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        setTdahToast(`Pause concentration ! ⏳ ${mins}:${String(s).padStart(2, "0")}`);
        return;
      }
      const opens = tdahOpensRef.current.filter((t) => now - t < 10 * 60 * 1000);
      tdahOpensRef.current = opens;
      if (opens.length >= TDAH_MAX_OPENS) {
        setCooldownEnd(now + TDAH_COOLDOWN_MS);
        tdahOpensRef.current = [];
        setTdahToast("Concentre-toi sur ton travail ! Réessaie dans 5 min 💪");
        return;
      }
      tdahOpensRef.current.push(now);
    }
    setIsOpen(true);
  }, [isOpen, isTdah, cooldownEnd]);

  function selectAmbiance(id: AmbianceId) {
    if (currentSound === id) setSoundPlaying((p) => !p);
    else {
      setCurrentSound(id);
      setSoundPlaying(true);
    }
  }

  const availableAmbiances = isTdah ? AMBIANCES.filter((a) => a.calm) : [...AMBIANCES];
  const currentAmbianceData = currentSound ? AMBIANCES.find((a) => a.id === currentSound) : null;
  const mascotData = mascot ? MASCOTTES.find((m) => m.id === mascot) : null;
  const inCooldown = isTdah && cooldownEnd > Date.now();

  return (
    <>
      {/* TDAH cooldown toast */}
      {tdahToast && (
        <div
          className="fixed right-16 top-20 z-[9998] max-w-xs rounded-xl border border-amber-500/30 bg-amber-950/90 px-4 py-3 text-sm font-medium text-amber-200 shadow-xl backdrop-blur-xl"
          style={{ animation: "bubble-in 0.3s ease-out" }}
        >
          {tdahToast}
        </div>
      )}

      {/* Floating side buttons (when drawer is closed) */}
      <div className={`fixed right-3 top-1/2 z-[60] flex -translate-y-1/2 flex-col items-center gap-2.5 transition-opacity duration-200 ${isOpen ? "pointer-events-none opacity-0" : "opacity-100"}`}>
        {/* Main toggle */}
        <button
          onClick={handleToggle}
          className={`group flex h-11 w-11 items-center justify-center rounded-full border shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
            inCooldown
              ? "border-amber-500/30 bg-amber-500/10 text-amber-400/60 cursor-not-allowed"
              : "border-white/15 bg-black/50 text-white/70 hover:border-white/30 hover:bg-black/70 hover:text-white"
          }`}
          title={inCooldown ? "En pause..." : "Personnaliser"}
        >
          {inCooldown ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          )}
        </button>

        {/* Sound playing indicator */}
        {currentSound && soundPlaying && (
          <button
            onClick={handleToggle}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-green-500/30 bg-green-500/15 text-sm shadow-md backdrop-blur-sm transition-all hover:scale-110"
            title={`${currentAmbianceData?.label || "Son"} en cours`}
            style={{ animation: "voice-pulse 2s ease-in-out infinite" }}
          >
            {currentAmbianceData?.emoji || "🎧"}
          </button>
        )}

        {/* Pomodoro running indicator */}
        {pomodoroRunning && (
          <button
            onClick={handleToggle}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/15 text-sm shadow-md backdrop-blur-sm transition-all hover:scale-110"
            title="Timer en cours"
            style={{ animation: "pomodoro-tick 1s ease-in-out infinite" }}
          >
            ⏱
          </button>
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-[2px]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-14 bottom-0 z-[80] w-80 border-l border-white/10 bg-neutral-900/[.98] shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80">
              {isTdah ? "⚙️ Outils" : "✨ Personnaliser"}
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* TDAH auto-close progress bar */}
          {isTdah && isOpen && (
            <div className="relative h-1 w-full shrink-0 bg-white/5">
              <div
                className="absolute inset-y-0 left-0 rounded-r-full bg-gradient-to-r from-amber-500 to-amber-300 transition-[width] duration-100"
                style={{ width: `${autoCloseProgress}%` }}
              />
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 p-5">

              {/* ====== Pomodoro ====== */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                  <span>⏱</span> Pomodoro
                </h3>
                <PomodoroTimer
                  isTdah={isTdah}
                  questionCount={questionCount}
                  onPomodoroComplete={onPomodoroComplete}
                  onPhaseChange={(phase) => setPomodoroRunning(phase === "running")}
                  embedded
                />
              </section>

              {/* ====== Thème ====== */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                  <span>🎨</span> Thème visuel
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
                        theme === t.id
                          ? "bg-white/15 text-white ring-1 ring-blue-500/50"
                          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span
                        className="h-5 w-5 flex-shrink-0 rounded-full border border-white/20"
                        style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                      />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* ====== Ambiance sonore ====== */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                  <span>🎧</span> {isTdah ? "Sons calmes" : "Ambiance sonore"}
                </h3>
                {isTdah && (
                  <p className="mb-2 text-[11px] text-white/30">Seulement les sons calmes pour t&apos;aider à te concentrer.</p>
                )}
                <div className="space-y-1">
                  {availableAmbiances.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => selectAmbiance(a.id)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
                        currentSound === a.id
                          ? "bg-white/15 text-white"
                          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span>{a.emoji}</span>
                      <span className="text-xs font-medium">{a.label}</span>
                      {currentSound === a.id && soundPlaying && (
                        <span className="ml-auto text-xs text-green-400">▶</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Volume controls */}
                {currentSound && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                    <button
                      onClick={() => setSoundPlaying((p) => !p)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {soundPlaying ? "⏸" : "▶"}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="h-1 flex-1 cursor-pointer accent-blue-500"
                    />
                    <span className="text-[10px] tabular-nums text-white/30">{Math.round(volume * 100)}%</span>
                  </div>
                )}
              </section>

              {/* ====== Mascotte (non-TDAH) ====== */}
              {!isTdah && (
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                    <span>🐾</span> Mascotte
                  </h3>
                  <button
                    onClick={() => { onOpenMascotPicker(); setIsOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {mascotData ? (
                      <>
                        <span className="text-2xl">{mascotData.emoji}</span>
                        <div className="text-left">
                          <p className="font-medium text-white">{mascotData.name}</p>
                          <p className="text-[11px] text-white/40">{mascotData.trait}</p>
                        </div>
                        <span className="ml-auto text-xs text-white/30">Changer →</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl opacity-50">🐾</span>
                        <span className="font-medium">Choisir une mascotte</span>
                        <span className="ml-auto text-xs text-white/30">→</span>
                      </>
                    )}
                  </button>
                </section>
              )}

              {/* TDAH focus reminder */}
              {isTdah && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-center text-sm text-blue-200/70">
                  💡 Concentre-toi, tu fais du super boulot !
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
