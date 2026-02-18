"use client";

import { useSyncExternalStore, useCallback } from "react";

export type Theme = "classic" | "space" | "ocean" | "forest";

const THEMES: { id: Theme; label: string; emoji: string; from: string; to: string }[] = [
  { id: "classic", label: "Classique", emoji: "", from: "#0f1624", to: "#1a2744" },
  { id: "space", label: "Espace", emoji: "", from: "#0a0118", to: "#1a0a3e" },
  { id: "ocean", label: "Océan", emoji: "", from: "#0c1f3f", to: "#0e4060" },
  { id: "forest", label: "Forêt", emoji: "", from: "#0a1f0a", to: "#0f3320" },
];

const STORAGE_KEY = "mentoria_theme";
const THEME_EVENT = "mentoria-theme-change";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "classic";
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (saved && THEMES.find((t) => t.id === saved)) return saved;
  return "classic";
}

function setStoredTheme(t: Theme) {
  localStorage.setItem(STORAGE_KEY, t);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: t }));
}

function subscribeTheme(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb);
  return () => window.removeEventListener(THEME_EVENT, cb);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void } {
  const theme = useSyncExternalStore(subscribeTheme, getStoredTheme, (): Theme => "classic");

  const setTheme = useCallback((t: Theme) => {
    setStoredTheme(t);
  }, []);

  return { theme, setTheme };
}

interface ThemePickerProps {
  onClose?: () => void;
}

export default function ThemePicker({ onClose }: ThemePickerProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="absolute right-0 top-full z-[9999] mt-2 w-52 rounded-xl border border-white/10 bg-neutral-900/95 p-3 shadow-xl ring-1 ring-black/20 backdrop-blur-xl"
      style={{ animation: "theme-picker-in 0.18s ease-out" }}
    >
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-white/40">Thème visuel</p>
      <div className="space-y-1">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTheme(t.id); onClose?.(); }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              theme === t.id
                ? "bg-white/15 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span
              className="h-5 w-5 flex-shrink-0 rounded-full border border-white/20"
              style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
            />
            <span>{t.emoji} {t.label}</span>
            {theme === t.id && <span className="ml-auto text-blue-400">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
