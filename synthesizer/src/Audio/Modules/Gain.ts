import { Module } from "../Abstractions";
import Patch from "./Patch";

class Gain extends Module {
	signal: GainNode;
	modulator: Patch | null = null;

	constructor(audioContext: AudioContext) {
		super(audioContext);
		this.signal = new GainNode(this.audioContext, { gain: 1 });
	}

	setGain(value: number) {
		if (value === -60)
			this.signal.gain.setValueAtTime(0, this.audioContext.currentTime);
		else
			this.signal.gain.setValueAtTime(10 ** (value / 20), this.audioContext.currentTime);
	}


    setModulator(modulator: Patch | null) {
        this.modulator?.getSignal()?.disconnect(this.signal.gain);
        this.modulator = modulator;
        this.modulator?.getSignal()?.connect(this.signal.gain);
    }

    setInput(input: Patch | null) {
        this.input?.getSignal()?.disconnect(this.signal);
        this.input = input;
        this.input?.getSignal()?.connect(this.signal);
    }

	setMod(key: string, patch: Patch | null): void {
		switch (key) {
			case "gain":
				this.setModulator(patch);
				break;
			case "modulator":
				this.setModulator(patch);
				break;
			case "input":
				this.setInput(patch);
				break;
		}
	}

	setParam(key: string, value: number | string): void {
		switch (key) {
			case "gain":
				this.setGain(value as number);
				break;
		}
	}

	getSignal(): GainNode {
		return (this.signal);
	}
}

export default Gain;