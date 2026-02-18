"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import LoginModal from "@/components/ui/LoginModal";

/* ─── Hook : IntersectionObserver ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Hook : compteur animé ─── */
function useCounter(target: number, duration = 1800, active = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0; const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, duration]);
  return value;
}

/* ─── FadeUp wrapper ─── */
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ─── StatCard ─── */
function StatCard({ value, suffix, label, source, delay = 0, color = "blue" }: { value: number; suffix: string; label: string; source: string; delay?: number; color?: string }) {
  const { ref, inView } = useInView(0.3);
  const [active, setActive] = useState(false);
  useEffect(() => { if (inView) setTimeout(() => setActive(true), delay); }, [inView, delay]);
  const count = useCounter(value, 1600, active);
  const colors: Record<string, string> = {
    blue: "text-blue-400 border-blue-500/20 bg-blue-500/5",
    violet: "text-violet-400 border-violet-500/20 bg-violet-500/5",
    emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    amber: "text-amber-400 border-amber-500/20 bg-amber-500/5",
  };
  return (
    <div ref={ref} className={`rounded-2xl border p-6 text-center transition-all duration-700 ${active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${colors[color] ?? colors.blue}`}>
      <div className={`mb-1 text-5xl font-extrabold tabular-nums ${color === "blue" ? "text-blue-400" : color === "violet" ? "text-violet-400" : color === "emerald" ? "text-emerald-400" : "text-amber-400"}`}>
        {count}{suffix}
      </div>
      <div className="mb-2 text-sm font-medium text-white/70">{label}</div>
      <div className="text-xs text-white/30">{source}</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   CHAT DÉMO — animation typewriter complète
════════════════════════════════════════════════════════ */
const CHAT_SCENARIOS = {
  maths: [
    { role: "user", text: "J'ai 24 bonbons à partager entre 6 amis. Combien chacun reçoit ?", delay: 0 },
    { role: "ai", text: "Pour partager équitablement, quelle opération utilise-t-on ?", delay: 900, keyword: "partager équitablement", tip: "Partager en parts égales = diviser" },
    { role: "user", text: "La division ?", delay: 2200 },
    { role: "ai", text: "Exactement ! Écris : 24 ÷ 6 = ?  Compte de 6 en 6 : 6, 12, 18, 24…", delay: 3100, keyword: "24 ÷ 6" },
    { role: "user", text: "= 4 !", delay: 4500 },
    { role: "ai", text: "✨ Bravo ! Tu as trouvé tout seul. C'est ça apprendre vraiment.", delay: 5200 },
  ],
  francais: [
    { role: "user", text: "Comment on accorde l'adjectif dans « Les fleurs sont belles » ?", delay: 0 },
    { role: "ai", text: "Quel est le nom que décrit l'adjectif « belles » dans cette phrase ?", delay: 900, keyword: "belles", tip: "Un adjectif s'accorde avec son nom" },
    { role: "user", text: "Le nom c'est « fleurs »", delay: 2300 },
    { role: "ai", text: "Bien ! Fleurs est féminin pluriel. Alors « belles » prend... ?", delay: 3200, keyword: "féminin pluriel" },
    { role: "user", text: "Un e et un s !", delay: 4600 },
    { role: "ai", text: "✨ Parfait ! Belle → belles. Tu as compris la règle.", delay: 5300 },
  ],
  conjugaison: [
    { role: "user", text: "Conjugue le verbe « aller » au présent.", delay: 0 },
    { role: "ai", text: "Aller est un verbe irrégulier. Commence : je vais, tu vas, il…", delay: 900, keyword: "verbe irrégulier", tip: "Irrégulier = il faut l'apprendre par cœur" },
    { role: "user", text: "il va !", delay: 2400 },
    { role: "ai", text: "Bien ! Maintenant : nous allons, vous… ?", delay: 3300, keyword: "nous allons" },
    { role: "user", text: "vous allez, ils vont !", delay: 4700 },
    { role: "ai", text: "✨ Bravo, c'est complet ! Tu l'as retenu.", delay: 5400 },
  ],
};

type ChatMsg = { role: string; text: string; delay: number; keyword?: string; tip?: string };

function ChatDemo({ tdahMode = false }: { tdahMode?: boolean }) {
  const [scenario, setScenario] = useState<"maths" | "francais" | "conjugaison">("maths");
  const [visible, setVisible] = useState<number[]>([]);
  const [started, setStarted] = useState(false);
  const [showTooltip, setShowTooltip] = useState<number | null>(null);
  const { ref, inView } = useInView(0.3);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function startScenario(msgs: ChatMsg[]) {
    timers.current.forEach(clearTimeout);
    setVisible([]); setStarted(false);
    setTimeout(() => {
      setStarted(true);
      msgs.forEach((msg, i) => {
        timers.current.push(setTimeout(() => setVisible((prev) => [...prev, i]), msg.delay + 200));
      });
    }, 100);
  }

  useEffect(() => {
    if (!inView || started) return;
    startScenario(CHAT_SCENARIOS[scenario]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  useEffect(() => {
    if (!started) return;
    startScenario(CHAT_SCENARIOS[scenario]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const msgs = CHAT_SCENARIOS[scenario];

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-lg">
      {!tdahMode && <div className="absolute -inset-6 rounded-3xl bg-blue-500/8 blur-3xl" />}
      <div className={`relative overflow-hidden rounded-2xl shadow-2xl ${tdahMode ? "border border-neutral-700 bg-[#0d1117]" : "border border-white/10 bg-[#0b1220]/95 backdrop-blur-sm"}`}>
        {/* Barre titre */}
        <div className={`flex items-center gap-2 border-b px-4 py-3 ${tdahMode ? "border-neutral-700 bg-neutral-900" : "border-white/8 bg-white/3"}`}>
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <div className="h-3 w-3 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs text-white/40">MentorIA — Tableau</span>
          {tdahMode && <span className="ml-auto rounded-full border border-violet-500/40 px-2 py-0.5 text-[10px] font-semibold text-violet-400">Mode TDAH</span>}
        </div>
        {/* Onglets scénario */}
        <div className={`flex border-b px-4 pt-2 gap-1 ${tdahMode ? "border-neutral-700" : "border-white/6"}`}>
          {(["maths", "francais", "conjugaison"] as const).map((s) => (
            <button key={s} onClick={() => setScenario(s)} className={`px-3 py-1.5 text-xs rounded-t-lg font-medium transition-colors ${scenario === s ? (tdahMode ? "bg-neutral-700 text-white" : "bg-blue-500/20 text-blue-300") : "text-white/35 hover:text-white/60"}`}>
              {s === "maths" ? "Maths" : s === "francais" ? "Français" : "Conjugaison"}
            </button>
          ))}
        </div>
        {/* Messages */}
        <div className="min-h-[300px] space-y-3 p-5">
          {msgs.map((msg, i) => (
            <div key={`${scenario}-${i}`}
              className={`flex transition-all duration-500 ${visible.includes(i) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"} ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`relative max-w-[82%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-blue-600 text-white" : tdahMode ? "border border-neutral-600 bg-neutral-800 text-white/90" : "border border-white/10 bg-white/8 text-white/90"}`}>
                {msg.keyword
                  ? msg.text.split(msg.keyword).map((part, j, arr) => (
                      <span key={j}>{part}{j < arr.length - 1 && (
                        <span className="relative cursor-help font-bold text-amber-400 underline decoration-dotted"
                          onMouseEnter={() => setShowTooltip(i)} onMouseLeave={() => setShowTooltip(null)}>
                          {msg.keyword}
                          {showTooltip === i && msg.tip && (
                            <span className="pointer-events-none absolute -top-9 left-0 z-50 whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-1.5 text-xs text-white shadow-xl ring-1 ring-white/15">
                              💡 {msg.tip}
                            </span>
                          )}
                        </span>
                      )}</span>
                    ))
                  : msg.text}
              </div>
            </div>
          ))}
          {visible.length < msgs.length && visible.length > 0 && (
            <div className="flex justify-start">
              <div className={`rounded-xl px-4 py-2.5 ${tdahMode ? "border border-neutral-600 bg-neutral-800" : "border border-white/10 bg-white/8"}`}>
                <span className="inline-flex gap-1">
                  {[0, 1, 2].map(d => <span key={d} className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />)}
                </span>
              </div>
            </div>
          )}
        </div>
        {/* Badge bas */}
        <div className={`flex items-center gap-2 border-t px-4 py-3 ${tdahMode ? "border-neutral-700 bg-neutral-900/60" : "border-white/8 bg-white/2"}`}>
          <span className="text-emerald-400 text-sm">🛡️</span>
          <span className="text-xs text-emerald-300/70">L'IA guide, ne donne jamais la réponse</span>
          <button onClick={() => startScenario(msgs)} className="ml-auto text-xs text-white/25 hover:text-white/50 transition-colors">↺ Rejouer</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   LANDING PAGE PRINCIPALE
════════════════════════════════════════════════════════ */
function LandingClientInner() {
  const [tdahPreview, setTdahPreview] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const hasAccess = !!(session && (session.user as { hasActiveAccess?: boolean })?.hasActiveAccess);
  // Connecté mais essai/abo expiré → inviter à souscrire, pas à s'inscrire
  const trialExpired = !!session && !hasAccess;

  useEffect(() => {
    if (searchParams.get("login") === "1") setLoginOpen(true);
  }, [searchParams]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#060c18] text-white">
      {/* Fond global */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.2) 0%, transparent 70%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 40% at 85% 85%, rgba(99,102,241,0.1) 0%, transparent 60%)" }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-white/6 bg-[#060c18]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/accueil" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600"><span className="text-sm font-bold">M</span></div>
            <span className="text-lg font-bold tracking-tight">MentorIA</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            {[["#demo", "Démo"], ["#comment-ca-marche", "Comment ça marche"], ["#tdah", "TDAH"], ["#tarifs", "Tarifs"]].map(([href, label]) => (
              <a key={href} href={href} className="text-sm text-white/55 transition-colors hover:text-white">{label}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <span className="size-7 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                    {session.user?.name?.[0]?.toUpperCase() ?? session.user?.email?.[0]?.toUpperCase() ?? "U"}
                  </span>
                  <span className="hidden md:block">{session.user?.name ?? session.user?.email}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-md bg-gray-900 border border-white/10 shadow-lg z-50">
                    <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                      Mon tableau de bord
                    </Link>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/accueil" })}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5"
                    >
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button type="button" onClick={() => setLoginOpen(true)} className="hidden text-sm text-white/55 hover:text-white md:block transition-colors">Connexion</button>
            )}
            {/* Bouton Essai gratuit : masqué si accès actif, remplacé si expiré */}
            {!hasAccess && (
              <Link href={trialExpired ? "/pricing" : "/signup"} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500">
                {trialExpired ? "Choisir un abonnement →" : "Essai gratuit →"}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="relative mx-auto max-w-7xl px-5 pb-28 pt-20 lg:pt-32">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" /> CP · CE1 · CE2 · CM1 · CM2
            </div>
            <h1 className="mb-6 text-5xl font-extrabold leading-[1.08] tracking-tight lg:text-6xl">
              L'IA qui fait{" "}
              <span className="relative">
                <span className="relative z-10 text-blue-400">vraiment apprendre</span>
                <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-blue-400/40" />
              </span>
              <br />ton enfant.
            </h1>
            <p className="mb-4 text-xl leading-relaxed text-white/60">
              MentorIA guide étape par étape, surligne les mots clés, explique les règles —{" "}
              <strong className="text-white/90">sans jamais donner la réponse.</strong>
            </p>
            <p className="mb-8 text-sm text-white/35">Conçu pour le primaire · Validé pour les profils TDAH · Méthode socratique</p>
            <div className="flex flex-wrap gap-4">
              {!hasAccess && (
                <Link href={trialExpired ? "/pricing" : "/signup"} className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:scale-[1.02]">
                  {trialExpired ? "Choisir un abonnement" : "Commencer l'essai gratuit"} <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              )}
              {hasAccess && (
                <Link href="/dashboard" className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:scale-[1.02]">
                  Mon tableau de bord <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              )}
              <a href="#demo" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-8 py-4 text-base font-medium text-white/65 transition-colors hover:border-white/30 hover:text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-xs">▶</span> Voir la démo
              </a>
            </div>
            {!hasAccess && !trialExpired && <p className="mt-3 text-xs text-white/25">Essai gratuit 1 jour · Sans carte bancaire en bêta</p>}
            <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-white/8 pt-7">
              {[["🛡️", "Sans triche garantie"], ["🧠", "Validé experts TDAH"], ["📚", "CP → CM2"], ["⭐", "Méthode socratique"]].map(([icon, label]) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-white/38">{icon} {label}</span>
              ))}
            </div>
          </div>
          <ChatDemo />
        </div>
      </section>

      {/* ══ BANDEAU SOCIAL PROOF ══ */}
      <div className="border-y border-white/5 bg-white/2 py-5 overflow-hidden">
        <div className="flex items-center gap-0 whitespace-nowrap" style={{ animation: "marquee 22s linear infinite", width: "max-content" }}>
          {[...Array(2)].flatMap((_, rep) =>
            ["🏫 Utilisé dans 12 écoles primaires", "👨‍👩‍👧 +320 familles en bêta", "⭐ 4,8/5 satisfaction parents", "🧠 Recommandé par des orthophonistes", "📊 +40% de mémorisation des règles", "🇫🇷 100% conforme programme EN"].map((item) => (
              <span key={`${rep}-${item}`} className="text-sm text-white/35 px-8">{item}</span>
            ))
          )}
        </div>
      </div>

      {/* ══ STATS TDAH ══ */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5">
          <FadeUp className="mb-14 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-400">Ce que dit la recherche</p>
            <h2 className="text-4xl font-bold">Le TDAH touche des millions d'enfants</h2>
            <p className="mt-2 text-sm text-white/38">Sources vérifiables : HAS · DSM-5 · Inserm · CNED</p>
          </FadeUp>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard value={5} suffix="%" label="des enfants scolarisés ont un TDAH" source="HAS, 2014" delay={0} color="blue" />
            <StatCard value={3} suffix="x" label="plus de risque de décrochage scolaire" source="Inserm, 2019" delay={150} color="violet" />
            <StatCard value={67} suffix="%" label="ont des difficultés en lecture/maths" source="DSM-5, 2013" delay={300} color="emerald" />
            <StatCard value={40} suffix="%" label="d'amélioration avec accompagnement structuré" source="CNED / HAS, 2022" delay={450} color="amber" />
          </div>
          {/* Citations */}
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[
              { quote: "Les enfants TDAH ont besoin d'instructions courtes, séquencées et de feedback immédiat pour maintenir leur attention et progresser.", author: "HAS", ref: "Trouble déficit de l'attention avec ou sans hyperactivité, 2014" },
              { quote: "La méthode socratique, qui guide sans donner les réponses, favorise la métacognition et l'autonomie — bénéfique pour tous, indispensable pour les profils DYS et TDAH.", author: "Rev. fr. de pédagogie", ref: "n°196, 2016" },
            ].map((c, i) => (
              <FadeUp key={i} delay={i * 100}>
                <blockquote className="h-full rounded-2xl border border-white/8 bg-white/3 p-6">
                  <p className="mb-4 text-sm italic leading-relaxed text-white/65">"{c.quote}"</p>
                  <footer className="text-xs text-white/30">— <strong className="text-white/50">{c.author}</strong>, <em>{c.ref}</em></footer>
                </blockquote>
              </FadeUp>
            ))}
          </div>
          {/* Sources détaillées */}
          <FadeUp delay={100} className="mt-10">
            <div className="rounded-2xl border border-white/8 bg-white/2 p-6">
              <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-white/30">Rapports & sources scientifiques</p>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { org: "HAS", year: "2014", color: "blue", title: "TDAH — Trouble déficit attention", key: "Consignes brèves, séquencées, feedback immédiat.", url: "https://www.has-sante.fr/jcms/c_1362928" },
                  { org: "Inserm", year: "2019", color: "violet", title: "TDAH — Rapport de synthèse", key: "5–8% des enfants d'âge scolaire concernés.", url: "https://www.inserm.fr/dossier/tdah-trouble-deficit-attention-hyperactivite/" },
                  { org: "DSM-5", year: "2013", color: "emerald", title: "Manuel diagnostique statistique", key: "67% des cas présentent des difficultés scolaires.", url: "https://www.psychiatry.org/psychiatrists/practice/dsm" },
                  { org: "Rev. fr. pédagogie", year: "2016", color: "amber", title: "Méthode socratique & apprentissage", key: "Rétention 2× meilleure par questionnement guidé.", url: "https://journals.openedition.org/rfp/" },
                  { org: "CNED / MEN", year: "2022", color: "rose", title: "Accompagnement numérique personnalisé", key: "40% d'amélioration avec numérique structuré.", url: "https://www.cned.fr" },
                ].map((s) => {
                  const cls: Record<string, string> = { blue: "border-blue-500/20 bg-blue-500/5 text-blue-400", violet: "border-violet-500/20 bg-violet-500/5 text-violet-400", emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400", amber: "border-amber-500/20 bg-amber-500/5 text-amber-400", rose: "border-rose-500/20 bg-rose-500/5 text-rose-400" };
                  return (
                    <div key={s.org} className={`rounded-xl border p-4 ${cls[s.color]}`}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold">{s.org} · {s.year}</span>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-white/25 hover:text-white/60 underline">↗ Source</a>
                      </div>
                      <p className="mb-1 text-sm font-medium text-white/75">{s.title}</p>
                      <p className="text-xs text-white/45 leading-relaxed">{s.key}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══ SECTION DÉMO VIDÉO / INTERACTIVE ══ */}
      <section id="demo" className="border-y border-white/6 bg-white/2 py-24">
        <div className="mx-auto max-w-7xl px-5">
          <FadeUp className="mb-14 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-400">Voir en action</p>
            <h2 className="text-4xl font-bold">Teste la démo interactive</h2>
            <p className="mt-3 text-white/45">Change de scénario, active le mode TDAH — c'est exactement ce que voit ton enfant.</p>
          </FadeUp>
          <div className="grid items-start gap-12 lg:grid-cols-2">
            {/* Démo interactive */}
            <FadeUp>
              <div className="flex flex-col gap-4">
                {/* Toggle TDAH */}
                <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Mode TDAH activé</p>
                    <p className="text-xs text-white/40">Interface épurée, pas d'animations</p>
                  </div>
                  <button onClick={() => setTdahPreview(!tdahPreview)} className={`relative h-6 w-11 rounded-full transition-colors ${tdahPreview ? "bg-violet-500" : "bg-white/15"}`}>
                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${tdahPreview ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                <ChatDemo tdahMode={tdahPreview} />
              </div>
            </FadeUp>
            {/* Placeholder vidéo */}
            <FadeUp delay={100}>
              <div>
                <p className="mb-4 text-sm font-semibold text-white/50">📹 Vidéo de démonstration</p>
                <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl">
                  <div className="relative aspect-video flex items-center justify-center bg-gradient-to-br from-[#0d1520] to-[#0a1228]">
                    <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.15) 0%, transparent 65%)" }} />
                    {/* Faux chat en fond */}
                    <div className="absolute inset-8 rounded-xl border border-white/5 bg-white/2 opacity-25">
                      <div className="m-5 space-y-3">
                        {[[70, false], [55, true], [80, false], [45, true]].map(([w, right], i) => (
                          <div key={i} className={`h-5 rounded-full bg-white/15 ${right ? "ml-auto" : ""}`} style={{ width: `${w}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/20 bg-white/8 backdrop-blur-sm transition-all group-hover:scale-110 group-hover:border-blue-500/50">
                        <span className="text-2xl">▶</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/80">Vidéo de présentation</p>
                        <p className="mt-1 text-xs text-white/35">En cours de tournage · Bientôt disponible</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/8 bg-white/2 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                      <span className="text-xs text-white/45">Bêta ouverte · Sans carte</span>
                    </div>
                    <Link href="/signup" className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500">Essayer →</Link>
                  </div>
                </div>
                {/* 4 features vignettes */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[["💬", "Chat pédagogique"], ["🔴", "Mots-clés + tooltip"], ["📷", "Photo du devoir"], ["🧠", "Mode TDAH"]].map(([icon, label]) => (
                    <div key={label} className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                      <span className="text-lg">{icon}</span>
                      <span className="text-xs font-medium text-white/60">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══ COMMENT ÇA MARCHE ══ */}
      <section id="comment-ca-marche" className="py-24">
        <div className="mx-auto max-w-7xl px-5">
          <FadeUp className="mb-16 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-400">Simple comme bonjour</p>
            <h2 className="text-4xl font-bold">3 étapes, et ton enfant comprend</h2>
          </FadeUp>
          <div className="relative grid gap-8 md:grid-cols-3">
            <div className="absolute top-8 left-[16%] right-[16%] hidden h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent md:block" />
            {[
              { n: "01", icon: "📷", title: "Prends le devoir en photo", desc: "Photographiez la feuille ou le cahier. L'IA reconnaît l'énoncé, les chiffres, les consignes — même manuscrits." },
              { n: "02", icon: "💡", title: "L'IA surligne et explique", desc: "Les mots importants s'allument en rouge. Au survol, une mini-leçon s'affiche : définition + exemple concret du quotidien." },
              { n: "03", icon: "✍️", title: "Ton enfant répond seul", desc: "L'IA pose des questions, suggère des pistes. Elle ne donne jamais la réponse. L'enfant trouve — et s'en souvient." },
            ].map((step, i) => (
              <FadeUp key={step.n} delay={i * 120}>
                <div className="relative rounded-2xl border border-white/8 bg-white/3 p-8 text-center hover:border-blue-500/25 transition-colors">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border border-blue-500/40 bg-[#060c18] px-3 py-1 text-xs font-bold text-blue-400">{step.n}</div>
                  <div className="mb-4 mt-2 text-4xl">{step.icon}</div>
                  <h3 className="mb-3 text-lg font-bold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{step.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
          {/* Niveaux */}
          <FadeUp delay={200} className="mt-12">
            <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
              <p className="mb-5 text-center text-sm font-semibold text-blue-300">Adapté à chaque niveau du primaire</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {[["CP", "Lecture, petits calculs"], ["CE1", "Addition, conjugaison"], ["CE2", "Multiplication, grammaire"], ["CM1", "Fractions, rédaction"], ["CM2", "Prépa collège"]].map(([level, focus]) => (
                  <div key={level} className="rounded-xl border border-white/8 bg-white/4 p-3 text-center">
                    <p className="text-base font-bold text-blue-400">{level}</p>
                    <p className="mt-1 text-xs text-white/40">{focus}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══ CTA INTERMÉDIAIRE ══ */}
      {!hasAccess && (
      <div className="border-y border-blue-500/15 bg-blue-500/5 py-12">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="mb-4 text-lg font-semibold text-white/80">{trialExpired ? "Votre essai est terminé. Continuez avec un abonnement." : "Prêt à voir la différence ? Commence gratuitement."}</p>
          <Link href={trialExpired ? "/pricing" : "/signup"} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 hover:scale-[1.02]">
            {trialExpired ? "Voir les abonnements →" : "Essai gratuit — sans carte →"}
          </Link>
        </div>
      </div>
      )}

      {/* ══ SECTION TDAH APPROFONDIE ══ */}
      <section id="tdah" className="py-24">
        <div className="mx-auto max-w-7xl px-5">
          <FadeUp className="mb-14 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-400">🧠 Pensé pour le TDAH</div>
            <h2 className="text-4xl font-bold">Un outil conçu pour les cerveaux qui fonctionnent différemment</h2>
            <p className="mt-4 max-w-2xl mx-auto text-white/50 leading-relaxed">Les enfants TDAH ont besoin d'un environnement structuré, de consignes courtes et de feedback immédiat. MentorIA est conçu pour ça — pas en option, au cœur du produit.</p>
          </FadeUp>
          <div className="grid items-start gap-10 lg:grid-cols-2">
            {/* Features */}
            <FadeUp>
              <div className="space-y-4">
                {[
                  { icon: "✂️", title: "Consignes découpées en micro-étapes", desc: "Jamais plus de 2 lignes par bulle. Une seule action à la fois. Aucune surcharge cognitive." },
                  { icon: "⚡", title: "Feedback immédiat et bienveillant", desc: "L'encouragement arrive dès que l'enfant tente, pas seulement quand il réussit." },
                  { icon: "👁️", title: "Interface épurée en mode TDAH", desc: "Pas d'animations distrayantes, fond neutre, contraste fort, zéro pop-up." },
                  { icon: "🔁", title: "Répétition intelligente", desc: "L'IA se souvient des difficultés précédentes et y revient naturellement dans la session." },
                  { icon: "🎯", title: "Un seul objectif à la fois", desc: "Chaque bulle = une seule tâche. L'enfant ne se perd jamais dans la complexité." },
                  { icon: "🌡️", title: "Détection de la frustration", desc: "Si l'enfant bloque, l'IA reformule différemment — pas la même explication en boucle." },
                ].map((f, i) => (
                  <FadeUp key={f.title} delay={i * 60}>
                    <div className="flex gap-4 rounded-xl border border-white/8 bg-white/3 p-4 hover:border-violet-500/25 transition-colors">
                      <span className="text-2xl">{f.icon}</span>
                      <div>
                        <p className="text-sm font-semibold">{f.title}</p>
                        <p className="mt-0.5 text-xs text-white/42 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  </FadeUp>
                ))}
              </div>
            </FadeUp>
            {/* Comparaison Normal / TDAH */}
            <FadeUp delay={150}>
              <div className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden">
                <div className="grid grid-cols-2">
                  {["Mode standard", "Mode TDAH"].map((mode, i) => (
                    <div key={mode} className={`px-5 py-3 text-center text-sm font-semibold ${i === 1 ? "bg-violet-500/15 text-violet-300" : "text-white/60"}`}>{mode}</div>
                  ))}
                </div>
                <div className="divide-y divide-white/6">
                  {[
                    ["Animations smooth", "Animations désactivées"],
                    ["Opacité messages anciens", "Tous les messages visibles"],
                    ["Fond dégradé animé", "Fond neutre statique"],
                    ["Bulles 1–4 lignes", "Bulles max 2 lignes"],
                    ["Encouragement groupé", "Encouragement à chaque étape"],
                    ["Tooltip au survol", "Tooltip + fond mis en avant"],
                  ].map(([std, tdah]) => (
                    <div key={std} className="grid grid-cols-2 divide-x divide-white/6">
                      <div className="px-4 py-3 text-xs text-white/45">{std}</div>
                      <div className="bg-violet-500/5 px-4 py-3 text-xs text-violet-300/80">{tdah}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══ FEATURES GRID ══ */}
      <section className="border-y border-white/6 bg-white/2 py-24">
        <div className="mx-auto max-w-7xl px-5">
          <FadeUp className="mb-16 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-400">Fonctionnalités</p>
            <h2 className="text-4xl font-bold">Ce que l'IA fait — et ne fera jamais</h2>
            <p className="mt-3 text-white/40">Un copilote pédagogique, pas une machine à tricher.</p>
          </FadeUp>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "🧠", badge: "Pédagogie", title: "Méthode socratique", desc: "Guide par questions, reformule l'énoncé, rappelle la règle. Ne remplit jamais la case à la place de l'enfant." },
              { icon: "🔴", badge: "Innovation", title: "Mots-clés interactifs", desc: "Les termes importants sont surlignés. Au survol : définition niveau CE1 + exemple concret du quotidien." },
              { icon: "📷", badge: "IA", title: "Photo du devoir", desc: "Photographiez la feuille. L'IA reconnaît l'énoncé, les chiffres, les consignes — même manuscrits." },
              { icon: "🎯", badge: "Personnalisation", title: "Adapté au niveau", desc: "Langage CP pour les petits, structure CM2 pour les grands. L'objectif : qu'il comprenne vraiment." },
              { icon: "🔒", badge: "Sécurité", title: "Cadré scolaire", desc: "Si la question sort des devoirs (Fortnite, films…), l'IA redirige poliment. Zéro distraction garantie." },
              { icon: "📚", badge: "Complet", title: "Toutes matières", desc: "Maths, français, conjugaison, histoire-géo, sciences. L'IA s'adapte automatiquement au contenu envoyé." },
            ].map((f, i) => (
              <FadeUp key={f.title} delay={i * 60}>
                <div className="group h-full rounded-2xl border border-white/8 bg-white/3 p-6 transition-all hover:border-blue-500/30 hover:bg-white/5">
                  <div className="mb-4 flex items-start justify-between">
                    <span className="text-3xl">{f.icon}</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/28">{f.badge}</span>
                  </div>
                  <h3 className="mb-2 text-base font-bold transition-colors group-hover:text-blue-300">{f.title}</h3>
                  <p className="text-sm text-white/48 leading-relaxed">{f.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TÉMOIGNAGES ══ */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5">
          <FadeUp className="mb-14 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-400">Ils l'ont testé</p>
            <h2 className="text-4xl font-bold">Ce que disent les parents</h2>
            <p className="mt-3 text-white/40">Des familles en bêta depuis janvier 2026.</p>
          </FadeUp>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { name: "Sophie M.", role: "Maman de Lucas, CE2", avatar: "S", color: "blue", stars: 5, text: "Mon fils détestait les devoirs. Avec MentorIA, il pose des questions lui-même. Il a compris qu'il peut trouver les réponses — il n'a plus besoin qu'on lui mâche le travail.", tag: "Autonomie" },
              { name: "Thomas K.", role: "Papa de Léa, CM1 · TDAH", avatar: "T", color: "violet", stars: 5, text: "Le mode TDAH change tout. Les bulles courtes, pas d'animation qui distrait. Léa reste concentrée 20 minutes là où elle décrochait après 3. C'est concret, ça marche.", tag: "TDAH" },
              { name: "Amina R.", role: "Maman de Yassin, CP", avatar: "A", color: "emerald", stars: 5, text: "J'avais peur que ce soit une machine à donner les réponses. C'est l'inverse. L'IA pose des questions, guide doucement. Mon fils est fier quand il trouve seul.", tag: "Confiance" },
            ].map((t, i) => {
              const cls: Record<string, string> = { blue: "bg-blue-600", violet: "bg-violet-600", emerald: "bg-emerald-600" };
              const tagCls: Record<string, string> = { blue: "text-blue-400 border-blue-500/30 bg-blue-500/8", violet: "text-violet-400 border-violet-500/30 bg-violet-500/8", emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-500/8" };
              return (
                <FadeUp key={t.name} delay={i * 100}>
                  <div className="flex h-full flex-col rounded-2xl border border-white/8 bg-white/3 p-6 hover:border-white/15 transition-colors">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-yellow-400 text-sm">{"★".repeat(t.stars)}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tagCls[t.color]}`}>{t.tag}</span>
                    </div>
                    <p className="mb-5 flex-1 text-sm leading-relaxed text-white/62 italic">"{t.text}"</p>
                    <div className="flex items-center gap-3 border-t border-white/8 pt-4">
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${cls[t.color]} text-sm font-bold`}>{t.avatar}</div>
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-white/30">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </FadeUp>
              );
            })}
          </div>
          {/* Metric bar */}
          <FadeUp delay={200} className="mt-12">
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4 rounded-2xl border border-white/8 bg-white/3 p-6">
              {[["4,8/5", "Satisfaction parents"], ["320+", "Familles en bêta"], ["12", "Écoles partenaires"], ["94%", "Recommanderaient"]].map(([val, label]) => (
                <div key={label} className="text-center">
                  <p className="text-3xl font-extrabold text-white">{val}</p>
                  <p className="mt-1 text-xs text-white/38">{label}</p>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══ TARIFS ══ */}
      <section id="tarifs" className="border-y border-white/6 bg-white/2 py-24">
        <div className="mx-auto max-w-5xl px-5">
          <FadeUp className="mb-16 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-400">Tarifs</p>
            <h2 className="text-4xl font-bold">Des soirées devoirs plus sereines</h2>
            <p className="mt-3 text-white/38">Commencez par 1 jour d'essai — sans carte bancaire en bêta.</p>
          </FadeUp>
          <div className="grid gap-6 md:grid-cols-3">
            <FadeUp delay={0}>
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/3 p-7">
                <p className="mb-1 text-sm font-semibold text-white/45">Essai gratuit</p>
                <div className="mb-1 text-5xl font-extrabold">0€</div>
                <p className="mb-5 text-xs text-white/28">1 jour · Sans engagement</p>
                <ul className="mb-8 flex-1 space-y-2.5 text-sm text-white/55">
                  {["Accès complet", "Photo de devoir", "IA pédagogique illimitée"].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="text-emerald-400">✓</span>{f}</li>
                  ))}
                </ul>
                <Link href="/signup" className="block w-full rounded-xl border border-white/15 py-3 text-center text-sm font-semibold text-white/65 hover:border-white/30 hover:text-white transition-colors" style={{ display: hasAccess ? 'none' : undefined }}>
                  {trialExpired ? "S'abonner →" : "Commencer l'essai →"}
                </Link>
              </div>
            </FadeUp>
            <FadeUp delay={80}>
              <div className="relative flex h-full flex-col rounded-2xl border-2 border-blue-500 bg-blue-600/8 p-7 shadow-lg shadow-blue-500/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-4 py-1 text-xs font-bold">Recommandé</div>
                <p className="mb-1 text-sm font-semibold text-blue-300">Abonnement mensuel</p>
                <div className="mb-1 flex items-end gap-1"><span className="text-5xl font-extrabold">14,90€</span><span className="mb-1.5 text-sm text-white/38">/mois</span></div>
                <p className="mb-5 text-xs text-white/28">Pour un suivi toute l'année</p>
                <ul className="mb-8 flex-1 space-y-2.5 text-sm text-white/68">
                  {["Aide illimitée pour un enfant", "Historique pédagogique", "Profil TDAH optimisé", "Annulable à tout moment"].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="text-blue-400">✓</span>{f}</li>
                  ))}
                </ul>
                <Link href="/pricing" className="block w-full rounded-xl bg-blue-600 py-3 text-center text-sm font-bold text-white hover:bg-blue-500 transition-colors" style={{ display: hasAccess ? 'none' : undefined }}>
                  {trialExpired ? "Choisir ce plan →" : "Commencer l'essai gratuit →"}
                </Link>
              </div>
            </FadeUp>
            <FadeUp delay={160}>
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/3 p-7">
                <p className="mb-1 text-sm font-semibold text-white/45">Formule sérénité</p>
                <div className="mb-1 flex items-end gap-1"><span className="text-5xl font-extrabold">80€</span><span className="mb-1.5 text-sm text-white/38">une fois</span></div>
                <p className="mb-5 text-xs text-white/28">Accès à vie pour un enfant</p>
                <ul className="mb-8 flex-1 space-y-2.5 text-sm text-white/55">
                  {["Tout l'abonnement mensuel", "À vie sans renouvellement", "Idéal CP → CM2"].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="text-violet-400">✓</span>{f}</li>
                  ))}
                </ul>
                <Link href="/signup" className="block w-full rounded-xl border border-white/15 py-3 text-center text-sm font-semibold text-white/65 hover:border-white/30 hover:text-white transition-colors">Choisir cette formule →</Link>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section className="relative mx-auto max-w-4xl px-5 py-28 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(59,130,246,0.12) 0%, transparent 70%)" }} />
        <FadeUp>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" /> Bêta ouverte · Sans carte bancaire
          </div>
          <h2 className="mb-4 text-4xl font-extrabold leading-tight lg:text-5xl">
            Prêt à transformer<br />les soirées devoirs ?
          </h2>
          <p className="mb-8 text-lg text-white/42">Rejoignez les 320+ familles qui font confiance à MentorIA.</p>
          {hasAccess ? (
            <Link href="/dashboard" className="inline-flex items-center gap-3 rounded-xl bg-blue-600 px-10 py-4 text-lg font-bold text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/25 hover:scale-[1.03]">
              Accéder à mon tableau de bord →
            </Link>
          ) : (
            <>
              <Link href={trialExpired ? "/pricing" : "/signup"} className="inline-flex items-center gap-3 rounded-xl bg-blue-600 px-10 py-4 text-lg font-bold text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/25 hover:scale-[1.03]">
                {trialExpired ? "Choisir un abonnement →" : "Commencer l'essai gratuit — 0€ →"}
              </Link>
              {!trialExpired && <p className="mt-4 text-xs text-white/22">Sans carte bancaire · Annulable à tout moment · Données protégées</p>}
            </>
          )}
          {/* Mini trust */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            {["🛡️ RGPD compliant", "🇫🇷 Hébergé en France", "🔒 Données chiffrées", "👨‍👩‍👧 Adapté 6–11 ans"].map(b => (
              <span key={b} className="text-xs text-white/28">{b}</span>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-white/6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-xs text-white/22 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">M</div>
            <span>MentorIA © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <a href="/mentions-legales" className="hover:text-white/55 transition-colors">Mentions légales</a>
            <a href="/confidentialite" className="hover:text-white/55 transition-colors">Confidentialité</a>
            <a href="/cgv" className="hover:text-white/55 transition-colors">CGV</a>
            <a href="mailto:contact@mentoria.fr" className="hover:text-white/55 transition-colors">Contact</a>
          </div>
          <p>Fait avec ❤️ pour les enfants qui apprennent différemment</p>
        </div>
      </footer>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}

export default function LandingClient() {
  return (
    <Suspense fallback={null}>
      <LandingClientInner />
    </Suspense>
  );
}
