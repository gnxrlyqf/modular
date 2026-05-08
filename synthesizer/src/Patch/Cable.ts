// Draws all cables and endpoints for the modular scene
import { getAllPortViewportCoordinates, type ModulePorts } from "../Utils/portViewportCoordinates";
import type { Module, ModuleType } from "../Modules/Modules";
import { moduleObjects } from "../Scene/DockItems";

const PORT_OFFSETS = {
  oscillator: {
    output: { x: moduleObjects.oscillator.w - 4, y: moduleObjects.oscillator.h - 56 },
    frequency: { x: moduleObjects.oscillator.w / 2, y: 110 },
  },
  gain: {
    input: { x: 4, y: moduleObjects.gain.h - 120 },
    output: { x: moduleObjects.gain.w - 4, y: moduleObjects.gain.h - 56 },
    gain: { x: moduleObjects.gain.w / 2, y: 110 },
  },
  envelope: {
    trigger: { x: 4, y: moduleObjects.envelope.h - 120 },
    output: { x: moduleObjects.envelope.w - 4, y: moduleObjects.envelope.h - 56 },
    attack: { x: moduleObjects.envelope.w / 2, y: 110 },
    sustain: { x: moduleObjects.envelope.w / 2, y: 110 },
    decay: { x: moduleObjects.envelope.w / 2, y: 110 },
    release: { x: moduleObjects.envelope.w / 2, y: 110 },
  },
  output: {
    input: { x: 4, y: moduleObjects.output.h - 68 },
    master: { x: moduleObjects.output.w / 2, y: 110 },
  },
  lfo: {
    output: { x: moduleObjects.lfo.w - 4, y: moduleObjects.lfo.h - 56 },
    freq: { x: moduleObjects.lfo.w / 2, y: 110 },
  },
  filter: {
    input: { x: 4, y: moduleObjects.filter.h - 120 },
    output: { x: moduleObjects.filter.w - 4, y: moduleObjects.filter.h - 56 },
    cutoff: { x: moduleObjects.filter.w / 2, y: 110 },
    q: { x: moduleObjects.filter.w / 2, y: 110 },
  },
  distortion: {
    input: { x: 4, y: moduleObjects.distortion.h - 120 },
    output: { x: moduleObjects.distortion.w - 4, y: moduleObjects.distortion.h - 56 },
    drive: { x: moduleObjects.distortion.w / 2, y: 110 },
  },
  modulator: {
    "mod in": { x: 4, y: moduleObjects.modulator.h - 120 },
    carrier: { x: 4, y: moduleObjects.modulator.h - 120 },
    output: { x: moduleObjects.modulator.w - 4, y: moduleObjects.modulator.h - 56 },
    depth: { x: moduleObjects.modulator.w / 2, y: 110 },
  },
};

type Cable = {
  id: string;
  from: string;
  to: string;
};

function randomCableColor() {
	const hue = Math.floor(Math.random() * 360);
	return `hsl(${hue} 85% 65%)`;
}

function drawFrame({
	canvas,
	dotCanvas,
	modules,
	cables,
	camera,
}: {
	canvas: HTMLCanvasElement | null;
	dotCanvas: HTMLCanvasElement | null;
	modules: Module[];
	cables: Cable[];
	camera: { x: number; y: number; scale?: number };
}) {
	if (!canvas || !dotCanvas) return;

	const frameWithColorState = drawFrame as typeof drawFrame & {
		cableColors?: Map<string, string>;
	};
	const cableColors = frameWithColorState.cableColors ?? new Map<string, string>();
	frameWithColorState.cableColors = cableColors;

	const currentCableIds = new Set(cables.map((cable) => cable.id));
	for (const id of Array.from(cableColors.keys())) {
		if (!currentCableIds.has(id)) cableColors.delete(id);
	}
	for (const cable of cables) {
		if (!cableColors.has(cable.id)) {
			cableColors.set(cable.id, randomCableColor());
		}
	}

	const ctx = canvas.getContext("2d");
	const dotCtx = dotCanvas.getContext("2d");
	if (!ctx || !dotCtx) return;

	const rect = canvas.getBoundingClientRect();
	const dpr = window.devicePixelRatio || 1;

	canvas.width = Math.max(1, Math.floor(rect.width * dpr));
	canvas.height = Math.max(1, Math.floor(rect.height * dpr));
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.clearRect(0, 0, rect.width, rect.height);

	dotCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
	dotCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
	dotCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
	dotCtx.clearRect(0, 0, rect.width, rect.height);

	const portViewportCoordinates = getAllPortViewportCoordinates(
		modules,
		camera,
		PORT_OFFSETS as Record<ModuleType, ModulePorts>
	);

	const portsByModule = new Map(
		portViewportCoordinates.map((entry) => [entry.moduleId, entry.ports])
	);

	for (const cable of cables) {
		const from = cable.from.split(".");
		const to = cable.to.split(".");
		if (from.length !== 2 || to.length !== 2) continue;
		const fromPoint = portsByModule.get(from[0])?.[from[1]];
		const toPoint = portsByModule.get(to[0])?.[to[1]];
		if (!fromPoint || !toPoint) continue;

		drawCable(
			ctx,
			fromPoint.x,
			fromPoint.y,
			toPoint.x,
			toPoint.y,
			cableColors.get(cable.id) ?? "#FFFFFF",
			6
		);

		drawCableEndpointDots(
			dotCtx,
			fromPoint.x,
			fromPoint.y,
			toPoint.x,
			toPoint.y,
			cableColors.get(cable.id) ?? "#FFFFFF",
			12
		);
	}
}

function drawCable(
	ctx: CanvasRenderingContext2D,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	color = "#FFFFFF",
	thickness = 6
) {

	const dx = Math.abs(x2 - x1);
	const controlOffset = Math.max(40, dx * 0.5);

	ctx.strokeStyle = color;
	ctx.lineWidth = thickness;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.bezierCurveTo(
		x1 + controlOffset,
		y1,
		x2 - controlOffset,
		y2,
		x2,
		y2
	);
	ctx.stroke();
	ctx.closePath();
}


function drawCableEndpointDots(
	ctx: CanvasRenderingContext2D,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	color = "#FFFFFF",
	radius = 6
) {
	const dotRadius = 6;
	ctx.fillStyle = color;

	ctx.beginPath();
	ctx.arc(x1, y1, radius ?? dotRadius, 0, Math.PI * 2);
	ctx.fill();
	ctx.closePath();

	ctx.beginPath();
	ctx.arc(x2, y2, radius ?? dotRadius, 0, Math.PI * 2);
	ctx.fill();
	ctx.closePath();
}

export { drawFrame, type Cable };