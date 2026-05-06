import { Module } from "../Abstractions";
import Patch from "./Patch";

export type DistortionType = "sine" | "soft" | "hard" | "downsample";

class Distortion extends Module {
    signal: WaveShaperNode;
    amount: AudioParam;
    amountModDepth: GainNode;
    amountInput: Patch | null = null;
    type: DistortionType = "soft";

    constructor(audioContext: AudioContext) {
        super(audioContext);
        // Using a dummy gain node to hold the 'amount' value for the curve math
        const amountControl = new GainNode(this.audioContext, { gain: 50 });
        this.amount = amountControl.gain;
        this.amountModDepth = new GainNode(this.audioContext, { gain: 80 });
        this.amountModDepth.connect(this.amount);
        this.signal = new WaveShaperNode(this.audioContext);
        this.setCurve();
    }

    setDistortionType(type: DistortionType) {
        this.type = type;
        this.setCurve();
    }

    setDrive(value: number) {
        this.amount.value = Math.max(0, Math.min(100, value));
        this.setCurve();
    }

    setDriveModulator(modulator: Patch | null) {
        this.amountInput?.getSignal()?.disconnect(this.amountModDepth);
        this.amountInput = modulator;
        modulator?.getSignal()?.connect(this.amountModDepth);
    }

    private setCurve() {
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const amt = this.amount.value; // 0 to 100
        
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1; // Input range -1 to 1

            switch (this.type) {
                case "sine":
                    // Sine Fold: Folds the wave back on itself
                    // Higher amount = more folds (harmonics)
                    const frequency = 1 + (amt / 20);
                    curve[i] = Math.sin(x * Math.PI * frequency);
                    break;

                case "soft":
                    // Proper Soft Clip (Tanh): Rounds the peaks
                    // Scale amt to a usable gain factor (1 to 20)
                    const k = 1 + (amt / 5);
                    curve[i] = Math.tanh(x * k) / Math.tanh(k);
                    break;

                case "hard":
                    // Proper Hard Clip: Sharp cut at threshold
                    // Threshold drops as amount increases
                    const threshold = Math.max(0.1, 1 - (amt / 110));
                    if (x > threshold) curve[i] = threshold;
                    else if (x < -threshold) curve[i] = -threshold;
                    else curve[i] = x;
                    // Normalize gain so it stays loud
                    curve[i] /= threshold;
                    break;

                case "downsample":
                    // Bitcrush/Sample-rate reduction simulation
                    // Reducing the 'resolution' of the transfer function
                    const steps = Math.max(2, 64 - (amt / 1.6)); 
                    curve[i] = Math.round(x * steps) / steps;
                    break;
            }
        }
        this.signal.curve = curve;
    }

    setInput(input: Patch | null) {
        this.input?.getSignal()?.disconnect(this.signal);
        this.input = input;
        this.input?.getSignal()?.connect(this.signal);
    }

    setMod(key: string, patch: Patch | null): void {
        switch (key) {
            case "drive":
                this.setDriveModulator(patch);
                break;
            case "input":
                this.setInput(patch);
                break;
        }
    }

    setParam(key: string, value: number | string): void {
        switch (key) {
            case "drive":
                this.setDrive(value as number);
                break;
            case "type":
                this.setDistortionType(value as DistortionType);
                break;
        }
    }

    getSignal(): WaveShaperNode {
        return this.signal;
    }
}

export default Distortion;