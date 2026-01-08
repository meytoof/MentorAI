"use client";

import { useEffect, useRef, useState } from "react";

export default function WhiteboardPage() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [question, setQuestion] = useState("");
	const [hint, setHint] = useState<string | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		const ctx = canvas.getContext("2d");
		if (ctx) {
			ctx.scale(dpr, dpr);
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.strokeStyle = "#f3f4f6"; // gris clair
			ctx.lineWidth = 3;
		}
	}, []);

	function getCtx() {
		return canvasRef.current?.getContext("2d") ?? null;
	}

	function onPointerDown(e: React.PointerEvent) {
		setIsDrawing(true);
		const ctx = getCtx();
		if (!ctx || !canvasRef.current) return;
		const rect = canvasRef.current.getBoundingClientRect();
		ctx.beginPath();
		ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
	}
	function onPointerMove(e: React.PointerEvent) {
		if (!isDrawing) return;
		const ctx = getCtx();
		if (!ctx || !canvasRef.current) return;
		const rect = canvasRef.current.getBoundingClientRect();
		ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
		ctx.stroke();
	}
	function onPointerUp() {
		setIsDrawing(false);
	}

	async function askAI() {
		setHint(null);
		const res = await fetch("/api/assist", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ question }),
		});
		if (res.ok) {
			const data = await res.json();
			setHint(data.hint ?? "");
		}
	}

	function clearCanvas() {
		const ctx = getCtx();
		const cvs = canvasRef.current;
		if (!ctx || !cvs) return;
		ctx.clearRect(0, 0, cvs.width, cvs.height);
	}

	return (
		<div className="mx-auto max-w-5xl px-4 py-8">
			<h1 className="mb-4 text-xl font-semibold">Tableau</h1>
			<div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
				<input className="rounded-md border border-gray-300 bg-transparent px-3 py-2" placeholder="Pose ta question (ex: Résous 12 + 7)" value={question} onChange={(e) => setQuestion(e.target.value)} />
				<button onClick={askAI} className="rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800">Demander un indice</button>
			</div>
			{hint && <div className="mb-4 rounded-md border border-gray-800 bg-neutral-900/40 p-3 text-sm text-gray-200">{hint}</div>}
			<div className="rounded-md border border-gray-800 bg-neutral-900/40 p-2">
				<div className="mb-2 flex justify-end gap-2">
					<button onClick={clearCanvas} className="rounded-md border border-gray-700 px-3 py-1 text-sm text-gray-200 hover:bg-white/5">Effacer</button>
				</div>
				<div style={{ height: 500 }}>
					<canvas
						ref={canvasRef}
						className="h-full w-full touch-none"
						onPointerDown={onPointerDown}
						onPointerMove={onPointerMove}
						onPointerUp={onPointerUp}
						onPointerLeave={onPointerUp}
					/>
				</div>
			</div>
		</div>
	);
}











