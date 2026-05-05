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
    depthModDepth: GainNode;
    modulatorInput: Patch | null = null;
    depthInput: Patch | null = null;
    mode: ModulationMode = "AM";

    constructor(audioContext: AudioContext)
    {
        super(audioContext);
        this.signal = new GainNode(audioContext, { gain: 1 });
        this.depthNode = new GainNode(audioContext, { gain: 1 });
        this.ringNode = new GainNode(audioContext, { gain: 0 });
        this.pmNode = new DelayNode(audioContext, { maxDelayTime: 0.05, delayTime: 0 });
        // Used for AM = carrier * (1 + modulator)
        this.amOffset = new ConstantSourceNode(audioContext, { offset: 1 });
        this.amOffsetGain = new GainNode(audioContext, { gain: 1 });
        this.amOffset.connect(this.amOffsetGain);
        this.amOffset.start();
        // Modulates modulation depth
        this.depthModDepth = new GainNode(audioContext, { gain: 0.5 });
        this.depthModDepth.connect(this.depthNode.gain);
    }

    private disconnectSafely(node: AudioNode) {
        try { node.disconnect(); }
        catch {}
    }

    private cleanRouting() {
        this.disconnectSafely(this.ringNode);
        this.disconnectSafely(this.pmNode);
        this.disconnectSafely(this.depthNode);
        this.disconnectSafely(this.amOffsetGain);

        const carrierNode = this.input?.getSignal();
        const modNode = this.modulatorInput?.getSignal();

        if (carrierNode)
            this.disconnectSafely(carrierNode);

        if (modNode)
            this.disconnectSafely(modNode);
    }

    private applyRouting() {
        const carrierNode = this.input?.getSignal();
        const modNode = this.modulatorInput?.getSignal();

        if (!carrierNode)
            return;

        switch (this.mode) {
            case "AM": {
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
                carrierNode.connect(this.ringNode);
                if (modNode) {
                    modNode.connect(this.depthNode);
                    this.depthNode.connect(this.ringNode.gain);
                }
                this.ringNode.connect(this.signal);
                break;
            }
            case "PM": {
                carrierNode.connect(this.pmNode);
                if (modNode) {
                    modNode.connect(this.depthNode);
                    this.depthNode.connect(this.pmNode.delayTime);
                }
                this.pmNode.connect(this.signal);
                break;
            }
            case "FM": {
                carrierNode.connect(this.signal);
                const frequencyParam =
                    "frequency" in carrierNode
                        ? (carrierNode as OscillatorNode).frequency
                        : null;
                if (modNode && frequencyParam) {
                    modNode.connect(this.depthNode);
                    this.depthNode.connect(frequencyParam);
                }
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

    setDepth(modulator: Patch | null) {
        this.depthInput?.getSignal()?.disconnect(this.depthModDepth);
        this.depthInput = modulator;
        modulator?.getSignal()?.connect(this.depthModDepth);
    }

    setMod(key: string, patch: Patch | null): void {
        switch (key) {
            case "carrier":
                this.setInput(patch);
                break;
            case "mod in":
                this.setModulator(patch);
                break;
            case "depth":
                this.setDepth(patch);
                break;
        }
    }

    setParam(key: string, value: number | string): void {
        switch (key) {
            case "mode":
                this.setMode(value as ModulationMode);
                break;
            case "depth":
                this.depthNode.gain.value = value as number;
                break;
        }
    }

    getSignal(): GainNode {
        return this.signal;
    }
}

export default Modulator;