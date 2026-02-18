"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface TdahToggleProps {
  initialValue: boolean;
}

export default function TdahToggle({ initialValue }: TdahToggleProps) {
  const [isTdah, setIsTdah] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    const newValue = !isTdah;
    setSaving(true);
    try {
      const res = await fetch("/api/user/tdah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTdah: newValue }),
      });
      if (res.ok) {
        setIsTdah(newValue);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <dt className="text-white/50">Mode TDAH</dt>
        <dd className="mt-0.5 text-xs text-white/35">
          Interface épurée, consignes courtes, protections anti-distraction
        </dd>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isTdah}
        disabled={saving}
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-50 ${
          isTdah ? "bg-blue-600" : "bg-white/15"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
            isTdah ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
