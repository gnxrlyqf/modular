const canvasElement = document.getElementById("canvas");

if (!(canvasElement instanceof HTMLCanvasElement)) {
	throw new Error('Expected "#canvas" to be an HTMLCanvasElement.');
}

const ctx = canvasElement.getContext("2d");

if (!ctx) {
	throw new Error('Unable to acquire 2D context from "#canvas".');
}

export { canvasElement as canvas, ctx };