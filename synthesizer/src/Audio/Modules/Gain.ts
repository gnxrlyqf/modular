import { Module } from "../Abstractions";
import Patch from "./Patch";

class Gain extends Module {
	signal: GainNode;
	userGain: GainNode;
	gate: GainNode;
	modulator: Patch | null = null;

	constructor(audioContext: AudioContext) {
		super(audioContext);
		this.userGain = new GainNode(this.audioContext, { gain: 1 });
		this.gate = new GainNode(this.audioContext, { gain: 1 });
		this.userGain.connect(this.gate);
		this.signal = this.gate;
	}

	setGain(value: number) {
		if (value === -60)
			this.userGain.gain.setValueAtTime(0, this.audioContext.currentTime);
		else
			this.userGain.gain.setValueAtTime(10 ** (value / 20), this.audioContext.currentTime);
	}

	private disconnectSafely(node: AudioNode, destination?: AudioNode | AudioParam) {
		try {
			if (destination) node.disconnect(destination as AudioNode);
			else node.disconnect();
		} catch {
			// ignore disconnect errors
		}
	}


    setModulator(modulator: Patch | null) {
		const prev = this.modulator?.getSignal();
		if (prev) this.disconnectSafely(prev, this.gate.gain);
		this.modulator = modulator;
		if (this.modulator?.getSignal()) {
			this.gate.gain.setValueAtTime(0, this.audioContext.currentTime);
			this.modulator.getSignal()?.connect(this.gate.gain);
		} else {
			this.gate.gain.setValueAtTime(1, this.audioContext.currentTime);
		}
    }

    setInput(input: Patch | null) {
		this.input?.getSignal()?.disconnect(this.userGain);
        this.input = input;
		this.input?.getSignal()?.connect(this.userGain);
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

	setParam(key: string, value: number | string | number[]): void {
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