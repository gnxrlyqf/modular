import { Module } from "../Abstractions";
import Patch from "./Patch";

class Keyboard extends Module {
  active: Map<string, OscillatorNode> = new Map();
  private dummyOutput: GainNode;

  constructor(audioContext: AudioContext) {
    super(audioContext);
    this.dummyOutput = new GainNode(this.audioContext);
  }

  setParam(key: string, value: any): void {
    switch (key) {
      case "noteOn": {
        const { note, freq } = value;

        if (this.active.has(note)) return;

        const osc = new OscillatorNode(this.audioContext, {
          type: "triangle",
          frequency: freq,
        });

        const gain = new GainNode(this.audioContext, { gain: 0.25 });

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();

        this.active.set(note, osc);
        break;
      }

      case "noteOff": {
        const note = value;

        const osc = this.active.get(note);
        if (!osc) return;

        const now = this.audioContext.currentTime;

        const gain = new GainNode(this.audioContext);
        osc.connect(gain);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        osc.stop(now + 0.08);

        this.active.delete(note);
        break;
      }
    }
  }

  setMod(key: string, patch: Patch | null): void {
    // Keyboard has no modulation routing
    void key;
    void patch;
  }

  getSignal(): AudioNode {
    // Required by Module contract, but Keyboard is not part of audio graph
    return this.dummyOutput;
  }
}

export default Keyboard;