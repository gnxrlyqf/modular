import Patch from "./Patch";

import { Module } from "../Abstractions";

class Envelope extends Module {
    signal: ConstantSourceNode;

    attack: number;
    decay: number;
    sustain: number;
    release: number;

    constructor(audioContext: AudioContext) {
        super(audioContext);
        this.signal = new ConstantSourceNode(this.audioContext);
        this.signal.start();
        this.signal.offset.setValueAtTime(0, this.audioContext.currentTime);
        this.attack = .05;
        this.decay = .25;
        this.sustain = .5;
        this.release = .3;
    }

	trigger(): void {
		const env = this.signal.offset;
		const now = this.audioContext.currentTime;

		env.cancelScheduledValues(now);
		env.setValueAtTime(0, now);
		env.linearRampToValueAtTime(1, now + this.attack);
		env.linearRampToValueAtTime(this.sustain, now + this.attack + this.decay);
	}

	stop(): void {
		const env = this.signal.offset;
		const now = this.audioContext.currentTime;
		
		env.cancelScheduledValues(now);
		env.linearRampToValueAtTime(0, now + this.release);
	}

	setOffsetModulator(modulator: Patch | null) {
		modulator?.getSignal()?.connect(this.signal.offset);
	}

	setMod(key: string, patch: Patch | null): void {
		switch (key) {
			case "offset":
				this.setOffsetModulator(patch);
				break;
			case "input":
				this.setInput(patch);
				break;
		}
	}

	setParam(key: string, value: number | string): void {
		switch (key) {
			case "attack":
				this.attack = value as number;
				break;
			case "decay":
				this.decay = value as number;
				break;
			case "sustain":
				this.sustain = value as number;
				break;
			case "release":
				this.release = value as number;
				break;
		}
	}

	setInput(input: Patch | null) {
		this.input?.getSignal()?.disconnect(this.signal);
		this.input = input;
		this.input?.getSignal()?.connect(this.signal);
	}

	getSignal(): ConstantSourceNode {
		return (this.signal);
	}
}

export default Envelope;