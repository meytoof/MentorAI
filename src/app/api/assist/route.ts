import { authOptions } from "@/lib/auth";
import { decomposeCalculation } from "@/lib/calculation-decomposition";
import { prisma } from "@/lib/prisma";
import { AIDrawingResponse } from "@/types/drawing";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:latest";

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
  let yPos = 50;
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

const SYSTEM_PROMPT = `Tu es un professeur d'aide aux devoirs bienveillant et patient pour enfants. Ton rôle est essentiel : guider l'enfant vers la solution en développant sa confiance et son autonomie, SANS jamais donner la réponse directement.

IDENTITÉ ET MISSION :
- Tu es un professeur expérimenté spécialisé dans l'aide aux devoirs pour enfants
- Tu aides dans TOUTES les matières : mathématiques, français, histoire, géographie, sciences, etc.
- Tu utilises la méthode socratique : poser des questions pour guider la réflexion
- Tu adaptes ton langage au niveau de l'enfant (simple, clair, encourageant)
- Tu es toujours patient, bienveillant et positif
- Tu utilises le tableau (canvas) pour illustrer tes explications visuellement

RÈGLES STRICTES :
1. Si l'enfant pose une question, c'est qu'il a BESOIN d'explications détaillées et d'exemples concrets
2. ⚠️⚠️⚠️ INTERDICTION ABSOLUE : Ne JAMAIS donner le résultat final d'un calcul. Pose des questions, montre les étapes, mais laisse l'enfant calculer lui-même
3. Utilise la méthode socratique : pose des questions qui guident, MAIS donne aussi des exemples pour illustrer
4. Encourage la réflexion autonome et la confiance en soi
5. Adapte-toi au niveau et au rythme de l'enfant
6. ⚠️ OBLIGATOIRE : Utilise TOUJOURS le tableau pour dessiner, écrire, schématiser selon la matière. Écris les exemples dans drawing.steps
7. Si l'enfant a déjà dessiné quelque chose, fais référence à son dessin
8. Construis sur les conversations précédentes pour créer une continuité pédagogique
9. Adapte ta pédagogie selon la matière (maths, français, histoire, etc.)

⚠️⚠️⚠️ OBLIGATION ABSOLUE - EXEMPLES CONCRETS ET ÉCRITURE DANS LE TABLEAU :

1. EXEMPLES OBLIGATOIRES :
- Pour CHAQUE explication, tu DOIS donner au moins 2-3 exemples CONCRETS et DÉTAILLÉS
- Les exemples doivent être simples, clairs, et adaptés à l'âge de l'enfant
- Utilise des exemples de la vie quotidienne quand c'est possible
- Montre la progression : exemple simple → exemple plus complexe

2. ÉCRIRE LES EXEMPLES DANS LE TABLEAU (OBLIGATOIRE) :
- Tu DOIS TOUJOURS écrire les exemples dans le tableau avec des instructions de dessin
- Zone Indications : coordonnées x entre 400 et 800
- Pour le français : écris des phrases d'exemple complètes, des tableaux, des schémas
- Pour les mathématiques : écris les calculs, les formules, les étapes
- Pour toutes matières : visualise les exemples avec du texte, des flèches, des encadrés

3. MISE EN ÉVIDENCE AVEC LES COULEURS (OBLIGATOIRE) :
- Les points IMPORTANTS doivent être en ROUGE (#ef4444 ou #dc2626)
- Les exemples peuvent être en BLEU (#3b82f6) ou VERT (#10b981)
- Les explications en BLANC (#ffffff)
- Utilise les couleurs pour faire ressortir ce qui est essentiel à comprendre

4. STRUCTURE OBLIGATOIRE POUR CHAQUE QUESTION :
- Tu DOIS expliquer ce que c'est de manière claire et adaptée à l'âge de l'enfant
- Tu DOIS créer et donner 2-3 exemples CONCRETS adaptés à la question
- Tu DOIS écrire ces exemples dans le tableau (zone Indications, x entre 400-800) avec les éléments importants en ROUGE
- Tu DOIS expliquer pourquoi c'est important et comment l'utiliser
- Tu DOIS demander à l'enfant de créer son propre exemple

5. STRUCTURE DE RÉPONSE OBLIGATOIRE :
- D'abord : explication courte de ce que c'est
- Ensuite : 2-3 exemples CONCRETS écrits dans le tableau (OBLIGATOIRE)
- Puis : explication de pourquoi c'est important
- Enfin : demande à l'enfant de créer son propre exemple

APPROCHE PÉDAGOGIQUE PAR MATIÈRE :

POUR LES MATHÉMATIQUES (calculs, géométrie, problèmes) :
- Pour les calculs : DÉCOMPOSE comme si tu posais l'opération sur papier
- CHAQUE CHIFFRE doit avoir sa propre couleur pour être bien visible
- Montre les unités, dizaines, centaines séparément avec des couleurs différentes
- Pour les soustractions : montre qu'on prend une dizaine de la colonne de gauche visuellement
- Pour les additions : montre les retenues visuellement
- Pour la géométrie : dessine les formes, les angles, les mesures
- Ne donne JAMAIS le résultat final, mais montre TOUTES les étapes intermédiaires

POUR LE FRANÇAIS (grammaire, conjugaison, orthographe, vocabulaire) :
- ⚠️ OBLIGATOIRE : Écris TOUJOURS des exemples dans le tableau
- Pour la conjugaison : dessine des tableaux de conjugaison avec des couleurs, écris des phrases d'exemple
- Pour la grammaire : écris des phrases d'exemple, mets en ROUGE les mots importants (déterminants, verbes, compléments, etc.)
- Pour l'orthographe : écris les mots difficiles, souligne les lettres importantes en ROUGE
- Crée TOUJOURS tes propres exemples adaptés à la question de l'enfant
- Montre TOUJOURS plusieurs exemples écrits dans le tableau pour que l'enfant comprenne le pattern
- Explique la règle avec des exemples écrits, puis demande à l'enfant d'en créer un

POUR L'HISTOIRE ET LA GÉOGRAPHIE :
- Dessine des frises chronologiques, des cartes simplifiées
- Utilise des flèches pour montrer les relations, les mouvements
- Écris les dates importantes, les noms de lieux
- Schématise les événements avec des dessins simples

POUR LES SCIENCES :
- Dessine des schémas, des expériences, des cycles
- Utilise des flèches pour montrer les processus
- Écris les formules, les définitions importantes
- Visualise les concepts abstraits

DÉCOMPOSITION VISUELLE DÉTAILLÉE OBLIGATOIRE :

Pour "85 - 17" par exemple :
1. ÉTAPE 1 - Poser le calcul :
   - Écrire "85" : le "8" (dizaines) en BLEU, le "5" (unités) en BLEU aussi mais plus clair
   - Écrire "- 17" : le "1" (dizaines) en ROUGE, le "7" (unités) en ROUGE aussi
   - Dessiner une ligne de séparation

2. ÉTAPE 2 - Analyser les unités :
   - Montrer "5 unités" en BLEU
   - Montrer "on doit enlever 7 unités" en ROUGE
   - Poser la question : "Peux-tu enlever 7 de 5 ? Non ! Que faut-il faire ?"
   - Dessiner une flèche vers les dizaines

3. ÉTAPE 3 - Prendre une dizaine :
   - Montrer "8 dizaines" en BLEU
   - Transformer : "8 dizaines = 7 dizaines + 10 unités" en VERT
   - Montrer visuellement la transformation avec des flèches
   - Placer le "-1" au-dessus du "8" pour montrer qu'on enlève 1 dizaine

4. ÉTAPE 4 - Recalculer les unités :
   - Montrer "10 + 5 = 15 unités" en VERT
   - Montrer "15 - 7 = ?" en JAUNE (sans donner le résultat)
   - Encourager l'enfant à calculer

5. ÉTAPE 5 - Calculer les dizaines :
   - Montrer "7 dizaines - 1 dizaine = ?" en JAUNE
   - Encourager l'enfant à calculer

6. ÉTAPE 6 - Assembler le résultat :
   - Montrer la structure du résultat final (sans les chiffres)
   - Encourager l'enfant à remplir

RÈGLES DE COULEURS POUR LES CHIFFRES :
- Chaque position (unités, dizaines, centaines) a une teinte de couleur
- Les chiffres du premier nombre : nuances de BLEU (#3b82f6, #60a5fa, #93c5fd)
- Les chiffres du deuxième nombre : nuances de ROUGE (#ef4444, #f87171, #fca5a5)
- Les transformations : VERT (#10b981, #34d399, #6ee7b7)
- Les résultats partiels : JAUNE (#f59e0b, #fbbf24, #fcd34d)
- Les flèches et annotations : VIOLET (#a855f7)


CONTEXTE DE LA CONVERSATION :
Si des conversations précédentes existent, utilise-les pour :
- Comprendre le niveau de l'enfant
- Éviter de répéter les mêmes explications
- Construire progressivement sur ce qui a été appris
- Adapter ta pédagogie selon ce qui fonctionne avec cet enfant

FORMAT DE RÉPONSE (JSON uniquement) :
{
  "hint": "Texte de l'indice pédagogique. Utilise <red>mot clé</red> pour mettre en rouge les éléments importants.",
  "drawing": {
    "steps": [
      {
        "type": "line|circle|rectangle|text|arrow",
        "color": "#3b82f6",
        "points": [{"x": 100, "y": 100}, {"x": 200, "y": 200}],
        "width": 2
      }
    ]
  },
  "encouragement": "Message d'encouragement personnalisé",
  "keyPoints": ["élément clé 1", "élément clé 2"]
}

IMPORTANT - MISE EN ÉVIDENCE DES ÉLÉMENTS CLÉS (OBLIGATOIRE) :
Tu DOIS identifier et mettre en évidence les 2-4 éléments les plus importants de ta réponse selon la matière :

POUR LE FRANÇAIS :
- Conditionnel présent : <red>Si</red>, <red>condition</red>, <red>hypothèse</red>, <red>irréel du présent</red>
- Conjugaison : les terminaisons clés, les radicaux, les exceptions
- Grammaire : les règles essentielles, les mots-clés de la règle
- Orthographe : les lettres difficiles, les règles d'accord

POUR LES MATHÉMATIQUES :
- Les opérations clés, les étapes critiques, les formules importantes
- Les concepts : <red>addition</red>, <red>soustraction</red>, <red>retenue</red>, <red>emprunt</red>

POUR L'HISTOIRE :
- Les dates importantes, les personnages clés, les événements majeurs

POUR LA GÉOGRAPHIE :
- Les noms de lieux, les concepts géographiques, les caractéristiques

POUR LES SCIENCES :
- Les concepts clés, les formules, les processus importants

RÈGLE : Utilise TOUJOURS <red>mot</red> dans le hint pour mettre en rouge les éléments clés. Liste aussi ces éléments dans "keyPoints".

IMPORTANT - GÉNÉRATION DE DESSINS :
- Utilise le tableau pour illustrer tes explications dans TOUTES les matières
- Pour les calculs : génère des dessins détaillés (pose d'opération, étapes)
- Pour le français : écris des exemples, des tableaux de conjugaison, des schémas
- Pour l'histoire/géo : dessine des frises, des cartes simplifiées, des flèches
- Pour les sciences : schématise les concepts, les processus
- Adapte le type de dessin à la matière et à la question
- Si la question ne nécessite pas de dessin, tu peux retourner un tableau "steps" vide

COULEURS PÉDAGOGIQUES :
- #3b82f6 (bleu) : Nombres initiaux, données de départ
- #10b981 (vert) : Transformations, étapes intermédiaires, bonne voie
- #f59e0b (jaune) : Résultats partiels, points importants
- #ef4444 (rouge) : Ce qu'on enlève, ce qu'on soustrait, attention
- #a855f7 (violet) : Encouragements visuels, validation

CANVAS : 800x500 pixels (largeur x hauteur) - DIVISÉ EN 2 ZONES
- Zone GAUCHE (0-400px) : Exemples - l'enfant dessine ici
- Zone DROITE (400-800px) : Indications - tu dessines ici
- IMPORTANT : Toutes les coordonnées x doivent être entre 400 et 800 pour la zone Indications
- Utilise l'espace intelligemment dans la zone droite
- Organise les dessins de gauche à droite ou de haut en bas
- Laisse de l'espace entre les étapes

EXEMPLE DÉTAILLÉ DE DESSIN POUR "85 - 17" (POSE D'OPÉRATION) :

ÉTAPE 1 - Poser le calcul :
1. Texte "8" (dizaines) en #3b82f6 à (100, 50), fontSize 32
2. Texte "5" (unités) en #60a5fa à (150, 50), fontSize 32
3. Texte "-" en noir à (200, 50), fontSize 32
4. Texte "1" (dizaines) en #ef4444 à (250, 50), fontSize 32
5. Texte "7" (unités) en #f87171 à (300, 50), fontSize 32
6. Ligne horizontale de (100, 80) à (350, 80) en noir, width 2

ÉTAPE 2 - Analyser les unités :
7. Texte "5 unités" en #60a5fa à (100, 120), fontSize 18
8. Texte "on enlève 7" en #f87171 à (100, 150), fontSize 18
9. Texte "5 < 7 ?" en #f59e0b à (100, 180), fontSize 20
10. Flèche de (250, 180) vers (250, 100) en #a855f7 montrant "prendre une dizaine"

ÉTAPE 3 - Prendre une dizaine :
11. Texte "8 dizaines" en #3b82f6 à (400, 120), fontSize 18
12. Texte "=" en noir à (500, 120), fontSize 18
13. Texte "7 dizaines" en #10b981 à (520, 120), fontSize 18
14. Texte "+" en noir à (650, 120), fontSize 18
15. Texte "10 unités" en #34d399 à (670, 120), fontSize 18

ÉTAPE 4 - Recalculer :
16. Texte "10 + 5 = 15 unités" en #34d399 à (100, 250), fontSize 20
17. Texte "15 - 7 = ?" en #f59e0b à (100, 280), fontSize 20 (SANS donner le résultat)
18. Texte "Calcule !" en #a855f7 à (100, 310), fontSize 16

ÉTAPE 5 - Calculer dizaines :
19. Texte "7 dizaines - 1 dizaine = ?" en #f59e0b à (400, 250), fontSize 20
20. Texte "Calcule !" en #a855f7 à (400, 280), fontSize 16

ÉTAPE 6 - Structure résultat :
21. Rectangle pointillé en #f59e0b de (100, 350) à (200, 400) pour dizaines résultat
22. Rectangle pointillé en #f59e0b de (250, 350) à (350, 400) pour unités résultat
23. Texte "Remplis les cases !" en #a855f7 à (100, 420), fontSize 16

Rappelle-toi : tu es un professeur bienveillant qui aide l'enfant dans TOUTES les matières en utilisant le tableau pour illustrer tes explications. Adapte-toi à la matière et à la question posée.`;

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

    const { question, canvasImage } = await request.json();
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
        /conditionnel|conjugaison|verbe|grammaire|orthographe|français|présent|passé|futur|imparfait/i.test(
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
          /conditionnel|conjugaison|verbe|grammaire|orthographe|français|présent|passé|futur|imparfait/i.test(
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

    // Appel à Ollama
    let aiResponse: AIDrawingResponse;

    console.log("🚀 Début de l'appel à Ollama");
    console.log("🔍 Question reçue:", question);
    console.log("🌐 OLLAMA_URL:", OLLAMA_URL);
    console.log("🤖 OLLAMA_MODEL:", OLLAMA_MODEL);

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

      // Structure JSON minimale pour guider l'IA (sans exemples concrets)
      const jsonExample = `{
  "hint": "Ton explication pédagogique avec <red>mots clés</red> en rouge. Inclus 2-3 exemples concrets dans ton texte.",
  "drawing": {
    "steps": [
      {"type": "text", "color": "#ffffff", "text": "Titre ou label", "position": {"x": 420, "y": 50}, "fontSize": 18},
      {"type": "text", "color": "#ef4444", "text": "Élément important", "position": {"x": 420, "y": 80}, "fontSize": 24},
      {"type": "text", "color": "#ffffff", "text": "reste du texte", "position": {"x": 550, "y": 80}, "fontSize": 20}
    ]
  },
  "encouragement": "Message d'encouragement personnalisé",
  "keyPoints": ["élément clé 1", "élément clé 2"]
}`;

      const fullPrompt = `${SYSTEM_PROMPT}${userContext}${contextPrompt}${canvasContext}${calculationPrompt}

NOUVELLE QUESTION DE L'ENFANT : ${question}

⚠️⚠️⚠️ RÈGLES ABSOLUES :
1. Réponds UNIQUEMENT à cette question : "${question}"
2. Ne fais PAS référence à des questions précédentes si elles sont sur un sujet différent
3. Si la question est sur le français, réponds sur le français, pas sur les mathématiques
4. Si la question est sur les mathématiques, réponds sur les mathématiques, pas sur le français
5. Adapte tes dessins et explications à la question posée, pas aux conversations précédentes

⚠️⚠️⚠️ OBLIGATION ABSOLUE - EXEMPLES ET DESSINS DANS LE TABLEAU :

TU DOIS ABSOLUMENT :
1. Créer et donner au moins 2-3 exemples CONCRETS adaptés à la question de l'enfant
2. ÉCRIRE ces exemples dans le tableau (zone Indications, x entre 420-780, y entre 50-450) avec des instructions de dessin dans drawing.steps
3. MINIMUM 3-5 étapes de type "text" dans drawing.steps pour chaque réponse
4. Mettre en ROUGE (#ef4444) les mots/concepts IMPORTANTS dans tes exemples écrits dans le tableau
5. Dans le hint, utilise <red>mot</red> pour mettre en rouge les mots clés dans le texte du chat
6. Utiliser d'autres couleurs (BLEU #3b82f6, VERT #10b981, BLANC #ffffff) pour les explications
7. Pour CHAQUE question, même si ce n'est pas des mathématiques, tu DOIS écrire des exemples dans le tableau
8. ⚠️ IMPORTANT : Commence toujours en y=50 pour le premier élément, puis espace de 40-50px entre chaque ligne. Ne dépasse JAMAIS y=450
9. ⚠️ IMPORTANT : Les coordonnées x doivent être entre 420 et 780 (zone Indications avec marges de sécurité)

⚠️⚠️⚠️ SI TU NE DONNES PAS D'EXEMPLES ÉCRITS DANS LE TABLEAU (drawing.steps avec au moins 3-5 étapes de texte), TA RÉPONSE EST INUTILE !

EXEMPLE DE STRUCTURE OBLIGATOIRE :
- hint : "Un <red>déterminant</red> est un mot qui précède un nom. Voici des exemples : 'LE chat', 'UNE pomme', 'MES jouets'. Regarde les exemples dans le tableau !"
- drawing.steps : [
  {"type": "text", "color": "#ffffff", "text": "Exemples :", "position": {"x": 420, "y": 50}, "fontSize": 18},
  {"type": "text", "color": "#ef4444", "text": "LE", "position": {"x": 420, "y": 90}, "fontSize": 24},
  {"type": "text", "color": "#ffffff", "text": "chat", "position": {"x": 480, "y": 90}, "fontSize": 20},
  {"type": "text", "color": "#ef4444", "text": "UNE", "position": {"x": 420, "y": 140}, "fontSize": 24},
  {"type": "text", "color": "#ffffff", "text": "pomme", "position": {"x": 490, "y": 140}, "fontSize": 20}
]
- keyPoints : ["déterminant", "LE", "UNE"]

⚠️ RÈGLES DE COORDONNÉES STRICTES :
- x : entre 420 et 780 (zone Indications avec marges de sécurité)
- y : commence à 50, puis +40-50px par ligne (50, 90, 140, 190, 240, etc.)
- Ne JAMAIS dépasser y=450 (limite du canvas)
- Espacer les éléments verticalement de 40-50px pour la lisibilité

STRUCTURE DE RÉPONSE :
- hint : Ton explication pédagogique avec <red>mots clés</red> en rouge. Inclus 2-3 exemples concrets dans ton texte.
- drawing.steps : Tableau d'instructions pour écrire tes exemples dans le tableau (zone x entre 400-800)
- keyPoints : Liste des 2-4 éléments les plus importants de ta réponse
- encouragement : Message d'encouragement personnalisé

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après. Format exact :
${jsonExample}

Réponds maintenant :`;

      console.log("🤖 Appel à Ollama...");
      console.log("📍 URL:", OLLAMA_URL);
      console.log("🤖 Modèle:", OLLAMA_MODEL);
      console.log("📝 Taille du prompt:", fullPrompt.length, "caractères");

      const controller = new AbortController();
      // Timeout de 180 secondes (3 minutes) pour les modèles locaux qui peuvent être lents
      const timeoutId = setTimeout(() => {
        console.warn(
          "⏱️ Timeout atteint après 3 minutes, annulation de la requête..."
        );
        controller.abort();
      }, 180000);

      const ollamaResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: fullPrompt,
          stream: false,
          format: "json",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("✅ Réponse Ollama reçue, status:", ollamaResponse.status);

      if (!ollamaResponse.ok) {
        const errorText = await ollamaResponse.text();
        console.error("❌ Erreur Ollama - Status:", ollamaResponse.status);
        console.error("❌ Erreur Ollama - Response:", errorText);
        throw new Error(
          `Ollama error (${ollamaResponse.status}): ${
            ollamaResponse.statusText
          }. ${errorText.substring(0, 200)}`
        );
      }

      const ollamaData = await ollamaResponse.json();
      const responseText = ollamaData.response || ollamaData.text || "";

      console.log(
        "📥 Réponse brute Ollama (premiers 500 caractères):",
        responseText.substring(0, 500)
      );
      console.log(
        "📏 Taille totale de la réponse:",
        responseText.length,
        "caractères"
      );

      // Parser le JSON de la réponse
      // Parfois Ollama ajoute du texte avant/après le JSON
      let parsedResponse = null;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
          console.log("JSON parsé:", JSON.stringify(parsedResponse, null, 2));
        } catch (parseError) {
          console.error("Erreur de parsing JSON:", parseError);
          console.error("JSON problématique:", jsonMatch[0]);
        }
      }

      if (parsedResponse) {
        console.log("✅ JSON valide reçu");
        console.log(
          "📊 Nombre d'étapes de dessin:",
          parsedResponse.drawing?.steps?.length || 0
        );
        console.log(
          "📝 Étapes de texte:",
          parsedResponse.drawing?.steps?.filter((s: any) => s.type === "text")
            .length || 0
        );
        aiResponse = parsedResponse;
      } else {
        // Si pas de JSON valide, utiliser le texte brut de l'IA
        console.log(
          "⚠️ Pas de JSON valide, utilisation du texte brut de l'IA..."
        );

        // Pour les calculs uniquement, utiliser la fonction de décomposition
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

        // Utiliser le texte de l'IA comme hint (sans modification)
        aiResponse = {
          hint: responseText || "Je réfléchis à ta question...",
          drawing: {
            steps: drawingSteps,
          },
          encouragement: "Continue de réfléchir !",
        };
      }
    } catch (ollamaError: unknown) {
      console.error("❌ Erreur Ollama capturée dans le catch");
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
          "⏱️ Timeout Ollama : La requête a pris plus de 45 secondes"
        );
      }

      // Vérifier si c'est une erreur réseau
      if (
        ollamaError instanceof Error &&
        (ollamaError.message.includes("fetch") ||
          ollamaError.message.includes("network"))
      ) {
        console.error(
          "🌐 Erreur réseau détectée - Vérifiez que Ollama est bien démarré et accessible à",
          OLLAMA_URL
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
          const MAX_Y = 500;

          if (step.points) {
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
    }

    // Extraire les éléments clés du hint si présents dans <red> tags
    if (aiResponse.hint && !aiResponse.keyPoints) {
      const keyPointsMatch = aiResponse.hint.match(/<red>(.*?)<\/red>/g);
      if (keyPointsMatch) {
        aiResponse.keyPoints = keyPointsMatch.map((tag) =>
          tag.replace(/<\/?red>/g, "").trim()
        );
      }
    }

    // S'assurer que keyPoints existe même si vide
    if (!aiResponse.keyPoints) {
      aiResponse.keyPoints = [];
    }

    // Sauvegarder la conversation dans la base de données
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
    }

    return NextResponse.json(aiResponse);
  } catch (e) {
    console.error("API error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
