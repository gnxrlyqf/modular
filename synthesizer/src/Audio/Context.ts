import Oscillator from "./Modules/Oscillator";
import Gain from "./Modules/Gain";
import Envelope from "./Modules/Envelope";
import Output from "./Modules/Output";
import LFOscillator from "./Modules/LFO";
import VCF from "./Modules/Filter";
import Distortion from "./Modules/Distortion";
import Modulator from "./Modules/Modulator";
import { type Module } from "../Modules/Modules";
import { type Cable } from "../Scene/Scene";
import type { Module as AudioModule } from "./Abstractions";
import Patch from './Modules/Patch'

class Context {
	public audioContext: AudioContext;
	public tempo: number;
	public modules: Map<string, AudioModule> = new Map();
	public cables: Map<string, Patch> = new Map();

	constructor(modules: Module[], cables: Cable[]) {
		this.audioContext = new AudioContext();
		this.tempo = 120;
		this.initContext(modules, cables);
	}

	initContext(modules: Module[], cables: Cable[]) {
		modules.forEach((m) => {
			this.modules.set(m.id, this.parseModule(m))
		});
		cables.forEach((c) => {
			this.addCable(c)
		})
	}

	parseModule(module: Module): AudioModule {
		switch (module.type) {
			case "oscillator": {
				const osc = new Oscillator(this.audioContext);
				osc.setFrequency(module.params.f);
				osc.setShape(module.params.w);
				return osc;
			}
			case "gain": {
				const gain = new Gain(this.audioContext);
				gain.setGain(module.params.g);
				return gain;
			}
			case "envelope": {
				const env = new Envelope(this.audioContext);
				env.attack = module.params.a;
				env.decay = module.params.d;
				env.sustain = module.params.s;
				env.release = module.params.r;
				return env;
			}
			case "output": {
				const out = new Output(this.audioContext);
				return out;
			}
			case "lfo": {
				const lfo = new LFOscillator(this.audioContext, this.tempo);
				lfo.setFrequency(module.params.f);
				lfo.setShape(module.params.w);
				lfo.setSync(module.params.s as any);
				return lfo;
			}
			case "filter": {
				const vcf = new VCF(this.audioContext);
				vcf.setFrequency(module.params.f);
				vcf.setQ(module.params.q);
				vcf.setType(module.params.t as any);
				return vcf;
			}
			case "distortion": {
				const dist = new Distortion(this.audioContext);
				dist.setDrive(module.params.d);
				dist.setDistortionType(module.params.t);
				return dist;
			}
			case "modulator": {
				const mod = new Modulator(this.audioContext);
				mod.setMode(module.params.m);
				return mod;
			}
		}
	}

	addModule(module: Module) {
		this.modules.set(module.id, this.parseModule(module));
	}

	delModule(module: Module) {
		this.modules.delete(module.id);
	}

	addCable(cable: Cable) {
		const id: string = cable.id;
		const [fromId, fromParam] = cable.from.split('.');
		const [toId, toParam] = cable.to.split('.');
		
		void(fromParam);
		const patch = new Patch(this.modules.get(fromId));
		this.cables.set(id, patch);
		this.modules.get(toId)?.setMod(toParam, patch);
	}

	delCable(cable: Cable) {
		const id: string = cable.id;
		const [toId, toParam] = cable.to.split('.');

		this.cables.delete(id);
		this.modules.get(toId)?.setMod(toParam, null);
	}
	
	setParam(id: string, param: string, value: any) {
		this.modules.get(id)?.setParam(param, value);
	}

	setTempo(newTempo: number): void {
		this.tempo = newTempo
	}
}

export default Context;