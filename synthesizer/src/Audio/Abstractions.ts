import Patch from "./Modules/Patch";

abstract class Module {
	protected audioContext: AudioContext;
	input: Patch | null = null;

	constructor(audioContext: AudioContext) {
		this.audioContext = audioContext;
		this.input = null;
	}

	abstract getSignal(): AudioNode;

	abstract setMod(key: string, patch: Patch | null): void;

	abstract setParam(key: string, value: number | string | number[]): void;

	// Optional tempo update hook for modules that care about tempo (LFO, Sequencer)
	setTempo?(newTempo: number): void;
}

export { Module };