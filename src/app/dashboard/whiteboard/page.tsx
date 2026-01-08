"use client";

import { AIDrawingResponse, DrawingStep } from "@/types/drawing";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  keyPoints?: string[];
  timestamp: Date;
}

export default function WhiteboardPage() {
  // Canvas unique divisé en 2 zones
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const userDrawingRef = useRef<ImageData | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAIDrawing, setIsAIDrawing] = useState(false);
  const [autoDrawEnabled, setAutoDrawEnabled] = useState(true);
  const [hasUserDrawing, setHasUserDrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dimensions du canvas
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const MIDDLE_X = CANVAS_WIDTH / 2; // Ligne de séparation au milieu

  // Initialisation du canvas unique
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);

      // Fond noir
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Ligne de séparation verticale au milieu
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(MIDDLE_X, 0);
      ctx.lineTo(MIDDLE_X, CANVAS_HEIGHT);
      ctx.stroke();

      // Labels des zones
      ctx.fillStyle = "#666666";
      ctx.font = "14px Arial";
      ctx.fillText("Exemples", 10, 20);
      ctx.fillText("Indications", MIDDLE_X + 10, 20);

      // Configuration du dessin utilisateur (zone gauche)
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
    }
  }, [MIDDLE_X]);

  // Scroll automatique vers le bas du chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function getCtx() {
    return canvasRef.current?.getContext("2d") ?? null;
  }

  function onPointerDown(e: React.PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Ne permettre le dessin que dans la zone gauche (Exemples)
    if (x > MIDDLE_X) return;

    setIsDrawing(true);
    const ctx = getCtx();
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, e.clientY - rect.top);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Limiter le dessin à la zone gauche
    if (x > MIDDLE_X) {
      setIsDrawing(false);
      return;
    }

    const ctx = getCtx();
    if (!ctx) return;
    ctx.lineTo(x, e.clientY - rect.top);
    ctx.stroke();
  }

  function onPointerUp() {
    setIsDrawing(false);
  }

  // Fonctions de dessin pour l'IA
  function drawLine(ctx: CanvasRenderingContext2D, step: DrawingStep) {
    if (!step.points || step.points.length < 2) return;
    ctx.strokeStyle = step.color;
    ctx.lineWidth = step.width || 2;
    ctx.beginPath();
    ctx.moveTo(step.points[0].x, step.points[0].y);
    for (let i = 1; i < step.points.length; i++) {
      ctx.lineTo(step.points[i].x, step.points[i].y);
    }
    ctx.stroke();
  }

  function drawCircle(ctx: CanvasRenderingContext2D, step: DrawingStep) {
    if (!step.center || !step.radius) return;
    ctx.strokeStyle = step.color;
    ctx.fillStyle = step.color;
    ctx.lineWidth = step.width || 2;
    ctx.beginPath();
    ctx.arc(step.center.x, step.center.y, step.radius, 0, Math.PI * 2);
    if (step.fill) {
      ctx.fill();
    } else {
      ctx.stroke();
    }
  }

  function drawRectangle(ctx: CanvasRenderingContext2D, step: DrawingStep) {
    if (!step.start || !step.end) return;
    ctx.strokeStyle = step.color;
    ctx.fillStyle = step.color;
    ctx.lineWidth = step.width || 2;
    const width = step.end.x - step.start.x;
    const height = step.end.y - step.start.y;
    if (step.fill) {
      ctx.fillRect(step.start.x, step.start.y, width, height);
    } else {
      ctx.strokeRect(step.start.x, step.start.y, width, height);
    }
  }

  function drawText(ctx: CanvasRenderingContext2D, step: DrawingStep) {
    if (!step.text || !step.position) {
      console.warn("⚠️ drawText: step.text ou step.position manquant", step);
      return;
    }

    // Vérifier que la couleur est valide (pas noir sur fond noir)
    const color = step.color || "#ffffff";
    if (color === "#000000" || color === "black" || !color) {
      console.warn(
        "⚠️ drawText: couleur noire détectée, utilisation de blanc par défaut",
        step
      );
      ctx.fillStyle = "#ffffff";
    } else {
      ctx.fillStyle = color;
    }

    ctx.font = `${step.fontSize || 16}px Arial`;

    // Le canvas utilise déjà ctx.scale(dpr, dpr) dans l'initialisation
    // Donc on utilise les coordonnées directement sans multiplier par dpr
    const x = step.position.x;
    const y = step.position.y;

    console.log(
      `📝 drawText: "${step.text}" à (${x}, ${y}) avec couleur ${ctx.fillStyle}`
    );

    ctx.fillText(step.text, x, y);
  }

  function drawArrow(ctx: CanvasRenderingContext2D, step: DrawingStep) {
    if (!step.from || !step.to) return;
    ctx.strokeStyle = step.color || "#ffffff";
    ctx.fillStyle = step.color || "#ffffff";
    ctx.lineWidth = step.width || 2;

    ctx.beginPath();
    ctx.moveTo(step.from.x, step.from.y);
    ctx.lineTo(step.to.x, step.to.y);
    ctx.stroke();

    const angle = Math.atan2(step.to.y - step.from.y, step.to.x - step.from.x);
    const arrowLength = 15;
    const arrowAngle = Math.PI / 6;

    ctx.beginPath();
    ctx.moveTo(step.to.x, step.to.y);
    ctx.lineTo(
      step.to.x - arrowLength * Math.cos(angle - arrowAngle),
      step.to.y - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(step.to.x, step.to.y);
    ctx.lineTo(
      step.to.x - arrowLength * Math.cos(angle + arrowAngle),
      step.to.y - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();
  }

  async function drawAIDrawing(steps: DrawingStep[]) {
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;

    setIsAIDrawing(true);

    // Effacer la zone Indications avant de dessiner la nouvelle réponse
    clearIndicationsZone();

    // Sauvegarder l'état actuel du canvas (zone gauche uniquement)
    if (canvasRef.current) {
      // Sauvegarder uniquement la zone gauche (Exemples)
      const leftZoneImageData = ctx.getImageData(
        0,
        0,
        MIDDLE_X * (window.devicePixelRatio || 1),
        CANVAS_HEIGHT * (window.devicePixelRatio || 1)
      );
      userDrawingRef.current = leftZoneImageData;
      setHasUserDrawing(true);
    }

    // IMPORTANT: Les coordonnées de l'IA sont déjà entre 400-800 (zone Indications)
    // On ne doit PAS ajouter MIDDLE_X car elles sont déjà dans la bonne zone
    // On vérifie juste qu'elles sont bien dans la plage valide
    const adjustedSteps = steps.map((step, index) => {
      const adjusted: DrawingStep = { ...step };

      console.log(
        `🔍 Étape ${index + 1}/${steps.length}:`,
        step.type,
        "couleur:",
        step.color
      );

      // Ajuster les coordonnées pour qu'elles soient toujours dans la zone Indications (400-800)
      // et éviter les dépassements
      const adjustX = (x: number) => {
        if (x < MIDDLE_X) {
          // Coordonnées pour la zone gauche, on les déplace vers la zone droite
          return MIDDLE_X + 20; // Commencer à 20px après la ligne de séparation
        } else if (x >= CANVAS_WIDTH - 20) {
          // Coordonnées trop à droite, on les limite avec une marge
          return CANVAS_WIDTH - 20;
        }
        // Déjà dans la zone droite (400-800), on les garde telles quelles
        return x;
      };

      // Ajuster Y pour éviter les dépassements verticaux
      const adjustY = (y: number) => {
        if (y < 30) {
          // Trop haut (sous les labels), commencer à 30
          return 30;
        } else if (y > CANVAS_HEIGHT - 20) {
          // Trop bas, limiter avec une marge
          return CANVAS_HEIGHT - 20;
        }
        return y;
      };

      if (step.points) {
        adjusted.points = step.points.map((p) => ({
          x: adjustX(p.x),
          y: adjustY(p.y),
        }));
      }
      if (step.center) {
        adjusted.center = {
          x: adjustX(step.center.x),
          y: adjustY(step.center.y),
        };
      }
      if (step.position) {
        const originalX = step.position.x;
        const originalY = step.position.y;
        const adjustedX = adjustX(originalX);
        const adjustedY = adjustY(originalY);
        adjusted.position = {
          x: adjustedX,
          y: adjustedY,
        };
        console.log(
          `📍 Position texte "${step.text}": (${originalX}, ${originalY}) -> (${adjustedX}, ${adjustedY})`
        );
      }
      if (step.from) {
        adjusted.from = {
          x: adjustX(step.from.x),
          y: adjustY(step.from.y),
        };
      }
      if (step.to) {
        adjusted.to = {
          x: adjustX(step.to.x),
          y: adjustY(step.to.y),
        };
      }
      if (step.start) {
        adjusted.start = {
          x: adjustX(step.start.x),
          y: adjustY(step.start.y),
        };
      }
      if (step.end) {
        adjusted.end = {
          x: adjustX(step.end.x),
          y: adjustY(step.end.y),
        };
      }

      return adjusted;
    });

    for (let i = 0; i < adjustedSteps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const step = adjustedSteps[i];

      // Sauvegarder l'état du contexte avant chaque dessin
      ctx.save();

      try {
        switch (step.type) {
          case "line":
            drawLine(ctx, step);
            break;
          case "circle":
            drawCircle(ctx, step);
            break;
          case "rectangle":
            drawRectangle(ctx, step);
            break;
          case "text":
            drawText(ctx, step);
            break;
          case "arrow":
            drawArrow(ctx, step);
            break;
          default:
            console.warn("⚠️ Type de step inconnu:", step.type);
        }
      } catch (error) {
        console.error(
          "❌ Erreur lors du dessin de l'étape",
          i,
          ":",
          error,
          step
        );
      } finally {
        // Restaurer l'état du contexte après chaque dessin
        ctx.restore();
      }
    }

    setIsAIDrawing(false);
  }

  function getCanvasAsImage(): string | null {
    // Prendre l'image de la zone gauche (Exemples) uniquement
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Extraire seulement la zone gauche (Exemples)
    const dpr = window.devicePixelRatio || 1;
    const leftZoneImageData = ctx.getImageData(
      0,
      0,
      MIDDLE_X * dpr,
      CANVAS_HEIGHT * dpr
    );

    let hasContent = false;
    for (let i = 0; i < leftZoneImageData.data.length; i += 16) {
      const r = leftZoneImageData.data[i];
      const g = leftZoneImageData.data[i + 1];
      const b = leftZoneImageData.data[i + 2];
      const a = leftZoneImageData.data[i + 3];

      if (a > 0 && (r < 250 || g < 250 || b < 250)) {
        hasContent = true;
        break;
      }
    }

    if (!hasContent) return null;

    try {
      // Créer un canvas temporaire pour la zone gauche
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = MIDDLE_X;
      tempCanvas.height = CANVAS_HEIGHT;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return null;

      tempCtx.drawImage(
        canvas,
        0,
        0,
        MIDDLE_X * dpr,
        CANVAS_HEIGHT * dpr,
        0,
        0,
        MIDDLE_X,
        CANVAS_HEIGHT
      );
      return tempCanvas.toDataURL("image/png", 0.8);
    } catch (e) {
      console.error("Error converting canvas to image:", e);
      return null;
    }
  }

  // Fonction pour formater le texte avec les éléments en rouge et désérialiser le HTML
  function formatMessage(content: string): React.ReactElement {
    const parts: (string | React.ReactElement)[] = [];
    let processedContent = content;
    let keyCounter = 0;

    // Décoder les entités HTML courantes
    const htmlEntities: { [key: string]: string } = {
      "&#39;": "'",
      "&apos;": "'",
      "&quot;": '"',
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&nbsp;": " ",
    };
    Object.entries(htmlEntities).forEach(([entity, char]) => {
      processedContent = processedContent.replace(
        new RegExp(entity, "g"),
        char
      );
    });

    // Remplacer <br> et <br/> par des sauts de ligne
    processedContent = processedContent.replace(/<br\s*\/?>/gi, "\n");

    // Traiter les balises <strong> et <b>
    processedContent = processedContent.replace(
      /<(strong|b)>(.*?)<\/\1>/gi,
      (match, tag, text) => {
        parts.push(
          <strong key={`strong-${keyCounter++}`} className="font-bold">
            {text}
          </strong>
        );
        return `__STRONG_${keyCounter - 1}__`;
      }
    );

    // Traiter les balises <em> et <i>
    processedContent = processedContent.replace(
      /<(em|i)>(.*?)<\/\1>/gi,
      (match, tag, text) => {
        parts.push(
          <em key={`em-${keyCounter++}`} className="italic">
            {text}
          </em>
        );
        return `__EM_${keyCounter - 1}__`;
      }
    );

    // Traiter les balises <red> (notre format personnalisé)
    const redRegex = /<red>(.*?)<\/red>/g;
    let match;
    let lastIndex = 0;
    const redParts: (string | React.ReactElement)[] = [];

    while ((match = redRegex.exec(processedContent)) !== null) {
      // Ajouter le texte avant le tag
      if (match.index > lastIndex) {
        const beforeText = processedContent.substring(lastIndex, match.index);
        // Remplacer les placeholders de strong/em
        const beforeParts = beforeText.split(/(__STRONG_\d+__|__EM_\d+__)/);
        beforeParts.forEach((part) => {
          if (part.startsWith("__STRONG_")) {
            const id = parseInt(
              part.replace("__STRONG_", "").replace("__", "")
            );
            redParts.push(
              parts.find((p, i) => i === id && typeof p !== "string") || part
            );
          } else if (part.startsWith("__EM_")) {
            const id = parseInt(part.replace("__EM_", "").replace("__", ""));
            redParts.push(
              parts.find((p, i) => i === id && typeof p !== "string") || part
            );
          } else if (part) {
            redParts.push(part);
          }
        });
      }
      // Ajouter le texte en rouge
      redParts.push(
        <span key={`red-${keyCounter++}`} className="text-red-400 font-bold">
          {match[1]}
        </span>
      );
      lastIndex = redRegex.lastIndex;
    }

    // Ajouter le reste du texte
    if (lastIndex < processedContent.length) {
      const afterText = processedContent.substring(lastIndex);
      const afterParts = afterText.split(/(__STRONG_\d+__|__EM_\d+__)/);
      afterParts.forEach((part) => {
        if (part.startsWith("__STRONG_")) {
          const id = parseInt(part.replace("__STRONG_", "").replace("__", ""));
          redParts.push(
            parts.find((p, i) => i === id && typeof p !== "string") || part
          );
        } else if (part.startsWith("__EM_")) {
          const id = parseInt(part.replace("__EM_", "").replace("__", ""));
          redParts.push(
            parts.find((p, i) => i === id && typeof p !== "string") || part
          );
        } else if (part) {
          redParts.push(part);
        }
      });
    }

    // Si on a trouvé des balises <red>, utiliser redParts, sinon utiliser processedContent directement
    if (redParts.length > 0) {
      return <>{redParts}</>;
    }

    // Sinon, traiter processedContent normalement (avec sauts de ligne)
    const finalParts = processedContent.split(/(__STRONG_\d+__|__EM_\d+__)/);
    const result: (string | React.ReactElement)[] = [];
    finalParts.forEach((part) => {
      if (part.startsWith("__STRONG_")) {
        const id = parseInt(part.replace("__STRONG_", "").replace("__", ""));
        const strongElement = parts.find(
          (p, i) => i === id && typeof p !== "string"
        );
        if (strongElement) result.push(strongElement);
      } else if (part.startsWith("__EM_")) {
        const id = parseInt(part.replace("__EM_", "").replace("__", ""));
        const emElement = parts.find(
          (p, i) => i === id && typeof p !== "string"
        );
        if (emElement) result.push(emElement);
      } else if (part) {
        // Diviser par les sauts de ligne pour les rendre visibles
        const lines = part.split("\n");
        lines.forEach((line, lineIdx) => {
          if (lineIdx > 0) result.push(<br key={`br-${keyCounter++}`} />);
          result.push(line);
        });
      }
    });

    return <>{result.length > 0 ? result : <>{content}</>}</>;
  }

  async function askAI() {
    if (!question.trim()) return;

    const userQuestion = question.trim();
    console.log(
      "🎯 Frontend: Appel à l'API /api/assist avec la question:",
      userQuestion
    );
    setQuestion("");

    // Ajouter la question de l'utilisateur au chat
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userQuestion,
        timestamp: new Date(),
      },
    ]);

    setIsLoading(true);

    try {
      const canvasImage = getCanvasAsImage();

      const controller = new AbortController();
      // Timeout de 200 secondes (3min20) pour laisser le temps au backend (180s) de répondre
      const timeoutId = setTimeout(() => {
        console.warn("⏱️ Frontend: Timeout atteint après 200 secondes");
        controller.abort();
      }, 200000);

      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQuestion,
          canvasImage,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data: AIDrawingResponse = await res.json();

        // Ajouter la réponse de l'IA au chat
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.hint ?? "",
            keyPoints: data.keyPoints,
            timestamp: new Date(),
          },
        ]);

        // Ajouter l'encouragement si présent
        if (data.encouragement) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `✨ ${data.encouragement}`,
              timestamp: new Date(),
            },
          ]);
        }

        // Dessiner automatiquement si activé
        console.log("🎨 Frontend: Vérification des drawing.steps...");
        console.log("🎨 autoDrawEnabled:", autoDrawEnabled);
        console.log("🎨 Nombre de steps:", data.drawing?.steps?.length || 0);
        if (
          autoDrawEnabled &&
          data.drawing?.steps &&
          data.drawing.steps.length > 0
        ) {
          console.log(
            "🎨 Démarrage du dessin avec",
            data.drawing.steps.length,
            "étapes"
          );
          await drawAIDrawing(data.drawing.steps);
          console.log("✅ Dessin terminé");
        } else {
          if (!autoDrawEnabled) {
            console.warn("⚠️ autoDrawEnabled est désactivé");
          }
          if (!data.drawing?.steps || data.drawing.steps.length === 0) {
            console.warn(
              "⚠️ Aucun drawing.steps trouvé dans la réponse de l'IA"
            );
          }
        }
      } else {
        await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Désolé, une erreur est survenue. Réessaie !",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error: unknown) {
      console.error("Erreur:", error);
      if (error instanceof Error && error.name === "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "L'IA met trop de temps à répondre. Réessaie avec une question plus simple.",
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Désolé, une erreur est survenue. Réessaie !",
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function clearIndicationsZone() {
    const ctx = getCtx();
    if (!ctx) return;

    // Effacer uniquement la zone droite (Indications)
    ctx.fillStyle = "#000000";
    ctx.fillRect(MIDDLE_X, 0, CANVAS_WIDTH - MIDDLE_X, CANVAS_HEIGHT);

    // Redessiner la ligne de séparation
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MIDDLE_X, 0);
    ctx.lineTo(MIDDLE_X, CANVAS_HEIGHT);
    ctx.stroke();

    // Redessiner le label "Indications"
    ctx.fillStyle = "#666666";
    ctx.font = "14px Arial";
    ctx.fillText("Indications", MIDDLE_X + 10, 20);
  }

  function clearAIDrawing() {
    const ctx = getCtx();
    if (!ctx || !userDrawingRef.current) return;
    ctx.putImageData(userDrawingRef.current, 0, 0);
    setHasUserDrawing(false);
  }

  function clearAllCanvas() {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // Redessiner la ligne de séparation
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MIDDLE_X, 0);
    ctx.lineTo(MIDDLE_X, CANVAS_HEIGHT);
    ctx.stroke();
    // Redessiner les labels
    ctx.fillStyle = "#666666";
    ctx.font = "14px Arial";
    ctx.fillText("Exemples", 10, 20);
    ctx.fillText("Indications", MIDDLE_X + 10, 20);
    userDrawingRef.current = null;
    setHasUserDrawing(false);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      {/* Colonne gauche : Tableau unique divisé en 2 zones */}
      <div className="flex flex-col w-3/4 border border-gray-800 rounded-lg bg-neutral-900/40 p-4">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Tableau</h2>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={autoDrawEnabled}
                onChange={(e) => setAutoDrawEnabled(e.target.checked)}
                className="rounded"
              />
              <span>Dessin auto</span>
            </label>
            {hasUserDrawing && (
              <button
                onClick={clearAIDrawing}
                className="rounded-md border border-yellow-700 px-3 py-1 text-sm text-yellow-200 hover:bg-yellow-900/20"
              >
                Effacer l&apos;aide
              </button>
            )}
            <button
              onClick={clearAllCanvas}
              className="rounded-md border border-gray-700 px-3 py-1 text-sm text-gray-200 hover:bg-white/5"
            >
              Tout effacer
            </button>
          </div>
        </div>
        <div className="flex-1 bg-black rounded overflow-hidden border-2 border-gray-700 relative">
          <canvas
            ref={canvasRef}
            className="h-full w-full touch-none"
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />
        </div>
      </div>

      {/* Colonne droite : Chat (réduit de moitié) */}
      <div className="flex flex-col w-1/4 border border-gray-800 rounded-lg bg-neutral-900/40">
        <div className="p-3 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Chat</h2>
        </div>

        {/* Zone de messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-4 text-xs">
              <p>Pose ta question</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[90%] rounded-lg p-2 text-xs ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 text-gray-200"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {formatMessage(msg.content)}
                </div>
                {msg.keyPoints && msg.keyPoints.length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-gray-700">
                    <div className="text-[10px] text-gray-400 mb-0.5">
                      Points clés :
                    </div>
                    <div className="flex flex-wrap gap-0.5">
                      {msg.keyPoints.map((point, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded"
                        >
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-neutral-800 text-gray-200 rounded-lg p-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="animate-spin h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                  <span>Réflexion...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex gap-1.5">
            <input
              className="flex-1 rounded-md border border-gray-700 bg-neutral-800 px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && askAI()}
              disabled={isLoading || isAIDrawing}
            />
            <button
              onClick={askAI}
              disabled={isLoading || isAIDrawing || !question.trim()}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
