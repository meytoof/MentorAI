// Types pour les instructions de dessin de l'IA

export type DrawingStepType = "line" | "circle" | "rectangle" | "text" | "arrow" | "clear";

export interface Point {
	x: number;
	y: number;
}

export interface DrawingStep {
	type: DrawingStepType;
	color: string;
	width?: number;
	// Pour line
	points?: Point[];
	// Pour circle
	center?: Point;
	radius?: number;
	fill?: boolean;
	// Pour rectangle
	start?: Point;
	end?: Point;
	// Pour text
	text?: string;
	position?: Point;
	fontSize?: number;
	// Pour arrow
	from?: Point;
	to?: Point;
}

export interface AIDrawingResponse {
	/** Texte affiché à l'enfant (prioritaire). Renseigné par l'IA pour qu'on n'affiche que ce message, sans méta-analyse. */
	messageEnfant?: string;
	/** Bulles séparées (2-4 messages courts) pour questions "c'est quoi X" / "comment trouver Y". Prioritaire si présent. */
	messageBubbles?: string[];
	hint: string;
	drawing?: {
		steps: DrawingStep[];
	};
	encouragement?: string;
	keyPoints?: string[]; // Éléments clés à mettre en évidence
	// Segments textuels importants extraits du devoir ou de l'explication
	// Utilisés pour le surlignage interactif + mini-leçons au survol
	segments?: {
		id: string;
		text: string;
		role: "consigne" | "indice" | "mot_clef";
		shortTip: string;
		lesson: string;
		level?: "CP" | "CE1" | "CE2" | "CM1" | "CM2";
	}[];
}


