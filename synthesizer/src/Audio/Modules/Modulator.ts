import { Module } from "../Abstractions";
import Patch from "./Patch";

export type ModulationMode = "AM" | "FM" | "PM" | "RM";

class Modulator extends Module {
    signal: GainNode;
    depthNode: GainNode;
    ringNode: GainNode;
    pmNode: DelayNode;
    amOffset: ConstantSourceNode;
    amOffsetGain: GainNode;
    
    modulatorInput: Patch | null = null;
    mode: ModulationMode = "AM";
    rawDepth: number = 50; // Stores percentage (0 - 100)

    constructor(audioContext: AudioContext) {
        super(audioContext);
        this.signal = new GainNode(audioContext, { gain: 1 });
        this.depthNode = new GainNode(audioContext, { gain: 0.5 });
        this.ringNode = new GainNode(audioContext, { gain: 0 });
        
        // Max delay 50ms for stable phase transformations
        this.pmNode = new DelayNode(audioContext, { maxDelayTime: 0.05, delayTime: 0.005 });

        // DC balance offsets for Amplitude Modulation [Carrier * (1 + Mod)]
        this.amOffset = new ConstantSourceNode(audioContext, { offset: 1 });
        this.amOffsetGain = new GainNode(audioContext, { gain: 1 });
        this.amOffset.connect(this.amOffsetGain);
        this.amOffset.start();
    }

    private disconnectSafely(node: AudioNode) {
        try { node.disconnect(); } catch {}
    }

    private cleanRouting() {
        this.disconnectSafely(this.ringNode);
        this.disconnectSafely(this.pmNode);
        this.disconnectSafely(this.depthNode);
        this.disconnectSafely(this.amOffsetGain);

        const carrierNode = this.input?.getSignal();
        const modNode = this.modulatorInput?.getSignal();

        if (carrierNode) this.disconnectSafely(carrierNode);
        if (modNode) this.disconnectSafely(modNode);
    }

    private updateDepthScaling() {
        const target = this.depthNode.gain;
        const normalized = this.rawDepth / 100; // 0.0 to 1.0

        switch (this.mode) {
            case "AM":
            case "RM":
                target.value = normalized; // Standard unity gain range
                break;
            case "PM":
                target.value = normalized * 0.004; // Max 4ms deviation to prevent cracking
                break;
            case "FM":
                target.value = normalized * 0.0025; // Phase deviation mapping for emulation
                break;
        }
    }

    private applyRouting() {
        const carrierNode = this.input?.getSignal();
        const modNode = this.modulatorInput?.getSignal();

        if (!carrierNode) return;
        this.updateDepthScaling();

        switch (this.mode) {
            case "AM": {
                // Carrier -> Ring VCA
                carrierNode.connect(this.ringNode);
                this.amOffsetGain.connect(this.ringNode.gain);
                
                if (modNode) {
                    modNode.connect(this.depthNode);
                    this.depthNode.connect(this.ringNode.gain);
                }
                this.ringNode.connect(this.signal);
                break;
            }
            case "RM": {
                // Pure ring modulation multiplication
                carrierNode.connect(this.ringNode);
                if (modNode) {
                    modNode.connect(this.depthNode);
                    this.depthNode.connect(this.ringNode.gain);
                }
                this.ringNode.connect(this.signal);
                break;
            }
            case "PM": {
                // Variable time delay line phase manipulation
                carrierNode.connect(this.pmNode);
                if (modNode) {
                    modNode.connect(this.depthNode);
                    this.depthNode.connect(this.pmNode.delayTime);
                }
                this.pmNode.connect(this.signal);
                break;
            }
            case "FM": {
                // If native frequency controls aren't exposed, run an FM-equivalent 
                // Phase Modulation path (sounds mathematically identical)
                carrierNode.connect(this.pmNode);
                if (modNode) {
                    modNode.connect(this.depthNode);
                    this.depthNode.connect(this.pmNode.delayTime);
                }
                this.pmNode.connect(this.signal);
                break;
            }
        }
    }

    setMode(newMode: ModulationMode) {
        this.cleanRouting();
        this.mode = newMode;
        this.applyRouting();
    }

    setInput(input: Patch | null) {
        this.cleanRouting();
        this.input = input;
        this.applyRouting();
    }

    setModulator(modulator: Patch | null) {
        this.cleanRouting();
        this.modulatorInput = modulator;
        this.applyRouting();
    }

    setMod(key: string, patch: Patch | null): void {
        switch (key) {
            case "carrier":
                this.setInput(patch);
                break;
            case "mod in":
                this.setModulator(patch);
                break;
        }
    }

    setParam(key: string, value: number | string | number[]): void {
        switch (key) {
            case "mode":
                this.setMode(value as ModulationMode);
                break;
            case "depth":
                this.rawDepth = value as number;
                this.updateDepthScaling();
                break;
        }
    }

    getSignal(): GainNode {
        return this.signal;
    }
}

export default Modulator;