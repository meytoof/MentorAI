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
	hint: string;
	drawing?: {
		steps: DrawingStep[];
	};
	encouragement?: string;
	keyPoints?: string[]; // Éléments clés à mettre en évidence
}


