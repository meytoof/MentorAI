"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface OnboardingState {
  childAge: number | null;
  schoolLevel: string | null;
  hasRedoublement: boolean | null;
  mentoriaReason: string | null;
  difficultSubjects: string[];
  learningObjective: string | null;
}

// ─── Slide variants ───────────────────────────────────────────────────────────

const slideVariants = {
  enter: (d: number) => ({ x: d * 60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d * -60, opacity: 0 }),
};

// ─── Env tips (step 7) ────────────────────────────────────────────────────────

const ENV_TIPS = [
  { icon: "🔇", title: "Endroit calme", desc: "Éloigner les sources de bruit (TV, fratrie)" },
  { icon: "📵", title: "Sans téléphone", desc: "Mettre le téléphone en mode silencieux" },
  { icon: "✏️", title: "Matériel prêt", desc: "Cahier, stylo ou crayon à portée de main" },
  { icon: "🍎", title: "Pas fatigué(e)", desc: "S'assurer que l'enfant n'a pas faim ou soif" },
  { icon: "⏱️", title: "30 min devant soi", desc: "Prévoir un créneau sans interruption" },
];

const CELEBRATE_ITEMS = [
  { icon: "✨", label: "Profil personnalisé" },
  { icon: "🧠", label: "IA adaptée à ton enfant" },
  { icon: "🚀", label: "Prêt à apprendre" },
];

// ─── StepShell ────────────────────────────────────────────────────────────────

function StepShell({
  title,
  subtitle,
  children,
  canNext,
  onNext,
  onBack,
  step,
  isLoading,
  nextLabel,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  canNext: boolean;
  onNext: () => void;
  onBack?: () => void;
  step: Step;
  isLoading?: boolean;
  nextLabel?: string;
}) {
  const totalSteps = 6;
  const progress = ((step - 1) / totalSteps) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      {/* Progress bar */}
      {step >= 1 && step <= 6 && (
        <div className="mb-8 w-full max-w-lg">
          <div className="mb-2 flex justify-between text-xs text-white/40">
            <span>Étape {step} / {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}

      <div className="w-full max-w-lg">
        <h2 className="mb-2 text-2xl font-bold text-white">{title}</h2>
        {subtitle && <p className="mb-6 text-sm text-white/50">{subtitle}</p>}

        <div className="mb-8">{children}</div>

        <div className="flex gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-white/60 transition hover:bg-white/5"
            >
              ← Retour
            </button>
          )}
          <button
            onClick={onNext}
            disabled={!canNext || isLoading}
            className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? "Enregistrement..." : (nextLabel ?? "Suivant →")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [step, setStep] = useState<Step>(0);
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<OnboardingState>({
    childAge: null,
    schoolLevel: null,
    hasRedoublement: null,
    mentoriaReason: null,
    difficultSubjects: [],
    learningObjective: null,
  });

  const firstName = (session?.user as { name?: string })?.name?.split(" ")[0] ?? "toi";

  function goTo(next: Step) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function next() {
    goTo((step + 1) as Step);
  }
  function back() {
    goTo((step - 1) as Step);
  }

  async function handleFinish() {
    if (!state.childAge || !state.schoolLevel || state.hasRedoublement === null || !state.mentoriaReason || state.difficultSubjects.length === 0 || !state.learningObjective) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childAge: state.childAge,
          schoolLevel: state.schoolLevel,
          hasRedoublement: state.hasRedoublement,
          mentoriaReason: state.mentoriaReason,
          difficultSubjects: state.difficultSubjects,
          learningObjective: state.learningObjective,
        }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      goTo(7);
    } catch {
      setError("Une erreur est survenue. Réessaie.");
    } finally {
      setIsLoading(false);
    }
  }

  const ages = Array.from({ length: 10 }, (_, i) => i + 6);
  const levels = ["CP", "CE1", "CE2", "CM1", "CM2", "6e"];
  const reasons = [
    { value: "difficulties", label: "Difficultés scolaires", icon: "📚" },
    { value: "time", label: "Manque de temps parental", icon: "⏰" },
    { value: "tdah", label: "Profil TDAH / neuro-atypique", icon: "🧩" },
    { value: "curiosity", label: "Curiosité & enrichissement", icon: "🔭" },
  ];
  const subjects = ["Maths", "Français", "Anglais", "Sciences", "Hist-Géo", "Autre"];
  const objectives = [
    { value: "catchup", label: "Rattrapage", icon: "📈", desc: "Combler les lacunes" },
    { value: "maintain", label: "Maintien", icon: "⚖️", desc: "Rester au niveau" },
    { value: "advance", label: "Avance", icon: "🚀", desc: "Prendre de l'avance" },
  ];

  return (
    <div className="overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* ── Step 0 : Welcome ── */}
          {step === 0 && (
            <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "backOut" }}
                className="mb-6 text-6xl"
              >
                👋
              </motion.div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="mb-3 text-3xl font-bold text-white"
              >
                Bienvenue, <span className="text-blue-400">{firstName}</span> !
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="mb-10 max-w-sm text-white/50"
              >
                Prenons 2 minutes pour personnaliser l&apos;expérience de MentorIA selon le profil de votre enfant.
              </motion.p>
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                onClick={next}
                className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Commencer →
              </motion.button>
            </div>
          )}

          {/* ── Step 1 : Âge ── */}
          {step === 1 && (
            <StepShell
              step={step}
              title="Quel âge a votre enfant ?"
              subtitle="Nous adaptons le niveau de langage et les explications."
              canNext={state.childAge !== null}
              onNext={next}
              onBack={back}
            >
              <div className="grid grid-cols-5 gap-2">
                {ages.map((age) => (
                  <button
                    key={age}
                    onClick={() => setState((s) => ({ ...s, childAge: age }))}
                    className={`rounded-xl border py-3 text-center text-sm font-semibold transition ${
                      state.childAge === age
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                    }`}
                  >
                    {age} ans
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {/* ── Step 2 : Niveau scolaire ── */}
          {step === 2 && (
            <StepShell
              step={step}
              title="Quel est son niveau scolaire ?"
              subtitle="Pour adapter les exercices et les explications."
              canNext={state.schoolLevel !== null}
              onNext={next}
              onBack={back}
            >
              <div className="grid grid-cols-3 gap-3">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setState((s) => ({ ...s, schoolLevel: level }))}
                    className={`rounded-xl border py-4 text-center text-base font-bold transition ${
                      state.schoolLevel === level
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {/* ── Step 3 : Redoublement ── */}
          {step === 3 && (
            <StepShell
              step={step}
              title="A-t-il / elle redoublé ?"
              subtitle="Cette information nous aide à calibrer le rythme."
              canNext={state.hasRedoublement !== null}
              onNext={next}
              onBack={back}
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: true, label: "Oui", icon: "✅" },
                  { value: false, label: "Non", icon: "❌" },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setState((s) => ({ ...s, hasRedoublement: opt.value }))}
                    className={`flex flex-col items-center gap-2 rounded-xl border py-6 text-sm font-semibold transition ${
                      state.hasRedoublement === opt.value
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {/* ── Step 4 : Raison ── */}
          {step === 4 && (
            <StepShell
              step={step}
              title="Pourquoi MentorIA ?"
              subtitle="Pour mieux cibler notre approche pédagogique."
              canNext={state.mentoriaReason !== null}
              onNext={next}
              onBack={back}
            >
              <div className="grid grid-cols-2 gap-3">
                {reasons.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setState((s) => ({ ...s, mentoriaReason: r.value }))}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition ${
                      state.mentoriaReason === r.value
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                    }`}
                  >
                    <span className="text-2xl">{r.icon}</span>
                    <span className="text-center leading-snug">{r.label}</span>
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {/* ── Step 5 : Matières difficiles ── */}
          {step === 5 && (
            <StepShell
              step={step}
              title="Matières les plus difficiles ?"
              subtitle="Sélectionne une ou plusieurs matières."
              canNext={state.difficultSubjects.length > 0}
              onNext={next}
              onBack={back}
            >
              <div className="grid grid-cols-2 gap-3">
                {subjects.map((s) => {
                  const selected = state.difficultSubjects.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          difficultSubjects: selected
                            ? prev.difficultSubjects.filter((x) => x !== s)
                            : [...prev.difficultSubjects, s],
                        }))
                      }
                      className={`rounded-xl border py-3 text-sm font-medium transition ${
                        selected
                          ? "border-blue-500 bg-blue-600 text-white"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {/* ── Step 6 : Objectif ── */}
          {step === 6 && (
            <StepShell
              step={step}
              title="Quel est votre objectif ?"
              subtitle="On adapte la progression et le ton de MentorIA."
              canNext={state.learningObjective !== null}
              onNext={handleFinish}
              onBack={back}
              isLoading={isLoading}
              nextLabel="Terminer →"
            >
              <div className="flex flex-col gap-3">
                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}
                {objectives.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setState((s) => ({ ...s, learningObjective: o.value }))}
                    className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                      state.learningObjective === o.value
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                    }`}
                  >
                    <span className="text-2xl">{o.icon}</span>
                    <div>
                      <div className="font-semibold">{o.label}</div>
                      <div className="text-xs opacity-70">{o.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {/* ── Step 7 : Préparation de l'environnement ── */}
          {step === 7 && (
            <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
              <div className="w-full max-w-lg">
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="mb-2 text-3xl font-bold text-white"
                >
                  Avant de commencer...
                </motion.div>
                <motion.p
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="mb-8 text-sm text-white/50"
                >
                  Quelques conseils pour une session optimale avec votre enfant.
                </motion.p>

                <div className="mb-8 flex flex-col gap-3">
                  {ENV_TIPS.map((tip, i) => (
                    <motion.div
                      key={tip.title}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                      className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <span className="mt-0.5 text-2xl">{tip.icon}</span>
                      <div>
                        <div className="font-semibold text-white">{tip.title}</div>
                        <div className="text-sm text-white/50">{tip.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  onClick={() => goTo(8)}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Prêt, on y va ! →
                </motion.button>
              </div>
            </div>
          )}

          {/* ── Step 8 : Célébration ── */}
          {step === 8 && (
            <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "backOut" }}
                className="mb-4 text-6xl"
              >
                🎉
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="mb-2 text-2xl font-bold text-white"
              >
                Tout est prêt !
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="mb-8 text-sm text-white/50"
              >
                MentorIA est configuré pour accompagner votre enfant.
              </motion.p>

              <div className="mb-8 flex flex-col gap-3 w-full max-w-xs">
                {CELEBRATE_ITEMS.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.35 + i * 0.1, duration: 0.4 }}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-medium text-white">{item.label}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                onClick={() => router.push("/dashboard/whiteboard")}
                className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                C&apos;est parti ! 🚀
              </motion.button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
