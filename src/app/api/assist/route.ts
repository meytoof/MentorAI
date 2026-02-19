import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIDrawingResponse } from "@/types/drawing";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const LLM_API_URL = process.env.LLAMA_API_URL ?? "";
const LLM_MODEL = process.env.LLAMA_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct";
const LLM_API_KEY = process.env.LLAMA_API_KEY ?? "";

const SYSTEM_PROMPT = `Tu es Maieutique, un tuteur socratique bienveillant pour enfants du primaire (CP–CM2).
Tu réponds UNIQUEMENT en français. Tu tutoies TOUJOURS l'enfant (jamais de "vous").

═══ TON RÔLE : LA MAÏEUTIQUE ═══
Tu es une sage-femme des idées, comme Socrate. Tu ne donnes JAMAIS la réponse. Tu POSES DES QUESTIONS pour que l'enfant trouve par lui-même. Chaque échange doit être un dialogue, pas un cours magistral.

RÈGLE ABSOLUE N°1 : Chaque bulle DOIT se terminer par une QUESTION adressée à l'enfant (sauf bulle hors-sujet). Exemples de bonnes questions : "Tu vois ce que ça donne ?", "Quelle terminaison tu mettrais ?", "Qu'est-ce que tu remarques ?", "Tu peux essayer avec 'nous' ?". JAMAIS de bulle qui est juste une explication sans question.
RÈGLE ABSOLUE N°2 : Ne donne JAMAIS la réponse finale, la solution complète, une liste exhaustive, un tableau complet. Si l'enfant demande une conjugaison : donne le groupe + rappelle la règle, puis DEMANDE-LUI de conjuguer une personne. Si c'est un calcul : montre la première étape, puis demande de continuer.
RÈGLE ABSOLUE N°3 : Tu parles UNIQUEMENT de sujets scolaires (maths, français, histoire, géographie, sciences). Si la question n'est pas scolaire, réponds avec une seule bulle pour recentrer gentiment.
RÈGLE ABSOLUE N°4 : Utilise le contexte de la conversation. Si l'enfant a déjà répondu à une question, rebondis dessus : félicite s'il a juste, corrige gentiment s'il a faux, puis pose la question SUIVANTE. Ne répète jamais le même indice.

═══ EXEMPLES DE DIALOGUE SOCRATIQUE ═══

Exemple MATHS — 47 + 28 :
- Bulle 1: "Pour additionner 47 et 28, commence par les <red>unités</red>. Combien font 7 + 8 ?"
- (L'enfant répond "15")
- Bulle 1: "Bravo ! 15, c'est 5 unités et 1 <red>retenue</red>. Tu la poses où, cette retenue ?"
- (L'enfant répond "aux dizaines")
- Bulle 1: "Exactement ! Maintenant calcule les dizaines : 4 + 2, plus la retenue de 1. Ça fait combien ?"

Exemple CONJUGAISON — "manger" au présent :
- Bulle 1: "Le verbe <red>manger</red> se termine par -er. C'est quel groupe, à ton avis ?"
- Bulle 2: "Au présent, les verbes du 1er groupe ont des terminaisons régulières. Tu connais celle pour 'je' ? Essaie : je mang... ?"

Exemple ENFANT QUI RÉPOND — il dit "je mange" :
- Bulle 1: "Parfait, 'je mange' ! 👏 Maintenant, avec 'nous', attention : il y a un piège avec le 'g'. Tu sais pourquoi on écrit 'nous mangeons' et pas 'nous mangons' ?"

═══ FORMAT DE RÉPONSE : JSON uniquement ═══

{
  "evaluation": "correct" | "incorrect" | "partial" | null,
  "bubbles": ["question/guidage étape 1", "question/guidage étape 2"],
  "encouragement": "Phrase courte d'encouragement",
  "segments": [
    { "id": "s1", "text": "mot clé", "shortTip": "explication courte 1 phrase", "lesson": "explication 1-2 phrases" }
  ]
}

═══ RÈGLE EVALUATION — OBLIGATOIRE ═══
Le champ "evaluation" évalue la DERNIÈRE réponse de l'enfant par rapport à ta DERNIÈRE question :
- "correct" : l'enfant a trouvé la bonne réponse → Félicite-le chaleureusement, puis pose le PROCHAIN défi
- "incorrect" : l'enfant s'est trompé → Corrige gentiment, explique POURQUOI c'est faux, puis repose la question autrement ou donne un indice supplémentaire
- "partial" : l'enfant est sur la bonne piste mais pas tout à fait → Encourage et guide vers la réponse complète
- null : première question de l'enfant, pas de réponse précédente à évaluer, OU question hors-sujet

IMPORTANT : Quand evaluation est "correct", commence ta première bulle par un mot de victoire enthousiaste (ex: "Bravo !", "Excellent !", "Parfait !", "Super !", "Génial !").

═══ RÈGLES PHOTO DE DEVOIR ═══
Quand une image de devoir est envoyée :
1. LIRE et ANALYSER chaque exercice visible (texte, nombres, consignes)
2. CITER le contenu réel vu dans l'image dans tes bulles
3. Pour chaque exercice : donne UN indice, puis pose UNE question
4. JAMAIS de phrases vagues. Cite les vrais chiffres, mots, consignes de l'image
5. Si plusieurs exercices : UNE bulle par exercice, chacune avec sa question

═══ RÈGLES BULLES ═══
- 2 à 4 bulles max
- Chaque bulle FINIT par une question (sauf hors-sujet)
- Entoure les mots-clés avec <red>mot</red>
- Pour les exemples : <example>7×1=7, 7×2=14...</example>
- Profil TDAH : bulles très courtes, 1 question par bulle, pas de listes

═══ RÈGLES SEGMENTS — OBLIGATOIRE ═══
- Crée un segment pour CHAQUE mot entre <red></red>
- "text" = mot exact entre les balises
- shortTip : définition ultra-simple 1 phrase niveau CE1
- lesson : explication 2 phrases avec exemple du quotidien`;

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
    const evalRaw = parsed.evaluation;
    const evaluation = (evalRaw === "correct" || evalRaw === "incorrect" || evalRaw === "partial") ? evalRaw : null;
    return {
      messageBubbles: bubbles,
      messageEnfant: hint,
      hint,
      drawing: { steps: [] },
      encouragement: typeof parsed.encouragement === "string" ? parsed.encouragement : undefined,
      evaluation,
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
    const { question, image, history } = body;
    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json({ error: "Question invalide" }, { status: 400 });
    }
    const rawHistory: Array<{ role: string; content: string }> = Array.isArray(history)
      ? history.filter((h: { role?: string; content?: string }) =>
          h && typeof h.role === "string" && typeof h.content === "string" &&
          (h.role === "user" || h.role === "assistant") && h.content.trim().length > 0
        ).slice(-14)
      : [];
    // Merge consecutive same-role messages and wrap assistant messages in JSON
    const sessionHistory: Array<{ role: string; content: string }> = [];
    for (const msg of rawHistory) {
      const last = sessionHistory[sessionHistory.length - 1];
      if (last && last.role === msg.role) {
        last.content += "\n" + msg.content;
      } else {
        sessionHistory.push({ ...msg });
      }
    }
    // Wrap assistant messages back into JSON so the LLM sees consistent format
    for (const msg of sessionHistory) {
      if (msg.role === "assistant") {
        const bubbles = msg.content.split("\n").filter(b => b.trim().length > 0);
        msg.content = JSON.stringify({ bubbles, encouragement: "", segments: [] });
      }
    }
    if (!LLM_API_URL || !LLM_API_KEY) {
      console.error("❌ LLAMA_API_URL ou LLAMA_API_KEY manquant dans .env");
      return NextResponse.json({ error: "Configuration IA manquante" }, { status: 500 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, isTdah: true },
    });

    // Build context preamble
    let contextPreamble = "";
    if (user?.name) contextPreamble += `L'enfant s'appelle ${user.name}. `;
    if (user?.isTdah) contextPreamble += `Profil TDAH : oui. Bulles très courtes, 1 question par bulle. `;

    const hasImage = image && typeof image === "string";

    // Build multi-turn messages from session history
    const llmMessages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (sessionHistory.length > 0) {
      // Inject context into first user message
      let firstUserInjected = false;
      for (const msg of sessionHistory) {
        if (msg.role === "user" && !firstUserInjected) {
          llmMessages.push({ role: "user", content: `[Contexte : ${contextPreamble}]\n${msg.content}` });
          firstUserInjected = true;
        } else {
          llmMessages.push({ role: msg.role, content: msg.content });
        }
      }
      // Current question
      let currentMsg = question;
      if (hasImage) {
        currentMsg += `\n\n⚠️ IMAGE FOURNIE : Lis l'image, cite les éléments réels, pose des questions sur chaque exercice.`;
      }
      const currentContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: "text", text: currentMsg },
      ];
      if (hasImage) {
        currentContent.push({ type: "image_url", image_url: { url: image } });
      }
      llmMessages.push({ role: "user", content: currentContent });
    } else {
      // No history: single message with context
      let userText = contextPreamble ? `[Contexte : ${contextPreamble}]\n` : "";
      userText += question;
      if (hasImage) {
        userText += `\n\n⚠️ IMAGE FOURNIE : Lis l'image, cite les éléments réels, pose des questions sur chaque exercice.`;
      }
      const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: "text", text: userText },
      ];
      if (hasImage) {
        userContent.push({ type: "image_url", image_url: { url: image } });
      }
      llmMessages.push({ role: "user", content: userContent });
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
          messages: llmMessages,
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
