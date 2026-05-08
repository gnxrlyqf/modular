import Oscillator from "../Modules/Oscillator";
import Gain from "../Modules/Gain";
import Envelope from "../Modules/Envelope";
import Output from "../Modules/Output";
import LFO from "../Modules/LFO";
import Filter from "./Filter";
import Distortion from "../Modules/Distortion";
import Modulator from "../Modules/Modulator";
import type { RefObject, Dispatch, SetStateAction } from "react";
import { ConnectionProvider } from "../ConnectionContext";
import { CameraProvider } from "../Viewport/CameraContext";
import type { Camera } from "../Viewport/useViewport";
import type { Cable } from "../Patch/Cable";

type BaseModule = {
  id: string;
  type: 'oscillator' | 'gain' | 'envelope' | 'output' | 'lfo' | 'filter' | 'distortion' | 'modulator';
  x: number;
  y: number;
}

type OscModule = BaseModule & {
	type: "oscillator";
	params: {
		f: number;
		w: "sine" | "square" | "triangle" | "sawtooth";
	};
}

type GainModule = BaseModule & {
	type: "gain";
	params: {
		g: number;
	};
}

type EnvModule = BaseModule & {
	type: "envelope";
	params: {
		a: number;
		d: number;
		s: number;
		r: number;
	};
}

type OutModule = BaseModule & {
	type: "output";
	params: {
		m: number;
	};
}

type LfoModule = BaseModule & {
    type: "lfo";
    params: { f: number; w: "sine" | "square" | "triangle" | "sawtooth"; s: boolean };
}

type FilterModule = BaseModule & {
    type: "filter";
	params: { f: number; q: number; t: string };
}

type DistortModule = BaseModule & {
    type: "distortion";
    params: { d: number; t: "soft" | "hard" | "sine" | "downsample" };
}

type ModulateModule = BaseModule & {
    type: "modulator";
    params: { m: "AM" | "FM" | "PM" | "RM"; d: number };
}

type Module = OscModule | EnvModule | GainModule | OutModule | LfoModule | FilterModule | DistortModule | ModulateModule;

type ModuleType =
	| "oscillator"
	| "gain"
	| "envelope"
	| "output"
	| "lfo"
	| "filter"
	| "distortion"
	| "modulator";

export interface ModuleProps {
  id: string;
  x: number;
  y: number;
}

function RenderModules(props: {
  modules: Module[];
  cameraLive: RefObject<Camera>;
  f: Dispatch<SetStateAction<Cable[]>>;
  cables: Cable[];
}) {
  return (
    <CameraProvider liveRef={props.cameraLive}>
      <ConnectionProvider setCables={props.f} cables={props.cables}>
        {props.modules.map((m) => {
          switch (m.type) {
            case "oscillator":
              return <Oscillator key={m.id} id={m.id} x={m.x} y={m.y} f={m.params.f} w={m.params.w} />;
            case "gain":
              return <Gain key={m.id} id={m.id} x={m.x} y={m.y} g={m.params.g} />;
            case "envelope":
              return <Envelope key={m.id} id={m.id} x={m.x} y={m.y} a={m.params.a} d={m.params.d} s={m.params.s} r={m.params.r} />;
            case "output":
              return <Output key={m.id} id={m.id} x={m.x} y={m.y} m={m.params.m} />;
            case "lfo":
              return <LFO key={m.id} id={m.id} x={m.x} y={m.y} f={m.params.f} w={m.params.w} s={m.params.s} />;
            case "filter":
              return <Filter key={m.id} id={m.id} x={m.x} y={m.y} f={m.params.f} q={m.params.q} t={m.params.t} />;
            case "distortion":
              return <Distortion key={m.id} id={m.id} x={m.x} y={m.y} d={m.params.d} t={m.params.t} />;
            case "modulator":
              return <Modulator key={m.id} id={m.id} x={m.x} y={m.y} m={m.params.m} d={m.params.d} />;
            default: return null;
          }
        })}
      </ConnectionProvider>
    </CameraProvider>
  );
}

function parseModules(modules: any[]): Module[] {
  return modules.map((m: any) => {
    switch (m.type) {
      case "oscillator":
        return {
          id: m.id,
          type: "oscillator",
          x: m.x,
          y: m.y,
          params: {
            f: m.params.frequency ?? 440,
            w: (m.params.w ?? "sine") as "sine" | "square" | "triangle" | "sawtooth",
          },
        };
      case "gain":
        return {
          id: m.id,
          type: "gain",
          x: m.x,
          y: m.y,
          params: {
            g: m.params.g ?? 0,
          },
        };
      case "envelope":
        return {
          id: m.id,
          type: "envelope",
          x: m.x,
          y: m.y,
          params: {
            a: m.params.attack ?? 100,
            d: m.params.decay ?? 200,
            s: m.params.sustain ?? 0.7,
            r: m.params.release ?? 300,
          },
        };
      case "lfo":
        return {
          id: m.id,
          type: "lfo",
          x: m.x,
          y: m.y,
          params: {
            f: m.params.frequency ?? 1,
            w: (m.params.wave ?? "sine") as "sine" | "square" | "triangle" | "sawtooth",
            s: m.params.sync ?? false,
          },
        };
      case "filter":
        return {
          id: m.id,
          type: "filter",
          x: m.x,
          y: m.y,
          params: {
            f: m.params.cutoff ?? 1000,
            q: m.params.q ?? 1,
            t: m.params.type ?? "lowpass",
          },
        };
      case "distortion":
        return {
          id: m.id,
          type: "distortion",
          x: m.x,
          y: m.y,
          params: {
            d: m.params.d ?? 50,
            t: m.params.t ?? "saturation",
            w: (m.params.w ?? "sine") as "sine" | "square" | "triangle" | "saw",
          },
        };
      case "modulator":
        return {
          id: m.id,
          type: "modulator",
          x: m.x,
          y: m.y,
          params: {
            m: (m.params.m ?? "FM") as "AM" | "FM" | "PM" | "RM",
            d: m.params.d ?? 50,
            w: (m.params.w ?? "sine") as "sine" | "square" | "triangle" | "sawtooth",
          },
        };
      case "output":
        return {
          id: m.id,
          type: "output",
          x: m.x,
          y: m.y,
          params: {
            m: m.params.m ?? -6,
          },
        };
      default:
        throw new Error(`Unknown module type: ${m.type}`);
    }
  });
}

export type {Module, ModuleType};
export {RenderModules, parseModules};