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
		return ((this.tempo / 60) / this.division);
	}
}


class LFOscillator extends Module {
	freqModulator: Patch | null = null;
	signal: OscillatorNode;
	freqModDepth: GainNode;
	mode: Sync | null;
	protected tempo: number;

	constructor(audioContext: AudioContext, tempo: number = 120) {
		super(audioContext);
		this.tempo = tempo;
		this.mode = new Sync(4, this.tempo);
		this.signal = new OscillatorNode(this.audioContext, {
			frequency: this.mode ? this.mode.getFrequency() : this.tempo,
			type: "sine"
		});
		this.freqModDepth = new GainNode(this.audioContext, { gain: 80 });
		this.freqModDepth.connect(this.signal.frequency);
		this.signal.start();
	}

	setSync(div: 0 | false | 1 | 2 | 4 | 8 | 16 | 32): void {
		if (!div) {
			this.mode = null;
			return;
		}

		this.mode = new Sync(div as any, this.tempo);
		this.setFrequency(this.mode.getFrequency());
	}

	setFrequency(newFrequency: number): void {
		this.signal.frequency.setValueAtTime(newFrequency, this.audioContext.currentTime);
	}

	setShape(newShape: OscillatorType): void {
		this.signal.type = newShape;
	}

	setFreqModulator(modulator: Patch | null) {
		this.freqModulator?.getSignal()?.disconnect(this.freqModDepth);
		this.freqModulator = modulator;
		this.freqModulator?.getSignal()?.connect(this.freqModDepth);
	}

	setMod(key: string, patch: Patch | null): void {
		switch (key) {
			case "frequency":
				this.setFreqModulator(patch);
				break;
		}
	}

	setParam(key: string, value: number | string): void {
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
		}
	}

	getSignal(): OscillatorNode {
		return (this.signal);
	}
}

export default LFOscillator;