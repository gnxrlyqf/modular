import Patch from "./Patch";

import { Module } from "../Abstractions";

class Envelope extends Module {
    signal: ConstantSourceNode;

    attack: number;
    decay: number;
    sustain: number;
    release: number;
	// per-parameter mod nodes
	attackControl: GainNode;
	decayControl: GainNode;
	sustainControl: GainNode;
	releaseControl: GainNode;

	attackModDepth: GainNode;
	decayModDepth: GainNode;
	sustainModDepth: GainNode;
	releaseModDepth: GainNode;

	attackInput: Patch | null = null;
	decayInput: Patch | null = null;
	sustainInput: Patch | null = null;
	releaseInput: Patch | null = null;
	triggerInput: Patch | null = null;
	triggerUnsubscribe: (() => void) | null = null;

    constructor(audioContext: AudioContext) {
        super(audioContext);
        this.signal = new ConstantSourceNode(this.audioContext);
        this.signal.start();
        this.signal.offset.setValueAtTime(0, this.audioContext.currentTime);
        this.attack = .05;
        this.decay = .25;
        this.sustain = .5;
        this.release = .3;
		// create GainNodes to act as controllable AudioParams for each parameter
		this.attackControl = new GainNode(this.audioContext, { gain: this.attack });
		this.decayControl = new GainNode(this.audioContext, { gain: this.decay });
		this.sustainControl = new GainNode(this.audioContext, { gain: this.sustain });
		this.releaseControl = new GainNode(this.audioContext, { gain: this.release });

		this.attackModDepth = new GainNode(this.audioContext, { gain: 1 });
		this.decayModDepth = new GainNode(this.audioContext, { gain: 1 });
		this.sustainModDepth = new GainNode(this.audioContext, { gain: 1 });
		this.releaseModDepth = new GainNode(this.audioContext, { gain: 1 });

		// route mod depths into the control AudioParams
		this.attackModDepth.connect(this.attackControl.gain);
		this.decayModDepth.connect(this.decayControl.gain);
		this.sustainModDepth.connect(this.sustainControl.gain);
		this.releaseModDepth.connect(this.releaseControl.gain);
    }

	private msToSec(ms: number) {
		return Math.max(0, ms) / 1000;
	}

	private percentToUnit(value: number) {
		return Math.max(0, Math.min(100, value)) / 100;
	}

	private triggerAtTime(time: number): void {
		const env = this.signal.offset;
		const startTime = Math.max(time, this.audioContext.currentTime);

		env.cancelScheduledValues(startTime);
		env.setValueAtTime(0, startTime);

		const attackVal = this.attackControl.gain.value;
		const decayVal = this.decayControl.gain.value;
		const sustainVal = this.sustainControl.gain.value;

		env.linearRampToValueAtTime(1, startTime + attackVal);
		env.linearRampToValueAtTime(sustainVal, startTime + attackVal + decayVal);
	}

	trigger(): void {
		this.triggerAtTime(this.audioContext.currentTime);
	}

	stop(): void {
		const env = this.signal.offset;
		const now = this.audioContext.currentTime;
		const releaseVal = this.releaseControl.gain.value;

		env.cancelScheduledValues(now);
		env.linearRampToValueAtTime(0, now + releaseVal);
	}

	private disconnectSafely(node: AudioNode, destination?: AudioNode | AudioParam) {
		try {
			if (destination) node.disconnect(destination as AudioNode);
			else node.disconnect();
		} catch {
			// ignore disconnect errors
		}
	}


	setTriggerModulator(modulator: Patch | null) {
		if (this.triggerUnsubscribe) {
			this.triggerUnsubscribe();
			this.triggerUnsubscribe = null;
		}

		const prevSignal = this.triggerInput?.getSignal();
		if (prevSignal) this.disconnectSafely(prevSignal, this.signal.offset);
		this.triggerInput = modulator;

		const source = modulator?.input as { addStepListener?: (cb: (index: number, value: number, time: number) => void) => () => void } | undefined;
		if (typeof source?.addStepListener === "function") {
			this.triggerUnsubscribe = source.addStepListener((_index, value, time) => {
				if (value === 1) this.triggerAtTime(time);
			});
		}
	}

	setAttackModulator(modulator: Patch | null) {
		this.attackInput?.getSignal()?.disconnect(this.attackModDepth as unknown as AudioNode);
		this.attackInput = modulator;
		modulator?.getSignal()?.connect(this.attackModDepth);
	}

	setDecayModulator(modulator: Patch | null) {
		this.decayInput?.getSignal()?.disconnect(this.decayModDepth as unknown as AudioNode);
		this.decayInput = modulator;
		modulator?.getSignal()?.connect(this.decayModDepth);
	}

	setSustainModulator(modulator: Patch | null) {
		this.sustainInput?.getSignal()?.disconnect(this.sustainModDepth as unknown as AudioNode);
		this.sustainInput = modulator;
		modulator?.getSignal()?.connect(this.sustainModDepth);
	}

	setReleaseModulator(modulator: Patch | null) {
		this.releaseInput?.getSignal()?.disconnect(this.releaseModDepth as unknown as AudioNode);
		this.releaseInput = modulator;
		modulator?.getSignal()?.connect(this.releaseModDepth);
	}

	setOutput(output: Patch | null) {
		this.input?.getSignal()?.disconnect(this.signal);
		this.input = output;
		this.input?.getSignal()?.connect(this.signal);
	}

	setMod(key: string, patch: Patch | null): void {
		switch (key) {
			case "trigger":
				this.setTriggerModulator(patch);
				break;
			case "attack":
				this.setAttackModulator(patch);
				break;
			case "decay":
				this.setDecayModulator(patch);
				break;
			case "sustain":
				this.setSustainModulator(patch);
				break;
			case "release":
				this.setReleaseModulator(patch);
				break;
			case "output":
				this.setOutput(patch);
				break;
		}
	}

	setParam(key: string, value: number | string | number[]): void {
		switch (key) {
			case "attack":
				this.attack = this.msToSec(value as number);
				this.attackControl.gain.value = this.attack;
				break;
			case "decay":
				this.decay = this.msToSec(value as number);
				this.decayControl.gain.value = this.decay;
				break;
			case "sustain":
				this.sustain = this.percentToUnit(value as number);
				this.sustainControl.gain.value = this.sustain;
				break;
			case "release":
				this.release = this.msToSec(value as number);
				this.releaseControl.gain.value = this.release;
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