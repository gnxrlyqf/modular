import { Module } from "../Abstractions";
import Patch from "./Patch";

class Mixer extends Module {
  signal: GainNode;
  in1: Patch | null = null;
  in2: Patch | null = null;
  in1Gain: GainNode;
  in2Gain: GainNode;

  constructor(audioContext: AudioContext) {
    super(audioContext);
    this.in1Gain = new GainNode(this.audioContext, { gain: 1 });
    this.in2Gain = new GainNode(this.audioContext, { gain: 1 });
    this.signal = new GainNode(this.audioContext, { gain: 1 });

    this.in1Gain.connect(this.signal);
    this.in2Gain.connect(this.signal);
  }

  private disconnectSafely(node?: AudioNode, destination?: AudioNode | AudioParam) {
    try {
      if (!node) return;
      if (destination) node.disconnect(destination as AudioNode);
      else node.disconnect();
    } catch {}
  }

  setInput1(patch: Patch | null) {
    this.disconnectSafely(this.in1?.getSignal(), this.in1Gain);
    this.in1 = patch;
    if (this.in1?.getSignal()) this.in1.getSignal()?.connect(this.in1Gain);
  }

  setInput2(patch: Patch | null) {
    this.disconnectSafely(this.in2?.getSignal(), this.in2Gain);
    this.in2 = patch;
    if (this.in2?.getSignal()) this.in2.getSignal()?.connect(this.in2Gain);
  }

  setMod(key: string, patch: Patch | null): void {
    switch (key) {
      case "input 1":
        this.setInput1(patch);
        break;
      case "input 2":
        this.setInput2(patch);
        break;
      case "output":
      default:
        break;
    }
  }

  setParam(key: string, value: number | string | number[]): void {
    void key;
    void value;
  }

  getSignal(): AudioNode {
    return this.signal;
  }
}

export default Mixer;
