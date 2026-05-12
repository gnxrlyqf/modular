import { v4 as uuidv4 } from "uuid";
import type { DockItemData } from '../Dock'
import { type Module, type ModuleType, createDefaultParams} from '../Modules/Modules'

import Oscillator, { OSC_W, OSC_H } from '../Modules/Oscillator';
import Gain, { GAIN_W, GAIN_H } from '../Modules/Gain';
import Envelope, { ENV_W, ENV_H } from '../Modules/Envelope';
import Output, { OUT_W, OUT_H } from '../Modules/Output';
import LFO, { LFO_W, LFO_H } from '../Modules/LFO';
import Filter, { FLT_W, FLT_H } from '../Modules/Filter';
import Distortion, { DIST_W, DIST_H } from '../Modules/Distortion';
import Modulator, { MOD_W, MOD_H } from '../Modules/Modulator';
import Keyboard, { KYBD_W, KYBD_H } from "../Modules/Keyboard";
import Sequencer, { SEQ_W, SEQ_H } from "../Modules/Sequencer";

function OscIcon(props: {size: number}) {
  return (
		<svg
			viewBox="0 0 400 400"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			width={props.size}
			height={props.size}
		>
			<path
				d="M57 193.48C61.6479 150.493 84.5896 129 125.825 129C187.678 129 195.16 272 269.08 272C330.771 272 343 201.978 343 193.48"
				stroke="currentColor"
				strokeOpacity="1"
				strokeWidth="30"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
  )
}

function GainIcon(props: {size: number}) {
  return (
    <svg fill="#FFFFFF" height={props.size} width={props.size} version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" 
      viewBox="85 170 342 342"
      >
        <g><g><g><path d="M376.685,220.648c-0.047-0.047-0.098-0.085-0.145-0.131c-30.874-30.803-73.482-49.85-120.539-49.85
        c-94.257,0-170.667,76.41-170.667,170.667S161.743,512,256,512s170.667-76.41,170.667-170.667
        c0-47.058-19.047-89.666-49.85-120.539C376.77,220.747,376.732,220.695,376.685,220.648z M256,469.333
        c-70.693,0-128-57.307-128-128s57.307-128,128-128c27.644,0,53.241,8.764,74.165,23.665l-89.25,89.25
        c-8.331,8.331-8.331,21.839,0,30.17c8.331,8.331,21.839,8.331,30.17,0l89.25-89.25c14.9,20.924,23.665,46.521,23.665,74.165
        C384,412.026,326.693,469.333,256,469.333z"/></g></g></g>
    </svg>
  )
}

function EnvelopeIcon(props: {size: number}) {
  return (
    <svg 
      width={props.size} height={props.size} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <path stroke="#FFFFFF" fill="#FFFFFF" strokeWidth={10}
      d="M25 184c-.47 2.68-.227 4.354 1 6s4.563 2.464 8 2c3.437-.464 5.078-.958 6-4 .922-3.042 40.167-102.359 40.167-102.359 1.012-2.563 2.655-2.563 3.676.018l15.08 38.128c1.218 3.077 4.9 5.591 8.21 5.616L188 130s26.23 53.28 27.993 56.358c1.764 3.079 4.94 5.225 7.237 5.24 2.297.016 5.15-2.404 6.552-3.598 1.402-1.194 2.88-3.828 1.661-6.824-1.218-2.995-29.623-58.905-31.318-61.992C198.43 116.096 196.266 114 192 114s-76.877-.318-76.877-.318c-2.207-.01-4.608-1.691-5.37-3.777 0 0-12.403-33.889-13.717-37.905-1.314-4.016-6.912-7.827-14.036-7.827S70.086 66.695 68 72c-2.086 5.305-42.53 109.32-43 112z"/>
    </svg>
  )
}

function OutputIcon(props: {size: number}) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 7H12.01M12.5 7C12.5 7.27614 12.2761 7.5 12 7.5C11.7239 7.5 11.5 7.27614 11.5 7C11.5 6.72386 11.7239 6.5 12 6.5C12.2761 6.5 12.5 6.72386 12.5 7ZM15 14C15 15.6569 13.6569 17 12 17C10.3431 17 9 15.6569 9 14C9 12.3431 10.3431 11 12 11C13.6569 11 15 12.3431 15 14ZM8.2 21H15.8C16.9201 21 17.4802 21 17.908 20.782C18.2843 20.5903 18.5903 20.2843 18.782 19.908C19 19.4802 19 18.9201 19 17.8V6.2C19 5.0799 19 4.51984 18.782 4.09202C18.5903 3.71569 18.2843 3.40973 17.908 3.21799C17.4802 3 16.9201 3 15.8 3H8.2C7.0799 3 6.51984 3 6.09202 3.21799C5.71569 3.40973 5.40973 3.71569 5.21799 4.09202C5 4.51984 5 5.07989 5 6.2V17.8C5 18.9201 5 19.4802 5.21799 19.908C5.40973 20.2843 5.71569 20.5903 6.09202 20.782C6.51984 21 7.07989 21 8.2 21Z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function LfoIcon(props: { size: number }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M50 200C50 200 80 130 125 130C170 130 180 270 225 270C270 270 300 200 350 200"
        stroke="white"
        strokeWidth="30"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterIcon(props: { size: number }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M80 120V280H240L320 120"
        stroke="white"
        strokeWidth="25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="160" cy="200" r="30" fill="white" />
    </svg>
  );
}

function DistIcon(props: { size: number }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M60 280L140 120H260L340 280"
        stroke="white"
        strokeWidth="30"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M140 200H260" stroke="white" strokeWidth="20" strokeDasharray="40 40" />
    </svg>
  );
}

function ModIcon(props: { size: number }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="80" y="80" width="240" height="240" rx="20" stroke="white" strokeWidth="25" />
      <path d="M80 200H320M200 80V320" stroke="white" strokeWidth="20" />
      <circle cx="140" cy="140" r="15" fill="white" />
      <circle cx="260" cy="260" r="15" fill="white" />
    </svg>
  );
}

function KeyIcon(props: { size: number }) {
  return (
    <svg
      width={props.size}
      height={props.size}
      viewBox="-10 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="60" y="120" width="260" height="160" rx="20" stroke="white" strokeWidth="20" />

      {/* white keys */}
      <rect x="80" y="140" width="60" height="120" fill="white" />
      <rect x="160" y="140" width="60" height="120" fill="white" />
      <rect x="240" y="140" width="60" height="120" fill="white" />

      {/* black keys */}
      <rect x="130" y="140" width="40" height="80" fill="black" />
      <rect x="210" y="140" width="40" height="80" fill="black" />
    </svg>
  );
}

function SeqIcon(props: { size: number }) {
  void(props.size)
  return (
    <span>placeholder</span>
  );
}

const objects: Record<ModuleType, { component: unknown; w: number; h: number }> = {
  // here is the issue of the ghost not taking the true dimensions
  "oscillator": { component: Oscillator, w: OSC_W, h: OSC_H },
  "gain":       { component: Gain,       w: GAIN_W, h: GAIN_H },
  "envelope":   { component: Envelope,   w: ENV_W,  h: ENV_H },
  "output":     { component: Output,     w: OUT_W,  h: OUT_H },
  "lfo":        { component: LFO,        w: LFO_W,  h: LFO_H },
  "filter":     { component: Filter,     w: FLT_W,  h: FLT_H },
  "distortion": { component: Distortion, w: DIST_W, h: DIST_H },
  "modulator":  { component: Modulator,  w: MOD_W,  h: MOD_H },
  "keyboard":   { component: Keyboard,   w: KYBD_W, h: KYBD_H},
  "sequencer":   { component: Sequencer,   w: SEQ_W, h: SEQ_H}
};

function GhostModule(props: { type: ModuleType; x: number; y: number; className?: string }) {
  const { w, h } = objects[props.type];
  
  return (
    <div
      className={`pointer-events-none absolute rounded-xl border-2 border-dashed border-white/90 bg-white/5 ${props.className ?? ""}`}
      style={{ width: w, height: h, left: props.x, top: props.y }}
    />
  )
}

function instantiateModule(type: ModuleType, x: number, y: number): Module {
  const id = uuidv4();

  switch (type) {
    case "oscillator":
      return { id, type: "oscillator", x, y, params:  createDefaultParams(type) };
    case "gain":
      return { id, type: "gain", x, y, params: createDefaultParams(type)};
    case "envelope":
      return { id, type: "envelope", x, y, params: createDefaultParams(type) };
    case "output":
      return { id, type: "output", x, y, params: createDefaultParams(type)};
    case "lfo":
      return { id, type: "lfo", x, y, params:  createDefaultParams(type)};
    case "filter":
      return { id, type: "filter", x, y, params:  createDefaultParams(type)};
    case "distortion":
      return { id, type: "distortion", x, y, params:  createDefaultParams(type)};
    case "modulator":
      return { id, type: "modulator", x, y, params:  createDefaultParams(type)};
    case "keyboard":
      return { id, type: "keyboard", x, y, params: createDefaultParams(type)};
    case "sequencer":
      return { id, type: "sequencer", x, y, params: createDefaultParams(type)};
    default:
      return { id, type: "gain", x, y, params: { g: 0 } };
  }
}

function createDockItems(onInstantiate: (type: ModuleType, e:React.MouseEvent) => void): DockItemData[] {
  return [
    {
      icon: <OscIcon size={50} />,
      label: 'Oscillator',
      onClick: (e: React.MouseEvent) => onInstantiate("oscillator", e)
    },
    {
      icon: <GainIcon size={30} />,
      label: 'Gain',
      onClick: (e: React.MouseEvent) => onInstantiate("gain", e)
    },
    {
      icon: <EnvelopeIcon size={40} />,
      label: 'Envelope',
      onClick: (e: React.MouseEvent) => onInstantiate("envelope", e)
    },
    {
      icon: <OutputIcon size={40} />,
      label: 'Output',
      onClick: (e: React.MouseEvent) => onInstantiate("output", e)
    },
    {
      icon: <LfoIcon size={50} />,
      label: 'LFO',
      onClick: (e: React.MouseEvent) => onInstantiate("lfo", e)
    },
    {
      icon: <FilterIcon size={50} />,
      label: 'Filter',
      onClick: (e: React.MouseEvent) => onInstantiate("filter", e)
    },
    {
      icon: <DistIcon size={45} />,
      label: 'Distortion',
      onClick: (e: React.MouseEvent) => onInstantiate("distortion", e)
    },
    {
      icon: <ModIcon size={40} />,
      label: 'Modulator',
      onClick: (e: React.MouseEvent) => onInstantiate("modulator", e)
    },
    {
      icon: <KeyIcon size={50} />,
      label: 'Keyboard',
      onClick: (e: React.MouseEvent) => onInstantiate("keyboard", e)
    },
    {
      icon: <SeqIcon size={50} />,
      label: 'sequencer',
      onClick: (e: React.MouseEvent) => onInstantiate("sequencer", e)
    },
  ];
}

export type { ModuleType };
export { GhostModule, createDockItems, instantiateModule, objects as moduleObjects };
export { OscIcon, GainIcon, EnvelopeIcon, OutputIcon, LfoIcon, FilterIcon, DistIcon, ModIcon, KeyIcon, SeqIcon };