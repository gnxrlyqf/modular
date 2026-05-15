import { Module } from "../Abstractions";
import Patch from "./Patch";

class Splitter extends Module {
  inputPatch: Patch | null = null;
  output: GainNode;

  constructor(audioContext: AudioContext) {
    super(audioContext);
    this.output = new GainNode(this.audioContext, { gain: 1 });
  }

  private disconnectSafely(node?: AudioNode, destination?: AudioNode | AudioParam) {
    try {
      if (!node) return;
      if (destination) node.disconnect(destination as AudioNode);
      else node.disconnect();
    } catch {}
  }

  setInput(patch: Patch | null) {
    this.disconnectSafely(this.inputPatch?.getSignal(), this.output);
    this.inputPatch = patch;
    if (this.inputPatch?.getSignal()) this.inputPatch.getSignal()?.connect(this.output);
  }

  setMod(key: string, patch: Patch | null): void {
    switch (key) {
      case "input":
        this.setInput(patch);
        break;
      default:
        break;
    }
  }

  setParam(key: string, value: number | string | number[]): void {
    void key;
    void value;
  }

  getSignal(): AudioNode {
    return this.output;
  }
}

export default Splitter;
