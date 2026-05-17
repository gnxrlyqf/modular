# Modular Synthesizer — Overview & Quick Start

This repository contains a browser-based modular synthesizer built with React + TypeScript + Vite.

What it is

- A toolkit for creating sounds by connecting small functional blocks (modules) with virtual cables.
- Modules produce or transform either audio signals (what you hear) or control/trigger signals (events or slow-changing values).

Core concepts

- Audio signals: continuous, fast signals representing sound.
- Control / Trigger signals: event-like (note on/off) or slow-changing signals used to control other modules.
- Signal flow: modules are placed on the canvas and connected. Outputs feed inputs; process chains end at `Output`.

Quick start

1. Add an `Oscillator`, `Filter`, `Gain`, and `Output` from the Dock.
2. Connect: `Oscillator.output` → `Filter.input` → `Gain.input` → `Output.input`.
3. Add `Keyboard`; connect `Keyboard.freq` → `Oscillator.frequency` and `Keyboard.trigger` → `Envelope.trigger` (then envelope → gain) to play notes.

Example patches

- Simple plucked note
  - Modules: `Oscillator`, `Envelope`, `Gain`, `Output`, `Keyboard`.
  - Connections: `Oscillator.output` → `Envelope.output` → `Gain.input` → `Output.input`.
  - Control: `Keyboard.trigger` → `Envelope.trigger`, `Keyboard.freq` → `Oscillator.frequency`.

- Vibrato
  - Modules: `Oscillator`, `LFO`, `Gain`, `Output`.
  - Connections: `Oscillator.output` → `Gain` → `Output` and `LFO.output` → `Oscillator.frequency`.

- Sequenced rhythm
  - Modules: `Oscillator`, `Envelope`, `Gain`, `Sequencer`, `Output`.
  - Connections: `Oscillator.output` → `Envelope.output` → `Gain.input` → `Output.input`; `Sequencer.trigger` → `Envelope.trigger`.

Module reference (for people without audio background)

- Distortion
  - Alters waveform shape to add grit or character (like overdriving a guitar amp).
  - Modes: sinoid fold (smooth foldback), soft clip (rounded peaks), hard clip (sharp cutoff), bitcrush (digital lo-fi).

- Envelope (ADSR)
  - Shapes the loudness of a note over time.
  - Attack: how fast the sound reaches full level when started.
  - Decay: how long until the sound settles to the sustain level.
  - Sustain: level held while the note is held.
  - Release: how long it takes to fade after the note is released.

- Filter
  - Removes or emphasizes frequency ranges of a sound.
  - Low-pass: keeps lows, reduces highs (darker sound).
  - High-pass: keeps highs, reduces lows (thinner, removes rumble).
  - Band-pass: keeps a narrow frequency band (telephone-like or focused tone).
  - Notch: removes a narrow band (useful for removing hum or producing phasing effects).

- Gain
  - Controls loudness (volume).

- Oscillator
  - Produces basic periodic sounds at a given pitch.
  - Sine: pure tone (smooth).
  - Square: hollow/woody (strong odd harmonics).
  - Triangle: softer than square.
  - Sawtooth: bright and buzzy (rich harmonics).

- LFO (Low Frequency Oscillator)
  - Like an oscillator but slow; used to modulate other parameters (vibrato, tremolo, filter sweeps).

- Modulator
  - Combines two signals to create new timbres.
  - AM: changes amplitude (tremolo, sidebands).
  - FM: changes pitch quickly (bell/metallic sounds).
  - PM: phase-based modulation (similar to FM).
  - RM: ring modulation — multiplies signals for inharmonic textures.

- Sequencer
  - Emits trigger events in a programmed step pattern; useful to automate rhythms.

- Keyboard
  - Sends pitch (`freq`) and `trigger` events when keys are pressed and released.

- Utilities
  - Output: final audio destination (speakers); adjust master output level here.
  - Mixer: combine multiple inputs into one output.
  - Splitter: send one input to multiple outputs.

Practical tips

- Typical flow: `Oscillator -> Filter -> Distortion -> Envelope -> Gain -> Output`.
- Use `Envelope` to sculpt how notes start and stop.
- Use `LFO` and `Modulator` to add motion and complexity.
- Keep volumes low while testing.
