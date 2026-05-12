import { Module } from "../Abstractions";
import Patch from "./Patch";

class Output extends Module {
	gain: GainNode;
	signal: AudioDestinationNode;
	masterMod: Patch | null = null;
	masterBase: number = 1;

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
				this.setMasterMod(patch);
				break;
			case "input":
				this.setInput(patch);
				break;
		}
	}

	private disconnectSafely(node: AudioNode, destination?: AudioNode | AudioParam) {
		try {
			if (destination) node.disconnect(destination as AudioNode);
			else node.disconnect();
		} catch {
			// ignore disconnect errors
		}
	}

	setMasterMod(patch: Patch | null) {
		const prev = this.masterMod?.getSignal();
		if (prev) this.disconnectSafely(prev, this.gain.gain);
		this.masterMod = patch;
		if (this.masterMod?.getSignal()) {
			this.gain.gain.setValueAtTime(this.masterBase, this.audioContext.currentTime);
			this.masterMod.getSignal()?.connect(this.gain.gain);
		} else {
			this.gain.gain.setValueAtTime(this.masterBase, this.audioContext.currentTime);
		}
	}

	setParam(key: string, value: number | string | number[]): void {
		switch (key) {
			case "master":
				if (Number(value) === -60)
					this.masterBase = 0;
				else
					this.masterBase = 10 ** (Number(value) / 20);
				this.gain.gain.setValueAtTime(this.masterBase, this.audioContext.currentTime);
				break;
		}
	}

	getSignal(): AudioDestinationNode {
		return this.signal;
	}
}

export default Output;