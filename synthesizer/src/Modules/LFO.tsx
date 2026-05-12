import { useEffect, useRef, useState } from "react";
import Knob from "../Interactions/Knob";
import { RadioSelect, RadioSelectOption } from "../Interactions/RadioSelect";
import { useDrag } from "../Interactions/useDrag";
import { useContextMenu } from "../Utils/useContextMenu";
import { KnobParam, Param } from "../Interactions/Params";
import ModuleFrame from "./ModuleFrame";
import { audioContext } from "../Scene/Scene";
import type { ModuleProps } from "./Modules";
import { useConnection } from "../ConnectionContext";

function SineIcon() {
  return (
    <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
      <path d="M57 193.48C61.6479 150.493 84.5896 129 125.825 129C187.678 129 195.16 272 269.08 272C330.771 272 343 201.978 343 193.48"
        stroke="currentColor" strokeOpacity="0.9" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function SquareIcon() {
  return (
    <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
      <path d="M979,970H473V81H82V498H28V26H528V915H924V498H979"
        fill="currentColor" stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function TriangleIcon() {
  return (
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="h-7 w-7">
      <path
        d="M143.266 80.636 Q152.661 80.636 158.924 88.465 L368.734 380.477
          L472.856 238.777 Q483.817 225.468 498.691 234.862 Q512 245.823 502.606 260.697 L383.609 423.535
          Q378.128 431.364 368.734 431.364 Q359.339 431.364 353.076 423.535 L143.266 131.523 L39.144 273.223
          Q28.183 286.532 13.309 277.138 Q0 266.177 9.394 251.303 L128.391 88.465 Q133.872 80.636 143.266 80.636Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SawIcon() {
  return (
    <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
      <path d="M461,956V211L62,564L10,505L539,38V798L935,497L982,558"
        fill="currentColor" stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

const MODULE_WIDTH = 224;
const MODULE_HEIGHT = 448;

interface LFOProps extends ModuleProps {
  f: number;
  w: "sine" | "square" | "triangle" | "sawtooth";
  s: boolean;
}

const SYNC_DIVISIONS = [1, 2, 4, 8, 16, 32] as const;
const SYNC_DIVISION_LABELS: Record<(typeof SYNC_DIVISIONS)[number], string> = {
  1: "1/1",
  2: "1/2",
  4: "1/4",
  8: "1/8",
  16: "1/16",
  32: "1/32",
};

function LFO(props: LFOProps) {

  const moduleRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ x: props.x, y: props.y });
  const [frequency, setFrequency] = useState(props.f);
  const [waveshape, setWaveshape] = useState<"sine" | "square" | "triangle" | "sawtooth">(props.w);
  const [time, setTime] = useState<"" | "t" | ".">("");
  const [sync, setSync] = useState(props.s);
  const [syncStep, setSyncStep] = useState(1);
  const { menu, handleContextMenu } = useContextMenu();
  const color = "#8F0177";
  const onMouseDown = useDrag(props, position, setPosition, moduleRef);

  useEffect(() => {setFrequency(props.f)}, [props.f]);
  useEffect(() => {setWaveshape(props.w)}, [props.w]);
  useEffect(() => {setSync(props.s)}, [props.s]);

  useEffect(() => {
    audioContext.setParam(props.id, "frequency", frequency);
  }, [frequency]);

  useEffect(() => {
    audioContext.setParam(props.id, "wave", waveshape);
  }, [waveshape]);

  useEffect(() => {
    const selectedDivision = SYNC_DIVISIONS[syncStep];
    audioContext.setParam(props.id, "sync", sync ? selectedDivision : false);
  }, [props.id, sync, syncStep]);

  return (
    <ModuleFrame
      id={props.id}
      title={props.title || "LFO"}
      width={MODULE_WIDTH}
      height={MODULE_HEIGHT}
      position={position}
      baseColor={color}
      menu={menu}
      moduleRef={moduleRef}
      onContextMenu={handleContextMenu}
      onHeaderMouseDown={onMouseDown}
    >
      <div className="flex gap-2 bg-purple-900/50 p-1 rounded-lg">
        <button onClick={() => setSync(false)} className={`cursor-pointer px-3 py-1 rounded-md text-xs ${!sync ? "bg-[#8F0177]" : ""}`}>FREE</button>
        <button onClick={() => {
          setSync(true)
          // disconnect
        }} className={`cursor-pointer px-3 py-1 rounded-md text-xs ${sync ? "bg-[#8F0177]" : ""}`}>SYNC</button>
      </div>
      <div className="w-full flex items-center">
        {sync ?
        		<div className="p-1 rounded-xl border-[3px] flex flex-col items-center gap-1 mx-5"
              style={{borderColor: color}}
              >
          RATE
          <div className="my-3 text-center text-2xl text-zinc-200">
            {SYNC_DIVISION_LABELS[SYNC_DIVISIONS[syncStep]] + time}
          </div>
          <input
            type="range"
            min={0}
            max={SYNC_DIVISIONS.length - 1}
            step={1}
            value={syncStep}
            onChange={(e) => setSyncStep(Number(e.target.value))}
            className="w-[90%] h-2 rounded-lg appearance-none cursor-pointer bg-zinc-700 accent-[#8F0177]"
          />
          <div className="mt-6 mb-2">
            <RadioSelect value={time} onChange={setTime} >
              <RadioSelectOption value={""}>S</RadioSelectOption>
              <RadioSelectOption value={"t"}>trip</RadioSelectOption>
              <RadioSelectOption value={"."}>dot</RadioSelectOption>
            </RadioSelect>
          </div> 
        </div>
         :
        <KnobParam id={props.id} name={"freq"} side="left" color={color}>
          <Knob
            max={20}
            min={.1}
            step={1}
            value={frequency}
            onChange={setFrequency}
            size={100}
            unit={"Hz"}
          />
        </KnobParam>
        }
      </div>

      <RadioSelect name={`${props.id}-radio`} value={waveshape} onChange={setWaveshape}>
        <RadioSelectOption value="sine" label="sine"><SineIcon /></RadioSelectOption>
        <RadioSelectOption value="triangle" label="triangle"><TriangleIcon /></RadioSelectOption>
        <RadioSelectOption value="square" label="square"><SquareIcon /></RadioSelectOption>
        <RadioSelectOption value="sawtooth" label="sawtooth"><SawIcon /></RadioSelectOption>
      </RadioSelect>
      <Param name="output" id={props.id} polarity="source" color={color} />
    </ModuleFrame>
  );
}

export const LFO_W = MODULE_WIDTH;
export const LFO_H = MODULE_HEIGHT;
export default LFO;