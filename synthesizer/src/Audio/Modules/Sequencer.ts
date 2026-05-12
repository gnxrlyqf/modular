import { Module } from "../Abstractions";
import Patch from "./Patch";

class Sequencer extends Module {
	signal: ConstantSourceNode;
	timer: ReturnType<typeof setInterval> | null = null;
	started = false;
	length: number;
	sequence: number[];
	tempo: number
	// listeners notified on each step: (index, value, time)
	private stepListeners: Array<(index: number, value: number, time: number) => void> = [];

	constructor(audioContext: AudioContext, tempo: number) {
		super(audioContext);
		this.signal = new ConstantSourceNode(audioContext);
		this.length = 4;
		this.sequence = [0, 0, 0, 0];
		this.tempo = tempo;
		this.start();
	}

	private start() {
		if (!this.started) {
			this.signal.start();
			this.started = true;
		}

		if (this.timer !== null)
			clearTimeout(this.timer);

		const stepDuration = (this.tempo / 60) / this.length;
		let index = 0;
		let nextStepTime = this.audioContext.currentTime;

		const scheduleStep = () => {
			const val = this.sequence[index] ?? 0;
			this.signal.offset.setValueAtTime(val, nextStepTime);
			this.stepListeners.forEach((cb) => cb(index, val, nextStepTime));
			
			index = (index + 1) % this.length;
			nextStepTime += stepDuration;
			
			// Schedule next step relative to audio context time
			const delayUntilNextStep = Math.max(0, (nextStepTime - this.audioContext.currentTime) * 1000);
			this.timer = setTimeout(scheduleStep, delayUntilNextStep);
		};

		this.timer = setTimeout(scheduleStep, 0);
	}

	setMod(key: string, patch: Patch | null): void {
		void(key);
		void (patch);
	}

	setParam(key: string, value: number | number[]): void {
		switch (key) {
			case "length": {
				this.length = Math.max(1, value as number);
				this.start();
				break;
			}
			case "sequence": {
				this.sequence = value as number[];
				break;
			}
		}
	}

	// allow external code to subscribe to step events
	addStepListener(cb: (index: number, value: number, time: number) => void) {
		this.stepListeners.push(cb);
		return () => {
			const i = this.stepListeners.indexOf(cb);
			if (i >= 0) this.stepListeners.splice(i, 1);
		};
	}

	getSignal(): ConstantSourceNode {
		return this.signal;
	}
}

export default Sequencer;