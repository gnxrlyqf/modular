import { Module } from "../Abstractions";
import Patch from "./Patch";

class Output extends Module {
	gain: GainNode;
	signal: AudioDestinationNode;

	constructor(audioContext: AudioContext) {
		super(audioContext);
		this.signal = this.audioContext.destination;
		this.gain = new GainNode(this.audioContext, { gain: 1 });
		this.gain.connect(this.signal);
	}

	setInput(input: Patch | null) {
		this.input?.getSignal()?.disconnect(this.gain);
		this.input = input;
		this.input?.getSignal()?.connect(this.gain);
	}

	setMod(key: string, patch: Patch | null): void {
		switch (key) {
			case "master":
				this.setInput(patch);
				break;
			case "input":
				this.setInput(patch);
				break;
		}
	}

	setParam(key: string, value: number): void {
		switch (key) {
			case "master":
				if (value === -60)
					this.gain.gain.setValueAtTime(0, this.audioContext.currentTime);
				else
					this.gain.gain.setValueAtTime(10 ** (value / 20), this.audioContext.currentTime)
				break;
		}
	}

	getSignal(): AudioDestinationNode {
		return this.signal;
	}
}

export default Output;