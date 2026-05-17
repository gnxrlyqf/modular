import { Module } from "../Abstractions";
import Patch from "./Patch";

class Keyboard extends Module {
  private freqOut: ConstantSourceNode;
  private trigOut: ConstantSourceNode;
  private dummyOutput: GainNode;
  private activeNotes: Set<string> = new Set();
  // listeners notified whenever the keyboard trigger changes: (index, value, time)
  private stepListeners: Array<(index: number, value: number, time: number) => void> = [];

  constructor(audioContext: AudioContext) {
    super(audioContext);
    this.freqOut = new ConstantSourceNode(this.audioContext, { offset: 0 });
    this.trigOut = new ConstantSourceNode(this.audioContext, { offset: 0 });
    this.freqOut.start();
    this.trigOut.start();
    this.dummyOutput = new GainNode(this.audioContext);
  }

  private setFrequency(v: number): void {
    this.freqOut.offset.setValueAtTime(v, this.audioContext.currentTime);
  }

  private setTrigger(v: number): void {
    this.trigOut.offset.setValueAtTime(v, this.audioContext.currentTime);
    this.stepListeners.forEach((cb) => cb(0, v, this.audioContext.currentTime));
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
        this.activeNotes.add(value.note);
        this.setFrequency(value.freq); 
        this.setTrigger(1); 
        break;

      case "noteOff": 
        this.activeNotes.delete(value);
        if (this.activeNotes.size === 0)
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

  addStepListener(cb: (index: number, value: number, time: number) => void) {
    this.stepListeners.push(cb);
    return () => {
      const i = this.stepListeners.indexOf(cb);
      if (i >= 0) this.stepListeners.splice(i, 1);
    };
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