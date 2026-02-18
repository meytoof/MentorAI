"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

interface OnboardingState {
  childAge: number | null;
  schoolLevel: string | null;
  hasRedoublement: boolean | null;
  childContext: string;
  mentoriaReason: string;
  difficultSubjects: string;
  learningObjective: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 7; // steps 1–7

const slideVariants = {
  enter: (d: number) => ({ x: d * 60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d * -60, opacity: 0 }),
};

const ENV_TIPS = [
  { icon: "🔇", title: "Endroit calme", desc: "Éloigner les sources de bruit (TV, fratrie)" },
  { icon: "📵", title: "Sans téléphone", desc: "Mettre le téléphone en mode silencieux" },
  { icon: "✏️", title: "Matériel prêt", desc: "Cahier, stylo ou crayon à portée de main" },
  { icon: "🍎", title: "Pas fatigué(e)", desc: "S'assurer que l'enfant n'a pas faim ou soif" },
  { icon: "⏱️", title: "30 min devant soi", desc: "Prévoir un créneau sans interruption" },
];

const CELEBRATE_ITEMS = [
  { icon: "✨", label: "Profil personnalisé" },
  { icon: "🧠", label: "IA adaptée à votre enfant" },
  { icon: "🚀", label: "Prêt à apprendre ensemble" },
];

const MIN_CHARS = 15;

// ─── TextArea Field ───────────────────────────────────────────────────────────

function RichTextarea({
  value,
  onChange,
  placeholder,
  maxLength = 800,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength?: number;
}) {
  const remaining = value.trim().length;
  const ready = remaining >= MIN_CHARS;

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={6}
        className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-white placeholder-white/25 transition focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
      />
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={ready ? "text-emerald-400" : "text-white/30"}>
          {ready ? "✓ Super !" : `Encore ${MIN_CHARS - remaining} caractères min.`}
        </span>
        <span className="text-white/20">{value.length} / {maxLength}</span>
      </div>
    </div>
  );
}

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
  const progress = ((step - 1) / TOTAL_STEPS) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      {step >= 1 && step <= TOTAL_STEPS && (
        <div className="mb-8 w-full max-w-lg">
          <div className="mb-2 flex justify-between text-xs text-white/40">
            <span>Étape {step} / {TOTAL_STEPS}</span>
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
    childContext: "",
    mentoriaReason: "",
    difficultSubjects: "",
    learningObjective: "",
  });

  const firstName = (session?.user as { name?: string })?.name?.split(" ")[0] ?? "vous";

  function goTo(next: Step) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }
  function next() { goTo((step + 1) as Step); }
  function back() { goTo((step - 1) as Step); }

  async function handleFinish() {
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
          childContext: state.childContext,
          mentoriaReason: state.mentoriaReason,
          difficultSubjects: state.difficultSubjects,
          learningObjective: state.learningObjective,
        }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      goTo(8);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  }

  const ages = Array.from({ length: 10 }, (_, i) => i + 6);
  const levels = ["CP", "CE1", "CE2", "CM1", "CM2", "6e"];

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

          {/* ── Step 0 : Bienvenue ── */}
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
                Prenons 2 minutes pour personnaliser MentorIA selon le profil unique de votre enfant.
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
              subtitle="Nous adaptons le vocabulaire et le rythme d'apprentissage."
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
              subtitle="Pour calibrer les exercices proposés."
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
              title="A-t-il / elle déjà redoublé ?"
              subtitle="Cela nous aide à calibrer le niveau de départ."
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

          {/* ── Step 4 : Contexte général ── */}
          {step === 4 && (
            <StepShell
              step={step}
              title="Parlez-nous de votre enfant"
              subtitle="Comment le décririez-vous ? Son caractère, sa façon d'apprendre, ses points forts..."
              canNext={state.childContext.trim().length >= MIN_CHARS}
              onNext={next}
              onBack={back}
            >
              <RichTextarea
                value={state.childContext}
                onChange={(v) => setState((s) => ({ ...s, childContext: v }))}
                placeholder="Ex : Ma fille a 9 ans, elle est en CE2. Très créative et curieuse, elle se décourage vite quand un exercice lui résiste. Elle adore les histoires et apprend mieux avec des exemples concrets. Elle peut être distraite mais s'investit vraiment quand elle se sent en confiance..."
              />
            </StepShell>
          )}

          {/* ── Step 5 : Pourquoi MentorIA ── */}
          {step === 5 && (
            <StepShell
              step={step}
              title="Pourquoi avez-vous choisi MentorIA ?"
              subtitle="Décrivez librement la situation et ce qui vous a amené ici."
              canNext={state.mentoriaReason.trim().length >= MIN_CHARS}
              onNext={next}
              onBack={back}
            >
              <RichTextarea
                value={state.mentoriaReason}
                onChange={(v) => setState((s) => ({ ...s, mentoriaReason: v }))}
                placeholder="Ex : Mon fils peine en maths depuis le CE1 et les devoirs sont souvent source de tension à la maison. Je travaille jusqu'à 19h et je n'ai pas toujours le temps de l'accompagner. J'aimerais qu'il gagne en autonomie et reprenne confiance en lui..."
              />
            </StepShell>
          )}

          {/* ── Step 6 : Difficultés ── */}
          {step === 6 && (
            <StepShell
              step={step}
              title="Quelles sont ses principales difficultés ?"
              subtitle="Matières, types d'exercices, situations particulières... soyez précis, c'est ce qui rend MentorIA vraiment utile."
              canNext={state.difficultSubjects.trim().length >= MIN_CHARS}
              onNext={next}
              onBack={back}
            >
              <RichTextarea
                value={state.difficultSubjects}
                onChange={(v) => setState((s) => ({ ...s, difficultSubjects: v }))}
                placeholder="Ex : Surtout en maths (les fractions et la géométrie) et en orthographe. Il comprend bien à l'oral mais dès qu'il faut écrire ou poser un calcul il se bloque. Les problèmes à plusieurs étapes sont particulièrement difficiles pour lui..."
              />
            </StepShell>
          )}

          {/* ── Step 7 : Objectif ── */}
          {step === 7 && (
            <StepShell
              step={step}
              title="Qu'espérez-vous accomplir ensemble ?"
              subtitle="Votre objectif guide la progression et le ton de MentorIA."
              canNext={state.learningObjective.trim().length >= MIN_CHARS}
              onNext={handleFinish}
              onBack={back}
              isLoading={isLoading}
              nextLabel="Terminer →"
            >
              <>
                {error && (
                  <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}
                <RichTextarea
                  value={state.learningObjective}
                  onChange={(v) => setState((s) => ({ ...s, learningObjective: v }))}
                  placeholder="Ex : J'aimerais qu'il rattrape son retard en maths avant la fin du trimestre et surtout qu'il retrouve le goût d'apprendre. À terme, l'idéal serait qu'il soit capable de faire ses devoirs seul et de poser des questions sans avoir honte de ne pas comprendre..."
                />
              </>
            </StepShell>
          )}

          {/* ── Step 8 : Préparation de l'environnement ── */}
          {step === 8 && (
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
                  onClick={() => goTo(9)}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Prêt, on y va ! →
                </motion.button>
              </div>
            </div>
          )}

          {/* ── Step 9 : Célébration ── */}
          {step === 9 && (
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

              <div className="mb-8 flex w-full max-w-xs flex-col gap-3">
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
