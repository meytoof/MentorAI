import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIDrawingResponse } from "@/types/drawing";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const LLM_API_URL = process.env.LLAMA_API_URL ?? "";
const LLM_MODEL = process.env.LLAMA_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct";
const LLM_API_KEY = process.env.LLAMA_API_KEY ?? "";

const SYSTEM_PROMPT = `Tu es MentorIA, un assistant pédagogique bienveillant pour enfants du primaire (CP–CM2).
Tu réponds UNIQUEMENT en français. Tu tutoies TOUJOURS l'enfant (jamais de "vous").

RÈGLE ABSOLUE N°1 : Ne donne JAMAIS la réponse finale. Guide par étapes (méthode socratique).
RÈGLE ABSOLUE N°2 : Tu parles UNIQUEMENT de sujets scolaires (maths, français, histoire, géographie, sciences). Si la question n'est pas scolaire, réponds avec une seule bulle pour recentrer gentiment.
RÈGLE ABSOLUE N°3 : Chaque bulle doit apporter une action concrète et SPÉCIFIQUE que l'enfant peut faire immédiatement.

FORMAT DE RÉPONSE : JSON uniquement, aucun texte avant ou après.

{
  "bubbles": ["message étape 1", "message étape 2"],
  "encouragement": "Phrase courte d'encouragement",
  "segments": [
    { "id": "s1", "text": "mot clé", "shortTip": "explication courte 1 phrase", "lesson": "explication 1-2 phrases" }
  ]
}

═══ RÈGLES PHOTO DE DEVOIR (PRIORITÉ ABSOLUE quand une image est fournie) ═══
Quand une image de devoir est envoyée, tu DOIS impérativement :
1. LIRE et ANALYSER chaque exercice visible dans l'image en détail (texte, nombres, questions, consignes)
2. IDENTIFIER le type de chaque exercice (calcul, conjugaison, dictée, problème, géométrie, etc.)
3. Dans tes bulles, CITER le contenu réel vu dans l'image : les vrais nombres, les vrais mots, les vraies consignes
4. Donner UN indice pédagogique SPÉCIFIQUE par exercice identifié
5. JAMAIS écrire des phrases vagues comme "effectue les calculs dans les cases" ou "lis bien l'exercice"
   Au lieu de ça → "Pour la multiplication 7 × 8, pense à la table de 7 : 7, 14, 21..."
   Au lieu de ça → "Pour compléter 'il fini__', demande-toi si le verbe est à l'infinitif ou au participe"
6. Si plusieurs exercices (ex 1, ex 2, ex 3), fais UNE bulle par exercice avec son indice spécifique

═══ RÈGLES bubbles (texte) ═══
- 2 à 4 bulles maximum selon le nombre d'exercices
- Entoure les mots-clés pédagogiques avec <red>mot</red> (ex: <red>multiplicande</red>, <red>accord</red>)
- Pour les exemples de calcul ou conjugaison : <example>7×1=7, 7×2=14, 7×3=21...</example>
- Pour MATHS CALCUL : rappelle la technique concrète avec les vrais nombres de l'exercice
- Pour CONJUGAISON : cite les vraies formes manquantes de l'exercice et donne le modèle
- Pour GRAMMAIRE/ORTHOGRAPHE : cite la vraie phrase de l'exercice, applique la règle dessus
- Pour HORS-SUJET : UNE seule bulle pour recentrer avec bienveillance
- Pour profil TDAH : bulles encore plus courtes, 1 seule action par bulle, pas de listes

═══ RÈGLES segments — OBLIGATOIRE ═══
- Tu DOIS créer exactement un segment pour CHAQUE mot mis entre <red></red>
- Le champ "text" doit correspondre MOT POUR MOT au contenu entre <red> et </red>
- shortTip : définition ultra-simple en 1 phrase niveau CE1
- lesson : explication en 2 phrases avec exemple concret du quotidien
- Ne jamais laisser un mot en <red> sans son segment correspondant`;

function detectSubject(text: string): string {
  if (/\d+\s*[+\-*/×÷x]\s*\d+/.test(text)) return "maths-calcul";
  if (/partag|divis|multipli|addition|soustrai|calcul|combien|fois|bonbon|pomme|élève|problème/i.test(text)) return "maths-calcul";
  if (/fraction|géométrie|périmètre|aire|angle|triangle|cercle|rectangle|carré/i.test(text)) return "maths-geo";
  if (/conjugu|verbe|grammaire|orthographe|accord|pluriel|adjectif|adverbe|déterminant|présent|passé|futur|imparfait|participe/i.test(text)) return "francais";
  if (/histoire|date|guerre|révolution|roi|reine|empire|siècle|période/i.test(text)) return "histoire";
  if (/géographie|pays|ville|fleuve|montagne|capitale|continent|région/i.test(text)) return "geo";
  if (/science|animal|plante|corps|énergie|matière|vivant|oxygène/i.test(text)) return "sciences";
  return "general";
}

function parseAIResponse(raw: string): AIDrawingResponse | null {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    const bubbles: string[] = Array.isArray(parsed.bubbles)
      ? parsed.bubbles.filter((b: unknown) => typeof b === "string" && b.trim().length > 5)
      : [];
    if (bubbles.length === 0) return null;
    const hint = bubbles.join(" ");
    const redMatches = hint.match(/<red>(.*?)<\/red>/g);
    return {
      messageBubbles: bubbles,
      messageEnfant: hint,
      hint,
      drawing: { steps: [] },
      encouragement: typeof parsed.encouragement === "string" ? parsed.encouragement : undefined,
      keyPoints: redMatches ? redMatches.map((t) => t.replace(/<\/?red>/g, "").trim()) : [],
      segments: Array.isArray(parsed.segments) ? parsed.segments : [],
    };
  } catch {
    return null;
  }
}

function buildFallback(): AIDrawingResponse {
  return {
    messageBubbles: ["Je n'ai pas bien compris. Peux-tu reformuler ?", "Tu peux aussi envoyer une photo de ton devoir !"],
    messageEnfant: "Je n'ai pas bien compris. Peux-tu reformuler ?",
    hint: "Reformule ta question.",
    drawing: { steps: [] },
    encouragement: "On va y arriver ensemble !",
    keyPoints: [],
  };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    const body = await request.json();
    const { question, image } = body;
    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json({ error: "Question invalide" }, { status: 400 });
    }
    if (!LLM_API_URL || !LLM_API_KEY) {
      console.error("❌ LLAMA_API_URL ou LLAMA_API_KEY manquant dans .env");
      return NextResponse.json({ error: "Configuration IA manquante" }, { status: 500 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, isTdah: true },
    });

    // Historique même matière uniquement
    const currentSubject = detectSubject(question);
    let relevantHistory: Array<{ question: string; hint: string }> = [];
    try {
      const allHistory = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { question: true, hint: true },
      });
      relevantHistory = allHistory
        .filter((h) => detectSubject(h.question) === currentSubject)
        .slice(0, 3)
        .reverse();
    } catch { /* non bloquant */ }

    // Construction du message utilisateur
    let userText = "";
    if (user?.name) userText += `L'enfant s'appelle ${user.name}.\n`;
    if (user?.isTdah) userText += `Profil TDAH : oui. Bulles très courtes, 1 action par bulle.\n`;
    if (relevantHistory.length > 0) {
      userText += `\nDernières questions (même matière) :\n`;
      relevantHistory.forEach((h, i) => {
        userText += `${i + 1}. Q: "${h.question}" → Indice: "${h.hint.slice(0, 80)}..."\n`;
      });
      userText += `Continue la progression pédagogique.\n`;
    }
    userText += `\nQUESTION : ${question}`;

    const hasImage = image && typeof image === "string";
    if (hasImage) {
      userText += `\n\n⚠️ CONSIGNE CRITIQUE — IMAGE FOURNIE :
Lis l'image avec une attention maximale. Identifie CHAQUE exercice visible et son contenu exact (numéros, mots, consignes).
Dans tes bulles, cite les éléments RÉELS de l'image (les vrais chiffres, les vrais mots, les vraies phrases).
Chaque bulle doit mentionner un exercice spécifique avec son contenu réel, pas des généralités.`;
    }

    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: userText },
    ];
    if (hasImage) {
      userContent.push({ type: "image_url", image_url: { url: image } });
    }

    // Appel LLM
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    let aiResponse: AIDrawingResponse;

    try {
      const res = await fetch(LLM_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_API_KEY}` },
        body: JSON.stringify({
          model: LLM_MODEL,
          stream: false,
          temperature: hasImage ? 0.4 : 0.3,
          max_tokens: hasImage ? 1400 : 900,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const err = await res.text();
        console.error(`❌ LLM ${res.status}:`, err.slice(0, 200));
        throw new Error(`LLM error ${res.status}`);
      }

      const data = await res.json();
      const rawText: string = data.choices?.[0]?.message?.content ?? data.response ?? "";
      console.log("📥 LLM raw:", rawText.slice(0, 200));
      aiResponse = parseAIResponse(rawText) ?? buildFallback();
    } catch (err) {
      clearTimeout(timeout);
      console.error("❌ Erreur LLM:", err);
      aiResponse = buildFallback();
    }

    // Sauvegarde non bloquante
    prisma.conversation.create({
      data: {
        userId,
        question: question.slice(0, 500),
        hint: (aiResponse.hint ?? "").slice(0, 1000),
        drawing: null,
        encouragement: aiResponse.encouragement ?? null,
      },
    }).catch((e: unknown) => console.warn("DB save failed:", e));

    return NextResponse.json(aiResponse);
  } catch (e) {
    console.error("❌ API error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
