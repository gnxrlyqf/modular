import { Module } from "../Abstractions";
import Patch from "./Patch";

class Filter extends Module {
    signal: BiquadFilterNode;
    freqModDepth: GainNode;
    qModDepth: GainNode;
    
    freqModulator: Patch | null = null;
    qModulator: Patch | null = null;

    constructor(audioContext: AudioContext) {
        super(audioContext);
        this.signal = new BiquadFilterNode(this.audioContext, {
            type: "lowpass",
            frequency: 1000,
            Q: 1
        });
        this.freqModDepth = new GainNode(this.audioContext, { gain: 80 });
        this.freqModDepth.connect(this.signal.frequency);
        this.qModDepth = new GainNode(this.audioContext, { gain: 80 });
        this.qModDepth.connect(this.signal.Q);
    }

    setType(type: BiquadFilterType) {
        this.signal.type = type;
    }

    setFrequency(value: number) {
        this.signal.frequency.setValueAtTime(value, this.audioContext.currentTime);
    }

    setQ(value: number) {
        this.signal.Q.setValueAtTime(value, this.audioContext.currentTime);
    }

    setFreqModulator(modulator: Patch | null) {
        this.freqModulator?.getSignal()?.disconnect(this.freqModDepth);
        this.freqModulator = modulator;
        this.freqModulator?.getSignal()?.connect(this.freqModDepth);
    }

    setInput(input: Patch | null) {
        this.input?.getSignal()?.disconnect(this.signal);
        this.input = input;
        this.input?.getSignal()?.connect(this.signal);
    }

    setQModulator(modulator: Patch | null) {
        this.qModulator?.getSignal()?.disconnect(this.qModDepth);
        this.qModulator = modulator;
        this.qModulator?.getSignal()?.connect(this.qModDepth);
    }

    setMod(key: string, patch: Patch | null): void {
        switch (key) {
            case "cutoff":
                this.setFreqModulator(patch);
                break;
            case "freqModulator":
                this.setFreqModulator(patch);
                break;
            case "q":
                this.setQModulator(patch);
                break;
            case "qModulator":
                this.setQModulator(patch);
                break;
            case "input":
                this.setInput(patch);
                break;
        }
    }

    setParam(key: string, value: number | string | number[]): void {
        switch (key) {
            case "frequency":
                this.setFrequency(value as number);
                break;
            case "q":
                this.setQ(value as number);
                break;
            case "type":
                this.setType(value as BiquadFilterType);
                break;
        }
    }

    getSignal(): BiquadFilterNode {
        return this.signal;
    }
}

export default Filter;