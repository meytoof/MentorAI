"use client";

import { useState } from "react";

export type MascotId = "owl" | "fox" | "turtle" | "frog" | "lion" | "elephant" | "dolphin" | "panda";

export const MASCOTTES: { id: MascotId; emoji: string; name: string; trait: string; phrases: string[] }[] = [
  {
    id: "owl",
    emoji: "🦉",
    name: "Chouette",
    trait: "Sage & curieuse",
    phrases: [
      "La curiosité est la clé du savoir !",
      "Chaque question est une porte vers l'apprentissage.",
      "Tu progresses bien, continue !",
      "L'erreur est le début de la compréhension.",
      "Prends le temps de réfléchir, c'est ça la vraie force.",
    ],
  },
  {
    id: "fox",
    emoji: "🦊",
    name: "Renard",
    trait: "Malin & rapide",
    phrases: [
      "Trouve l'astuce cachée dans l'exercice !",
      "Sois futé·e, cherche le raccourci intelligent.",
      "Tu es plus malin·e que tu ne le crois !",
      "Un problème à la fois, tu vas y arriver.",
      "L'astuce est juste là, cherche encore !",
    ],
  },
  {
    id: "turtle",
    emoji: "🐢",
    name: "Tortue",
    trait: "Patiente & persévérante",
    phrases: [
      "Lentement mais sûrement, tu avances !",
      "Chaque petit pas compte.",
      "La persévérance bat toujours la vitesse.",
      "Pas à pas, tu construis ta réussite.",
      "Prends ton temps, c'est ta force !",
    ],
  },
  {
    id: "frog",
    emoji: "🐸",
    name: "Grenouille",
    trait: "Joyeuse & créative",
    phrases: [
      "Hop, hop, hop vers la réussite !",
      "Apprendre c'est une aventure amusante !",
      "Saute sur chaque opportunité d'apprendre.",
      "Tu es trop fort·e, continue comme ça !",
      "Chaque exercice est un nouveau saut !",
    ],
  },
  {
    id: "lion",
    emoji: "🦁",
    name: "Lion",
    trait: "Courageux & déterminé",
    phrases: [
      "Montre-leur de quoi tu es capable !",
      "Le courage, c'est essayer même quand c'est difficile.",
      "Tu es un champion·ne !",
      "Rugis de fierté, tu travailles bien !",
      "Les obstacles rendent plus fort·e.",
    ],
  },
  {
    id: "elephant",
    emoji: "🐘",
    name: "Éléphant",
    trait: "Méthodique & bonne mémoire",
    phrases: [
      "Souviens-toi : répéter aide à mémoriser !",
      "Méthode + patience = succès.",
      "Chaque révision renforce ta mémoire.",
      "Tu retiendras mieux si tu fais des pauses.",
      "L'organisation est ta super-puissance !",
    ],
  },
  {
    id: "dolphin",
    emoji: "🐬",
    name: "Dauphin",
    trait: "Intelligent & joueur",
    phrases: [
      "L'apprentissage peut être un jeu !",
      "Explore toutes les pistes possibles.",
      "Tu nages vers le succès !",
      "La vraie intelligence, c'est la curiosité.",
      "Chaque exercice est une nouvelle vague à surfer.",
    ],
  },
  {
    id: "panda",
    emoji: "🐼",
    name: "Panda",
    trait: "Calme & concentré",
    phrases: [
      "Respire, concentre-toi, tu vas réussir.",
      "La sérénité mène à la clarté d'esprit.",
      "Calme-toi et la solution apparaîtra.",
      "Tu fais du bon travail, sois fier·e.",
      "La douceur est une force.",
    ],
  },
];

interface MascotPickerProps {
  currentMascot: MascotId | null;
  onSelect: (mascot: MascotId) => void;
  onClose: () => void;
}

export default function MascotPicker({ currentMascot, onSelect, onClose }: MascotPickerProps) {
  const [selected, setSelected] = useState<MascotId | null>(currentMascot);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch("/api/user/mascot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mascot: selected }),
      });
      onSelect(selected);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative mx-4 w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl"
        style={{ animation: "modal-in 0.25s ease-out" }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/40 hover:text-white/80"
        >
          ✕
        </button>
        <h2 className="mb-1 text-xl font-semibold text-white">Choisis ta mascotte</h2>
        <p className="mb-5 text-sm text-white/50">Elle t&apos;encouragera pendant tes devoirs !</p>

        <div className="grid grid-cols-4 gap-3">
          {MASCOTTES.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all ${
                selected === m.id
                  ? "bg-blue-600/30 ring-2 ring-blue-500"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <span className="text-3xl" style={{ animation: selected === m.id ? "mascot-float 2s ease-in-out infinite" : "none" }}>
                {m.emoji}
              </span>
              <span className="text-xs font-medium text-white">{m.name}</span>
              <span className="text-[10px] text-white/40 leading-tight">{m.trait}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 italic">
            &ldquo;{MASCOTTES.find((m) => m.id === selected)?.phrases[0]}&rdquo;
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!selected || saving}
          className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Confirmer ma mascotte"}
        </button>
      </div>
    </div>
  );
}
