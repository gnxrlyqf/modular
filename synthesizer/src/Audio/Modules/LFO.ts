import { Module } from "../Abstractions";
import Patch from "./Patch";

class Sync {
	division: 1 | 2 | 4 | 8 | 16 | 32;
	tempo: number;

	constructor(division: 1 | 2 | 4 | 8 | 16 | 32, tempo: number) {
		this.division = division;
		this.tempo = tempo;
	}

	getFrequency(): number {
		return ((this.tempo / 60) * this.division);
	}
}


class LFOscillator extends Module {
	freqModulator: Patch | null = null;
	oscillator: OscillatorNode;
	output: GainNode;
	freqModDepth: GainNode;
	mode: Sync | null;
	protected tempo: number;
	flip: boolean;

	constructor(audioContext: AudioContext, tempo: number = 120) {
		super(audioContext);
		this.tempo = tempo;
		this.mode = new Sync(4, this.tempo);
		this.output = new GainNode(this.audioContext, { gain: 1 });
		this.oscillator = new OscillatorNode(this.audioContext, {
			frequency: this.mode ? this.mode.getFrequency() : this.tempo,
			type: "sine"
		});
		this.freqModDepth = new GainNode(this.audioContext, { gain: 80 });
		this.freqModDepth.connect(this.oscillator.frequency);
		this.oscillator.connect(this.output);
		this.oscillator.start();
		this.flip = false;
	}

	setTempo(newTempo: number): void {
		this.tempo = newTempo;
		if (this.mode) {
			this.mode.tempo = newTempo;
			this.setFrequency(this.mode.getFrequency());
		}
	}

	setSync(div: 0 | false | 1 | 2 | 4 | 8 | 16 | 32): void {
		if (!div) {
			this.mode = null;
			this.setFrequency(1);
			return;
		}

		this.mode = new Sync(div as any, this.tempo);
		this.setFrequency(this.mode.getFrequency());
	}

	setFrequency(newFrequency: number): void {
		this.oscillator.frequency.setValueAtTime(newFrequency, this.audioContext.currentTime);
	}

	setShape(newShape: OscillatorType): void {
		this.oscillator.type = newShape;
	}

	setFlip(isFlipped: boolean): void {
		this.flip = isFlipped;
		this.output.gain.setValueAtTime(isFlipped ? -1 : 1, this.audioContext.currentTime);
	}

	setFreqModulator(modulator: Patch | null) {
		this.freqModulator?.getSignal()?.disconnect(this.freqModDepth);
		this.freqModulator = modulator;
		this.freqModulator?.getSignal()?.connect(this.freqModDepth);
	}

	setMod(key: string, patch: Patch | null): void {
		switch (key) {
			case "freq":
				this.setFreqModulator(patch);
				break;
		}
	}

	setParam(key: string, value: number | string | number[]): void {
		switch (key) {
			case "frequency":
				this.setFrequency(value as number);
				break;
			case "wave":
				this.setShape(value as OscillatorType);
				break;
			case "sync":
				this.setSync(value as any);
				break;
			case "flip":
				this.setFlip(Boolean(value));
				break;
		}
	}

	getSignal(): AudioNode {
		return this.output;
	}
}

export default LFOscillator;