import { authOptions } from "@/lib/auth";
import { decomposeCalculation } from "@/lib/calculation-decomposition";
import { prisma } from "@/lib/prisma";
import { AIDrawingResponse } from "@/types/drawing";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/**
 * Configuration du fournisseur IA
 *
 * Fournisseurs supportés :
 * - Groq (gratuit, très rapide) : LLAMA_API_URL=https://api.groq.com/openai/v1/chat/completions, LLAMA_MODEL=llama-3.1-8b-instant ou meta-llama/llama-4-scout-17b-16e-instruct (vision)
 * - Google Gemini (gratuit) : via GROQ_API_URL ou variable dédiée
 * - OpenRouter : LLAMA_API_URL avec openrouter.ai
 * - Ollama (local) : LLAMA_API_URL=http://localhost:11434/api/generate
 */
const LLM_API_URL = process.env.LLAMA_API_URL || process.env.OLLAMA_URL || process.env.GROQ_API_URL || "";
const LLM_MODEL =
  process.env.LLAMA_MODEL || process.env.OLLAMA_MODEL || process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const LLM_API_KEY = process.env.LLAMA_API_KEY || process.env.GROQ_API_KEY || "";

// Fonction pour générer des dessins détaillés pour les calculs (utilise la méthode générique)
function generateBasicCalculationDrawing(question: string): any[] {
  // Utiliser la fonction générique de décomposition
  const steps = decomposeCalculation(question);
  if (steps.length > 0) {
    // Ajuster les coordonnées pour la zone Indications (x + 400)
    return steps.map((step) => {
      const adjusted: any = { ...step };
      if (step.points) {
        adjusted.points = step.points.map((p: any) => ({ ...p, x: p.x + 400 }));
      }
      if (step.center) {
        adjusted.center = { ...step.center, x: step.center.x + 400 };
      }
      if (step.position) {
        adjusted.position = { ...step.position, x: step.position.x + 400 };
      }
      if (step.from) {
        adjusted.from = { ...step.from, x: step.from.x + 400 };
      }
      if (step.to) {
        adjusted.to = { ...step.to, x: step.to.x + 400 };
      }
      if (step.start) {
        adjusted.start = { ...step.start, x: step.start.x + 400 };
      }
      if (step.end) {
        adjusted.end = { ...step.end, x: step.end.x + 400 };
      }
      return adjusted;
    });
  }

  // Fallback si la décomposition n'a pas fonctionné
  const fallbackSteps: any[] = [];
  const match = question.match(/(\d+)\s*([+\-*/])\s*(\d+)/);
  if (!match) return fallbackSteps;

  const [, num1Str, operator, num2Str] = match;
  const yPos = 50;
  const startX = 420; // Zone Indications

  // ÉTAPE 1 : Poser le calcul
  const num1Digits = num1Str.split("");
  num1Digits.forEach((digit, index) => {
    const isTens = num1Digits.length === 2 && index === 0;
    const color = isTens ? "#3b82f6" : "#60a5fa";
    fallbackSteps.push({
      type: "text",
      color: color,
      text: digit,
      position: { x: startX + index * 50, y: yPos },
      fontSize: 32,
    });
  });

  fallbackSteps.push({
    type: "text",
    color: "#ffffff",
    text: operator,
    position: { x: startX + num1Digits.length * 50 + 20, y: yPos },
    fontSize: 32,
  });

  const num2Digits = num2Str.split("");
  num2Digits.forEach((digit, index) => {
    const isTens = num2Digits.length === 2 && index === 0;
    const color = isTens ? "#ef4444" : "#f87171";
    fallbackSteps.push({
      type: "text",
      color: color,
      text: digit,
      position: {
        x: startX + num1Digits.length * 50 + 60 + index * 50,
        y: yPos,
      },
      fontSize: 32,
    });
  });

  const lineStartX = startX;
  const lineEndX =
    startX + num1Digits.length * 50 + 60 + num2Digits.length * 50;
  fallbackSteps.push({
    type: "line",
    color: "#ffffff",
    points: [
      { x: lineStartX, y: yPos + 40 },
      { x: lineEndX, y: yPos + 40 },
    ],
    width: 2,
  });

  return fallbackSteps;
}

const SYSTEM_PROMPT = `Tu es un professeur d'aide aux devoirs bienveillant pour enfants du primaire. Tu aides dans TOUS les domaines : français, maths, etc. Tu adaptes le sens des mots au domaine de la question.

LANGUE : Tu réponds UNIQUEMENT en français. Tu tutoies l'enfant.

DEUX TYPES DE RÉPONSES :

1) Questions "c'est quoi X" / "comment trouver X" (définition, méthode) :
   - Utilise messageBubbles : tableau de 2 à 4 messages courts, chacun dans une bulle séparée.
   - Bulle 1 : définition courte avec <red>mot clé</red>.
   - Bulle 2 : méthode ou "comment faire" (1-2 phrases).
   - Bulle 3 (si pertinent) : un exemple concret. Dans l'exemple, mets le mot illustré entre <example>mot</example> (couleur différente pour le repérer).
   - Exemple messageBubbles : ["Un <red>adverbe</red> décrit le verbe, il dit comment se fait l'action.", "Pour le trouver : demande-toi 'Qu'est-ce qui décrit l'action ?'", "Exemple : Dans 'Le chat mange rapidement', l'adverbe est <example>rapidement</example>."]
   - Ne remplis PAS messageEnfant si tu utilises messageBubbles (ou mets la concaténation en secours).

2) Questions avec calculs, exercices, photo de devoir :
   - Utilise messageBubbles : UNE BULLE PAR ÉTAPE. Chaque élément du tableau = une seule étape.
   - Exemple : ["Étape 1 : Cherche comment regrouper les nombres pour faciliter l'addition.", "Étape 2 : Utilise l'<red>associativité</red> pour changer l'ordre des opérations.", "Étape 3 : Effectue les calculs étape par étape."]
   - Ne donne JAMAIS le résultat final.
   - Pour associativité : stratégie (165+75)+38 car 5+5=10, pas 165+38.

CONTEXTE DOMAINE : Adapte le sens des mots. En français (grammaire) : déterminant = mot devant le nom (le, un, une). En maths : déterminant = notion d'algèbre. Idem pour tout mot à double sens.

EXEMPLES : Quand tu donnes un exemple de phrase ou de calcul, entoure le mot ou l'élément illustré avec <example>…</example> pour qu'il soit en couleur différente.

SURVOL (segments) : Pour chaque <red>mot</red>, ajoute un segment { "text", "shortTip", "lesson" }.
   - shortTip : UNE phrase très courte, niveau CP-CE1. Exemple : "C'est changer l'ordre des nombres pour calculer plus facilement."
   - lesson : Même idée en 2 phrases max, vocabulaire simple. Évite formules (a+b)+c. Utilise des mots comme "regrouper", "ordre", "plus facile".

FORMAT JSON :
- messageBubbles : ["bulle 1", "bulle 2", ...] pour TOUTES les réponses (définition ET calculs). UNE bulle par étape.
- messageEnfant : concaténation en secours si messageBubbles vide.
- hint : copie ou version détaillée.
- drawing.steps : [].
- encouragement : phrase d'encouragement.
- keyPoints : ["mot1", "mot2", ...].
- segments : [{ "id": "seg1", "text": "mot", "role": "mot_clef", "shortTip": "...", "lesson": "..." }, ...].`;

export async function POST(request: Request) {
  // Log IMMÉDIATEMENT pour vérifier que la fonction est appelée
  console.log("📨 ===== NOUVELLE REQUÊTE API /api/assist =====");
  console.log("⏰ Timestamp:", new Date().toISOString());

  try {
    console.log("🔐 Vérification de la session...");
    // Récupérer la session utilisateur
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as { id: string }).id;

    const { question, canvasImage, image } = await request.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Invalid question" }, { status: 400 });
    }

    // Récupérer l'historique des conversations précédentes (10 dernières)
    let previousConversations: Array<{
      question: string;
      hint: string;
      createdAt: Date;
    }> = [];

    try {
      // Vérification que le modèle existe (au cas où Prisma Client n'est pas à jour)
      if (prisma.conversation) {
        previousConversations = await prisma.conversation.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            question: true,
            hint: true,
            createdAt: true,
          },
        });
      } else {
        console.warn(
          "Prisma Client not generated. Run: npx prisma generate. Continuing without conversation history."
        );
      }
    } catch (error) {
      console.error("Error fetching conversation history:", error);
      // Continuer sans historique si erreur
    }

    // Construire le contexte conversationnel (seulement si pertinent pour la même matière)
    let contextPrompt = "";
    if (previousConversations.length > 0) {
      // Détecter le type de la question actuelle
      const hasNumbers = /\d/.test(question);
      const hasMathOperators = /[+\-*/×÷=]/.test(question);
      const isCurrentQuestionMath =
        hasNumbers &&
        hasMathOperators &&
        /^\s*\d+\s*[+\-*/×÷]\s*\d+/.test(question.trim());
      const isCurrentQuestionFrench =
        /conditionnel|conjugaison|verbe|grammaire|orthographe|français|présent|passé|futur|imparfait|déterminant|adverbe|nom|adjectif/i.test(
          question
        );
      const isCurrentQuestionHistory =
        /histoire|date|guerre|roi|reine|empire|révolution/i.test(question);
      const isCurrentQuestionGeography =
        /géographie|pays|ville|fleuve|montagne|capitale|continent/i.test(
          question
        );

      // Filtrer les conversations précédentes pour ne garder que celles de la même matière
      const relevantConversations = previousConversations.filter((conv) => {
        const convHasNumbers = /\d/.test(conv.question);
        const convHasMathOperators = /[+\-*/×÷=]/.test(conv.question);
        const isConvMath =
          convHasNumbers &&
          convHasMathOperators &&
          /^\s*\d+\s*[+\-*/×÷]\s*\d+/.test(conv.question.trim());
        const isConvFrench =
          /conditionnel|conjugaison|verbe|grammaire|orthographe|français|présent|passé|futur|imparfait|déterminant|adverbe|nom|adjectif/i.test(
            conv.question
          );
        const isConvHistory =
          /histoire|date|guerre|roi|reine|empire|révolution/i.test(
            conv.question
          );
        const isConvGeography =
          /géographie|pays|ville|fleuve|montagne|capitale|continent/i.test(
            conv.question
          );

        // Garder seulement les conversations de la même matière
        if (isCurrentQuestionMath) return isConvMath;
        if (isCurrentQuestionFrench) return isConvFrench;
        if (isCurrentQuestionHistory) return isConvHistory;
        if (isCurrentQuestionGeography) return isConvGeography;

        // Si on ne peut pas déterminer la matière, ne pas utiliser le contexte
        return false;
      });

      // Limiter à 3 conversations pertinentes maximum
      const conversationsToUse = relevantConversations.slice(0, 3);

      if (conversationsToUse.length > 0) {
        contextPrompt =
          "\n\nCONTEXTE DES CONVERSATIONS PRÉCÉDENTES (même matière uniquement) :\n";
        conversationsToUse.reverse().forEach((conv, index) => {
          contextPrompt += `\nConversation ${index + 1}:\n`;
          contextPrompt += `- Question: "${conv.question}"\n`;
          contextPrompt += `- Indice donné: "${conv.hint}"\n`;
        });
        contextPrompt +=
          "\n⚠️ Utilise ce contexte pour créer une continuité pédagogique dans la MÊME matière, mais réponds TOUJOURS à la question actuelle, pas aux questions précédentes.\n";
      }
    }

    // Ajouter le contexte du canvas si fourni (seulement si pertinent)
    let canvasContext = "";
    if (canvasImage && typeof canvasImage === "string") {
      // Détecter si le canvas contient un calcul ou autre chose
      const hasNumbers = /\d/.test(question);
      const hasMathOperators = /[+\-*/×÷=]/.test(question);
      const isCurrentQuestionMath =
        hasNumbers &&
        hasMathOperators &&
        /^\s*\d+\s*[+\-*/×÷]\s*\d+/.test(question.trim());

      if (isCurrentQuestionMath) {
        canvasContext =
          "\n\nL'enfant a déjà dessiné quelque chose sur le tableau. Fais référence à son dessin dans ta réponse et guide-le en utilisant ce qu'il a déjà fait.";
      } else {
        canvasContext =
          "\n\nL'enfant a peut-être dessiné quelque chose sur le tableau. Si c'est pertinent pour la question posée, fais-y référence. Sinon, ignore-le et réponds directement à la question.";
      }
    }

    // Récupérer les infos utilisateur pour personnaliser
    console.log("👤 Récupération des infos utilisateur pour userId:", userId);
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, isTdah: true },
      });
      console.log("✅ Utilisateur récupéré:", user ? "Oui" : "Non");
    } catch (userError) {
      console.error(
        "❌ Erreur lors de la récupération de l'utilisateur:",
        userError
      );
      user = null;
    }

    let userContext = "";
    if (user) {
      userContext = `\n\nINFORMATIONS SUR L'ENFANT :\n`;
      if (user.name) {
        userContext += `- Prénom : ${user.name}\n`;
      }
      if (user.isTdah) {
        userContext += `- Profil TDAH : Oui - Adapte ta pédagogie avec des instructions plus courtes, des pauses visuelles, et des encouragements fréquents.\n`;
      }
    }

    // Appel au modèle Llama / IA
    let aiResponse: AIDrawingResponse;

    console.log("🚀 Début de l'appel LLM");
    console.log("🔍 Question reçue:", question);
    console.log("🖼️ Image présente:", !!image);
    console.log("🌐 LLM_API_URL:", LLM_API_URL || "NON DÉFINI");
    console.log("🤖 LLM_MODEL:", LLM_MODEL);

    try {
      console.log("📋 Construction du prompt...");
      // Analyser le type de question pour adapter le prompt
      // Détection plus précise : doit contenir des nombres ET des opérateurs mathématiques
      const hasNumbers = /\d/.test(question);
      const hasMathOperators = /[+\-*/×÷=]/.test(question);
      const isCalculation =
        hasNumbers &&
        hasMathOperators &&
        /^\s*\d+\s*[+\-*/×÷]\s*\d+/.test(question.trim());
      let calculationPrompt = "";

      if (isCalculation) {
        calculationPrompt = `\n\n⚠️⚠️⚠️ TRÈS IMPORTANT - C'EST UN CALCUL :\n`;
        calculationPrompt += `Tu DOIS créer une DÉCOMPOSITION VISUELLE COMPLÈTE comme une pose d'opération sur papier.\n\n`;
        calculationPrompt += `OBLIGATOIRE :\n`;
        calculationPrompt += `1. Poser le calcul ligne par ligne (comme sur papier)\n`;
        calculationPrompt += `2. CHAQUE CHIFFRE doit avoir sa propre couleur selon sa position\n`;
        calculationPrompt += `3. Décomposer CHAQUE ÉTAPE du calcul (unités, dizaines, centaines)\n`;
        calculationPrompt += `4. Montrer qu'on prend une dizaine (ou centaine) de la colonne de gauche avec des flèches et un "-1" au-dessus\n`;
        calculationPrompt += `5. Poser des questions à chaque étape SANS donner le résultat\n`;
        calculationPrompt += `6. Génère AU MINIMUM 15-20 étapes de dessin pour décomposer complètement\n`;
        calculationPrompt += `7. Utilise des nuances de couleurs : bleu clair/foncé pour le premier nombre, rouge clair/foncé pour le deuxième\n`;
        calculationPrompt += `8. Montre la structure du résultat final (cases vides) sans les chiffres\n\n`;
        calculationPrompt += `EXEMPLE DE STRUCTURE :\n`;
        calculationPrompt += `- Ligne 1 : Premier nombre (chiffres colorés)\n`;
        calculationPrompt += `- Ligne 2 : Opérateur + deuxième nombre (chiffres colorés)\n`;
        calculationPrompt += `- Ligne 3 : Trait de séparation\n`;
        calculationPrompt += `- Lignes suivantes : Chaque étape du calcul avec annotations\n`;
        calculationPrompt += `- Dernière ligne : Structure du résultat (cases vides à remplir)\n`;
      }

      const isDefinitionQuestion = /c'est quoi|qu'est-ce que|comment (trouver|repérer|identifier|reconnaître)|définition|qu'est ce qu'un/i.test(question);
      const jsonExample = isDefinitionQuestion
        ? `{
  "messageBubbles": ["Un <red>adverbe</red> décrit le verbe.", "Pour le trouver : demande-toi 'Qu'est-ce qui décrit l\\'action ?'", "Exemple : Dans 'Le chat mange rapidement', l'adverbe est <example>rapidement</example>."],
  "messageEnfant": "",
  "hint": "Définition avec exemples.",
  "drawing": { "steps": [] },
  "encouragement": "Tu peux le faire !",
  "keyPoints": ["adverbe", "verbe", "action"],
  "segments": [{ "id": "seg1", "text": "adverbe", "role": "mot_clef", "shortTip": "Mot qui décrit le verbe.", "lesson": "Exemple : lentement, vite, bien." }]
}`
        : `{
  "messageBubbles": [],
  "messageEnfant": "Étape 1 : Tu peux utiliser l'<red>associativité</red> pour regrouper les nombres. Étape 2 : Cherche deux nombres dont les unités font 10. Étape 3 : Calcule la somme entre parenthèses, puis ajoute le troisième.",
  "hint": "Même texte.",
  "drawing": { "steps": [] },
  "encouragement": "Tu peux le faire !",
  "keyPoints": ["associativité", "regrouper", "unités"],
  "segments": [{ "id": "seg1", "text": "associativité", "role": "mot_clef", "shortTip": "On peut regrouper les nombres autrement.", "lesson": "Ex. (a+b)+c = a+(b+c)." }]
}`;

      const visionContext = image
        ? `

L'ENFANT A ENVOYÉ UNE PHOTO DE DEVOIRS. Utilise-la pour construire ton aide. messageEnfant = message court et structuré (étapes + <red>mots clés</red>). Remplis segments pour chaque mot clé (shortTip + lesson).
`
        : "";

      const isAssociativite = /associativit[eé]|\d+\s*\+\s*\d+\s*\+\s*\d+|regrouper|addition.*nombres/i.test(question);
      const associativiteContext = isAssociativite
        ? `

QUESTION SUR L'ASSOCIATIVITÉ / ADDITIONS : Donne une méthode en 3-4 étapes. Explique qu'on cherche des paires dont les unités font 10 (ex. 5+5, 2+8). Pour 165+38+75, la stratégie est (165+75)+38 car 5+5=10, pas 165+38. Ne donne JAMAIS le résultat (278).
`
        : "";

      const definitionContext = isDefinitionQuestion
        ? `\nQUESTION DE DÉFINITION / MÉTHODE : Utilise messageBubbles (2-4 bulles). Bulle 1 = définition, bulle 2 = méthode, bulle 3 = exemple avec <example>mot</example>. Adapte au domaine (français = grammaire, maths = calcul).\n`
        : "";

      const fullPrompt = `${SYSTEM_PROMPT}${userContext}${contextPrompt}${canvasContext}${calculationPrompt}${visionContext}${associativiteContext}${definitionContext}

QUESTION : ${question}

Réponds UNIQUEMENT avec un objet JSON valide. messageBubbles pour définition/méthode, messageEnfant pour calculs/exercices. Format :
${jsonExample}`;

      if (!LLM_API_URL) {
        throw new Error(
          "LLM_API_URL (ou OLLAMA_URL) n'est pas configurée dans les variables d'environnement."
        );
      }

      console.log("🤖 Appel au LLM...");
      console.log("📍 URL:", LLM_API_URL);
      console.log("🤖 Modèle:", LLM_MODEL);
      console.log("📝 Taille du prompt:", fullPrompt.length, "caractères");

      const controller = new AbortController();
      // Timeout de 180 secondes (3 minutes) pour les modèles locaux qui peuvent être lents
      const timeoutId = setTimeout(() => {
        console.warn(
          "⏱️ Timeout atteint après 3 minutes, annulation de la requête..."
        );
        controller.abort();
      }, 180000);

      // Format OpenAI/Groq/OpenRouter (messages) vs Ollama (prompt)
      const isOpenAICompatible =
        LLM_API_URL.includes("openrouter.ai") ||
        LLM_API_URL.includes("groq.com") ||
        LLM_API_URL.includes("openai.com");

      /**
       * Appel HTTP LLM :
       * - OpenRouter : endpoint /chat/completions avec { model, messages: [...] } et contenu multimodal (texte + image_url).
       * - Sinon (proxy type Ollama) : endpoint compatible { model, prompt, ... }.
       */
      let body: any;
      if (isOpenAICompatible) {
        const userContent: any[] = [
          { type: "text", text: fullPrompt },
        ];

        // Si une image a été fournie (Data URL base64), on l'ajoute au contenu utilisateur
        if (image && typeof image === "string") {
          userContent.push({
            type: "image_url",
            image_url: {
              url: image,
            },
          });
        }

        body = {
          model: LLM_MODEL,
          stream: false,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: userContent,
            },
          ],
        };
      } else {
        // Ollama : /api/generate attend du base64 brut (sans préfixe data:image/...)
        let ollamaImages: string[] | undefined;
        if (image && typeof image === "string") {
          const base64 = image.includes("base64,") ? image.split("base64,")[1] : image;
          if (base64) ollamaImages = [base64];
        }
        body = {
          model: LLM_MODEL,
          prompt: fullPrompt,
          stream: false,
          format: "json",
          num_predict: 4096,
          ...(ollamaImages?.length ? { images: ollamaImages } : {}),
        };
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (LLM_API_KEY) {
        headers.Authorization = `Bearer ${LLM_API_KEY}`;
      }
      if (LLM_API_URL.includes("openrouter.ai")) {
        headers["HTTP-Referer"] = process.env.NEXTAUTH_URL || "http://localhost:3000";
        headers["X-Title"] = "Devoirs - Assistant IA primaire";
      }

      const llmResponse = await fetch(LLM_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("✅ Réponse LLM reçue, status:", llmResponse.status);

      if (!llmResponse.ok) {
        const errorText = await llmResponse.text();
        console.error("❌ Erreur LLM - Status:", llmResponse.status);
        console.error("❌ Erreur LLM - Response:", errorText);
        throw new Error(
          `LLM error (${llmResponse.status}): ${
            llmResponse.statusText
          }. ${errorText.substring(0, 200)}`
        );
      }

      const llmData = await llmResponse.json();
      const responseText =
        // OpenRouter format
        llmData.choices?.[0]?.message?.content ||
        // Proxy type Ollama ou équivalent
        llmData.response ||
        llmData.text ||
        "";

      console.log(
        "📥 Réponse brute Ollama (premiers 500 caractères):",
        responseText.substring(0, 500)
      );
      console.log(
        "📏 Taille totale de la réponse:",
        responseText.length,
        "caractères"
      );

      // Parser le JSON de la réponse.
      // 1) Parser directement ou extraire {...} avec une regex.
      // 2) Valider que l'objet contient bien un texte à afficher (hint ou messageEnfant), sinon considérer invalide.
      let parsedResponse: AIDrawingResponse | null = null;

      function tryParseJson(text: string): Record<string, unknown> | null {
        const trimmed = text.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
          try {
            return JSON.parse(trimmed) as Record<string, unknown>;
          } catch {
            return null;
          }
        }
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
          } catch {
            return null;
          }
        }
        return null;
      }

      const raw = tryParseJson(responseText);
      if (raw && typeof raw === "object") {
        const hintStr = typeof raw.hint === "string" ? raw.hint.trim() : "";
        const messageEnfantStr = typeof raw.messageEnfant === "string" ? raw.messageEnfant.trim() : "";
        const bubbles = Array.isArray(raw.messageBubbles) ? raw.messageBubbles.filter((b): b is string => typeof b === "string" && b.trim().length > 0) : [];
        const hasDisplayText = bubbles.length > 0 || (messageEnfantStr.length > 10) || (hintStr.length > 10);
        const looksLikeGarbage = !hasDisplayText || /^[\s#0-9a-fA-F,{}]+$/.test((hintStr || messageEnfantStr || bubbles[0] || "").slice(0, 80));
        if (hasDisplayText && !looksLikeGarbage) {
          if (bubbles.length > 0) (raw as Record<string, unknown>).messageBubbles = bubbles;
          parsedResponse = raw as unknown as AIDrawingResponse;
        } else {
          console.warn("Réponse JSON ignorée : pas de hint/messageEnfant/messageBubbles valide", raw);
        }
      }

      if (parsedResponse) {
        console.log("✅ JSON valide reçu");
        // Texte affiché = messageEnfant en priorité, sinon hint
        const displayText = (parsedResponse.messageEnfant ?? parsedResponse.hint ?? "").trim();
        if (displayText && !parsedResponse.messageEnfant) parsedResponse.messageEnfant = displayText;
        if (displayText) parsedResponse.hint = displayText;
        aiResponse = parsedResponse;
      } else {
        // Pas de JSON valide ou contenu inutilisable : message friendly en français, pas le brut IA
        console.log("⚠️ Pas de JSON valide, envoi d'un message de secours.");
        const hasNumbers = /\d/.test(question);
        const hasMathOperators = /[+\-*/×÷=]/.test(question);
        const isCalculation =
          hasNumbers &&
          hasMathOperators &&
          /^\s*\d+\s*[+\-*/×÷]\s*\d+/.test(question.trim());
        let drawingSteps: any[] = [];
        if (isCalculation) drawingSteps = generateBasicCalculationDrawing(question);
        aiResponse = {
          messageEnfant: "Je n'ai pas pu préparer une réponse bien structurée. Peux-tu reformuler ou renvoyer une photo plus lisible ?",
          hint: "Je n'ai pas pu préparer une réponse bien structurée. Peux-tu reformuler ou renvoyer une photo plus lisible ?",
          drawing: { steps: drawingSteps },
          encouragement: "Réessaie, on va y arriver !",
          keyPoints: [],
        };
      }
    } catch (ollamaError: unknown) {
      console.error("❌ Erreur LLM capturée dans le catch");
      console.error(
        "❌ Type d'erreur:",
        ollamaError instanceof Error
          ? ollamaError.constructor.name
          : typeof ollamaError
      );
      console.error(
        "❌ Message d'erreur:",
        ollamaError instanceof Error ? ollamaError.message : String(ollamaError)
      );
      console.error(
        "❌ Stack:",
        ollamaError instanceof Error ? ollamaError.stack : "N/A"
      );

      if (ollamaError instanceof Error && ollamaError.name === "AbortError") {
        console.error(
          "⏱️ Timeout LLM : La requête a pris plus de 45 secondes"
        );
      }

      // Vérifier si c'est une erreur réseau
      if (
        ollamaError instanceof Error &&
        (ollamaError.message.includes("fetch") ||
          ollamaError.message.includes("network"))
      ) {
        console.error(
          "🌐 Erreur réseau détectée - Vérifiez que le backend LLM est bien démarré et accessible à",
          LLM_API_URL
        );
      }

      // En cas d'erreur, essayer quand même de retourner une réponse utile
      // Pour les calculs, utiliser la fonction de décomposition
      const hasNumbers = /\d/.test(question);
      const hasMathOperators = /[+\-*/×÷=]/.test(question);
      const isCalculation =
        hasNumbers &&
        hasMathOperators &&
        /^\s*\d+\s*[+\-*/×÷]\s*\d+/.test(question.trim());

      let drawingSteps: any[] = [];
      if (isCalculation) {
        drawingSteps = generateBasicCalculationDrawing(question);
      }

      aiResponse = {
        hint: `Je réfléchis à ta question sur "${question}". Peux-tu me donner plus de détails sur ce que tu veux savoir exactement ?`,
        drawing: {
          steps: drawingSteps,
        },
        encouragement: "N'hésite pas à réessayer avec plus de détails !",
      };
    }

    // Si une image a été envoyée mais que la réponse ne ressemble pas à une aide structurée,
    // renvoyer un message propre.
    if (image && typeof image === "string") {
      const texteAffiché = aiResponse.messageEnfant ?? aiResponse.hint ?? "";
      const looksLikeHelp = /Exercice\s+1/i.test(texteAffiché) || /Ex\.?\s*1/i.test(texteAffiché) || (texteAffiché.length > 80 && /<red>/.test(texteAffiché));
      const hasTooMuchGarbage = texteAffiché.length > 0 && !/[0-9]/.test(texteAffiché) && !/[a-zA-ZÀ-ÿ]/.test(texteAffiché.slice(0, 120));

      if (!looksLikeHelp || hasTooMuchGarbage) {
        const msg = "Je n'arrive pas encore à analyser correctement cette feuille. Peux-tu reprendre la photo plus près, ou m'écrire la consigne ?";
        aiResponse = {
          messageEnfant: msg,
          hint: msg,
          drawing: { steps: [] },
          encouragement: "Tu fais bien de demander de l'aide, on va y arriver ensemble.",
          keyPoints: ["consigne", "exercice"],
        };
      }
    }

    // Valider et sécuriser les instructions de dessin
    if (aiResponse.drawing?.steps) {
      console.log(
        "Avant validation:",
        aiResponse.drawing.steps.length,
        "étapes"
      );

      // Vérifier qu'il y a au moins quelques étapes de texte pour les questions non-mathématiques
      const hasNumbers = /\d/.test(question);
      const hasMathOperators = /[+\-*/×÷=]/.test(question);
      const isCalculation =
        hasNumbers &&
        hasMathOperators &&
        /^\s*\d+\s*[+\-*/×÷]\s*\d+/.test(question.trim());
      const textSteps = aiResponse.drawing.steps.filter(
        (s: any) => s.type === "text"
      );

      if (!isCalculation && textSteps.length < 2) {
        console.warn(
          "⚠️ Pas assez d'étapes de texte dans drawing.steps, ajout d'un message d'avertissement"
        );
        // Ajouter un message dans le hint pour encourager l'IA à mieux répondre
        if (!aiResponse.hint.includes("Regarde les exemples dans le tableau")) {
          aiResponse.hint +=
            " Regarde les exemples dans le tableau pour mieux comprendre !";
        }
      }

      aiResponse.drawing.steps = aiResponse.drawing.steps
        .filter((step) => {
          // Valider les coordonnées (zone Indications : 400-800px en x)
          const MIN_X = 400; // Début de la zone Indications
          const MAX_X = 800; // Fin du canvas
          const MAX_Y = 500;          if (step.points) {
            return step.points.every(
              (p) => p.x >= MIN_X && p.x <= MAX_X && p.y >= 0 && p.y <= MAX_Y
            );
          }
          if (step.center) {
            return (
              step.center.x >= MIN_X &&
              step.center.x <= MAX_X &&
              step.center.y >= 0 &&
              step.center.y <= MAX_Y
            );
          }
          if (step.position) {
            return (
              step.position.x >= MIN_X &&
              step.position.x <= MAX_X &&
              step.position.y >= 0 &&
              step.position.y <= MAX_Y
            );
          }
          if (step.from && step.to) {
            return (
              step.from.x >= MIN_X &&
              step.from.x <= MAX_X &&
              step.from.y >= 0 &&
              step.from.y <= MAX_Y &&
              step.to.x >= MIN_X &&
              step.to.x <= MAX_X &&
              step.to.y >= 0 &&
              step.to.y <= MAX_Y
            );
          }
          if (step.start && step.end) {
            return (
              step.start.x >= MIN_X &&
              step.start.x <= MAX_X &&
              step.start.y >= 0 &&
              step.start.y <= MAX_Y &&
              step.end.x >= MIN_X &&
              step.end.x <= MAX_X &&
              step.end.y >= 0 &&
              step.end.y <= MAX_Y
            );
          }
          return true;
        })
        .map((step) => ({
          ...step,
          width: step.width || 2,
          color: step.color || "#3b82f6", // Couleur par défaut
        }));
      console.log(
        "Après validation:",
        aiResponse.drawing.steps.length,
        "étapes"
      );
    } else {
      console.warn("Pas de drawing.steps dans la réponse");
    }    // Extraire les éléments clés du hint si présents dans <red> tags
    if (aiResponse.hint && !aiResponse.keyPoints) {
      const keyPointsMatch = aiResponse.hint.match(/<red>(.*?)<\/red>/g);
      if (keyPointsMatch) {
        aiResponse.keyPoints = keyPointsMatch.map((tag) =>
          tag.replace(/<\/?red>/g, "").trim()
        );
      }
    }    // S'assurer que keyPoints existe même si vide
    if (!aiResponse.keyPoints) {
      aiResponse.keyPoints = [];
    }    // Sauvegarder la conversation dans la base de données
    try {
      if (prisma.conversation) {
        await prisma.conversation.create({
          data: {
            userId,
            question,
            hint: aiResponse.hint || "",
            drawing: aiResponse.drawing
              ? JSON.stringify(aiResponse.drawing)
              : null,
            encouragement: aiResponse.encouragement || null,
          },
        });
      }
    } catch (dbError) {
      console.error("Error saving conversation:", dbError);
      // Ne pas bloquer la réponse si la sauvegarde échoue
    }    return NextResponse.json(aiResponse);
  } catch (e) {
    console.error("API error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
