import { useEffect, useRef, useState } from "react";
import Knob from "../Interactions/Knob";
import {RadioSelect, RadioSelectOption} from "../Interactions/RadioSelect";
import {useDrag} from "../Interactions/useDrag";
import { useConnection } from "../ConnectionContext";
import { KnobParam, Param } from "../Interactions/Params";
import type { ModuleProps } from "./Modules";
import { useContextMenu } from "../Utils/useContextMenu";
import ModuleFrame from "./ModuleFrame";
import { audioContext } from "../Scene/Scene";

const MODULE_WIDTH = 224;
const MODULE_HEIGHT = 416;

function SineIcon() {
    return (
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
        <path
          d="M57 193.48C61.6479 150.493 84.5896 129 125.825 129C187.678 129 195.16 272 269.08 272C330.771 272 343 201.978 343 193.48" stroke="currentColor" strokeOpacity="0.9" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    )
}

function SquareIcon() {
  return (
    <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
      <path d="M979,970H473V81H82V498H28V26H528V915H924V498H979" fill="currentColor" stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TriangleIcon() {
  return (
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="h-7 w-7">
      <path d="M 143.26605504587155 80.63608562691131 Q 152.6605504587156 80.63608562691131 158.92354740061162 88.46483180428135 L 368.73394495412845 380.4770642201835 L 368.73394495412845 380.4770642201835 L 472.85626911314984 238.77675840978594 L 472.85626911314984 238.77675840978594 Q 483.8165137614679 225.4678899082569 498.69113149847095 234.86238532110093 Q 512 245.82262996941895 502.60550458715596 260.697247706422 L 383.6085626911315 423.53516819571865 L 383.6085626911315 423.53516819571865 Q 378.1284403669725 431.3639143730887 368.73394495412845 431.3639143730887 Q 359.3394495412844 431.3639143730887 353.0764525993884 423.53516819571865 L 143.26605504587155 131.52293577981652 L 143.26605504587155 131.52293577981652 L 39.14373088685015 273.22324159021406 L 39.14373088685015 273.22324159021406 Q 28.18348623853211 286.5321100917431 13.308868501529052 277.13761467889907 Q 0 266.177370030581 9.394495412844037 251.30275229357798 L 128.3914373088685 88.46483180428135 L 128.3914373088685 88.46483180428135 Q 133.87155963302752 80.63608562691131 143.26605504587155 80.63608562691131 L 143.26605504587155 80.63608562691131 Z" fill="currentColor" />
    </svg>
  )
}

function SawIcon() {
  return (
    <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
      <path d="M461,956V211L62,564L10,505L539,38V798L935,497L982,558" fill="currentColor" stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface OscillatorProps extends ModuleProps {
  f: number;
  w: 'sine' | 'square' | 'triangle' | 'sawtooth';
}

function Oscillator(props: OscillatorProps) {
  const moduleRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({x: props.x, y: props.y});
  const [frequency, setFrequency] = useState(props.f);
  const [waveshape, setWaveshape] = useState<'sine' | 'square' | 'triangle' | 'sawtooth'>(props.w);
  const {mode} = useConnection();
  const { menu, handleContextMenu } = useContextMenu();
  const color = "#C44A3A"

  useEffect(() => { setFrequency(props.f); }, [props.f]);
  useEffect(() => { setWaveshape(props.w); }, [props.w]);

  useEffect(() => {
    if (!moduleRef.current || position) { return; }

    const rect = moduleRef.current.getBoundingClientRect();
    setPosition({ x: rect.left + window.scrollX, y: rect.top + window.scrollY });
  }, [position]);

  const onMouseDown = useDrag(props, position, setPosition, moduleRef);

  useEffect(() => {
    audioContext.setParam(props.id, "frequency", frequency);
  }, [frequency])

  useEffect(() => {
    audioContext.setParam(props.id, "wave", waveshape);
  }, [waveshape])

	return (
		<ModuleFrame
      id={props.id}
      title={props.title || "Oscillator"}
      width={MODULE_WIDTH}
      height={MODULE_HEIGHT}
      position={position}
      baseColor={color}
      menu={menu}
      moduleRef={moduleRef}
      onContextMenu={handleContextMenu}
      onHeaderMouseDown={onMouseDown}
      
    >
      <div className="w-full flex items-center">
        <KnobParam id={props.id} name="frequency" side="left" color={color}>
          <Knob max={5000} min={20} step={1} value={frequency} size={100} unit="Hz" disabled={mode != "idle"} onChange={setFrequency}/>
        </KnobParam>
      </div>
      <div className="my-2">
        <RadioSelect name={`${props.id}-radio`} value={waveshape} onChange={setWaveshape}>
          <RadioSelectOption value="sine" label="sine"><SineIcon /></RadioSelectOption>
          <RadioSelectOption value="triangle" label="triangle"><TriangleIcon /></RadioSelectOption>
          <RadioSelectOption value="square" label="square"><SquareIcon/></RadioSelectOption>
          <RadioSelectOption value="sawtooth" label="sawtooth"><SawIcon /></RadioSelectOption>
        </RadioSelect>
      </div>
      <Param name="output" id={props.id} polarity="source" color={color}/>
    </ModuleFrame>
	)
}
export const OSC_W = MODULE_WIDTH;
export const OSC_H = MODULE_HEIGHT;
export default Oscillator;
