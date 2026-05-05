import { Module } from "../Abstractions";
import Patch from "./Patch";

class Oscillator extends Module {
	freqModulator: Patch | null = null;
	signal: OscillatorNode;
	freqModDepth: GainNode;

    constructor(audioContext: AudioContext) {
        super(audioContext);
        this.signal = new OscillatorNode(this.audioContext, {
            frequency: 440,
            type: "sine"
        });
		this.freqModDepth = new GainNode(this.audioContext, { gain: 80 });
		this.freqModDepth.connect(this.signal.frequency);
		this.signal.start();
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
		}
	}
	
	getSignal(): OscillatorNode {
		return (this.signal);
	}
}

export default Oscillator;