import { Module } from "../Abstractions";
import Patch from "./Patch";

type OscillatorShape = "sine" | "square" | "triangle" | "sawtooth" | "noise";

class Oscillator extends Module {
	freqModulator: Patch | null = null;
	oscillator: OscillatorNode;
	noiseSource: AudioBufferSourceNode;
	output: GainNode;
	freqModDepth: GainNode;
	currentShape: OscillatorShape;

    constructor(audioContext: AudioContext) {
        super(audioContext);
		this.output = new GainNode(this.audioContext, { gain: 1 });
		this.oscillator = new OscillatorNode(this.audioContext, {
            frequency: 440,
            type: "sine"
        });
		this.noiseSource = this.createNoiseSource();
		this.freqModDepth = new GainNode(this.audioContext, { gain: 80 });
		this.freqModDepth.connect(this.oscillator.frequency);
		this.oscillator.connect(this.output);
		this.noiseSource.connect(this.output);
		this.oscillator.start();
		this.noiseSource.start();
		this.currentShape = "sine";
    }

	private createNoiseSource(): AudioBufferSourceNode {
		const bufferLength = this.audioContext.sampleRate * 2;
		const buffer = this.audioContext.createBuffer(1, bufferLength, this.audioContext.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferLength; i += 1) {
			data[i] = Math.random() * 2 - 1;
		}
		const source = new AudioBufferSourceNode(this.audioContext, {
			buffer,
			loop: true,
		});
		return source;
	}

	setFrequency(newFrequency: number): void {
		this.oscillator.frequency.setValueAtTime(newFrequency, this.audioContext.currentTime);
	}
	
	setShape(newShape: OscillatorShape): void {
		this.oscillator.disconnect();
		this.noiseSource.disconnect();
		if (newShape === "noise") {
			this.noiseSource.connect(this.output);
		} else {
			this.oscillator.type = newShape;
			this.oscillator.connect(this.output);
		}
		this.currentShape = newShape;
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

	setParam(key: string, value: number | string | number[]): void {
		switch (key) {
			case "frequency":
				this.setFrequency(value as number);
				break;
			case "wave":
				this.setShape(value as OscillatorShape);
				break;
		}
	}
	
	getSignal(): AudioNode {
		return this.output;
	}
}

export default Oscillator;