"use client";

import { useEffect, useRef, useState } from "react";

const AMBIANCES = [
  { id: "rain", label: "Pluie", emoji: "🌧️", file: "/sounds/rain.mp3" },
  { id: "library", label: "Bibliothèque", emoji: "📚", file: "/sounds/library.mp3" },
  { id: "forest", label: "Forêt", emoji: "🌿", file: "/sounds/forest.mp3" },
  { id: "lofi", label: "Lo-Fi", emoji: "🎵", file: "/sounds/lofi.mp3" },
  { id: "waves", label: "Vagues", emoji: "🌊", file: "/sounds/waves.mp3" },
] as const;

type AmbianceId = (typeof AMBIANCES)[number]["id"];

export default function AmbientPlayer() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<AmbianceId | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Crée/met à jour l'audio quand l'ambiance change
  useEffect(() => {
    if (!current) return;
    const ambiance = AMBIANCES.find((a) => a.id === current);
    if (!ambiance) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(ambiance.file);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    if (playing) {
      audio.play().catch(() => setPlaying(false));
    }

    return () => {
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  // Met à jour le volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Play/pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.play().catch(() => setPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [playing]);

  function selectAmbiance(id: AmbianceId) {
    if (current === id) {
      setPlaying((p) => !p);
    } else {
      setCurrent(id);
      setPlaying(true);
    }
    setOpen(false);
  }

  const currentAmbiance = AMBIANCES.find((a) => a.id === current);

  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2">
      {/* Menu ambiances */}
      {open && (
        <div className="rounded-xl border border-white/10 bg-neutral-900/95 p-2 shadow-xl backdrop-blur-xl" style={{ animation: "theme-picker-in 0.15s ease-out" }}>
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">Ambiance sonore</p>
          {AMBIANCES.map((a) => (
            <button
              key={a.id}
              onClick={() => selectAmbiance(a.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                current === a.id ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{a.emoji}</span>
              <span>{a.label}</span>
              {current === a.id && playing && <span className="ml-auto text-green-400 text-xs">▶</span>}
            </button>
          ))}
        </div>
      )}

      {/* Contrôles principaux */}
      <div className="flex items-center gap-2">
        {/* Bouton ouvre/ferme le menu */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg shadow-lg transition-colors ${
            current && playing
              ? "border-green-500/50 bg-green-500/20 text-green-300 hover:bg-green-500/30"
              : "border-white/10 bg-black/40 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
          title="Ambiance sonore"
        >
          {currentAmbiance ? currentAmbiance.emoji : "🎧"}
        </button>

        {/* Play/pause */}
        {current && (
          <button
            onClick={() => setPlaying((p) => !p)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-sm text-white/60 shadow-md hover:bg-white/10 hover:text-white"
            title={playing ? "Pause" : "Lecture"}
          >
            {playing ? "⏸" : "▶"}
          </button>
        )}

        {/* Volume slider */}
        {current && (
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="h-1 w-20 cursor-pointer accent-blue-500"
            title="Volume"
          />
        )}
      </div>
    </div>
  );
}
