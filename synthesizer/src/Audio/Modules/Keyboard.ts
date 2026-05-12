import { Module } from "../Abstractions";
import Patch from "./Patch";

class Keyboard extends Module {
  private freqOut: GainNode;
  private trigOut: GainNode;
  private dummyOutput: GainNode;

  constructor(audioContext: AudioContext) {
    super(audioContext);

    this.freqOut = new GainNode(this.audioContext, { gain: 0 });
    this.trigOut = new GainNode(this.audioContext, { gain: 0 });

    this.dummyOutput = new GainNode(this.audioContext);
  }

  private setFrequency(v: number): void {
    this.freqOut.gain.setValueAtTime(v, this.audioContext.currentTime);
  }

  private setTrigger(v: number): void {
    this.trigOut.gain.setValueAtTime(v, this.audioContext.currentTime);
  }

  setParam(key: string, value: any): void {
    switch (key) {
      case "freq":
        this.setFrequency(value);
        break;

      case "trigger":
        this.setTrigger(value);
        break;

      case "noteOn":
        this.setFrequency(value.freq);
        this.setTrigger(1);
        break;

      case "noteOff":
        this.setTrigger(0);
        break;
    }
  }

  getFrequencySignal(): AudioNode {
    return this.freqOut;
  }

  getTriggerSignal(): AudioNode {
    return this.trigOut;
  }

  setMod(key: string, patch: Patch | null): void {
    void key;
    void patch;
  }

  getSignal(): AudioNode {
    return this.dummyOutput;
  }
}

export default Keyboard;