import { useEffect, useRef, useState } from "react";
import Knob from "../Interactions/Knob";
import {useDrag} from "../Interactions/useDrag";
import { KnobParam, Param } from "../Interactions/Params";
import type { ModuleProps } from "./Modules";
import { useContextMenu } from "../Utils/useContextMenu";
import ModuleFrame from "./ModuleFrame";
import { audioContext } from "../Scene/Scene";

const MODULE_WIDTH = 224;
const MODULE_HEIGHT = 848;

interface EnvelopeProps extends ModuleProps {
  a: number;
  d: number;
  s: number;
  r: number;
}

function Envelope(props: EnvelopeProps) {
  const moduleRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({x: props.x, y: props.y});
  const [attack, setAttack] = useState(props.a);
  const [decay, setDecay] = useState(props.d);
  const [sustain, setSustain] = useState(props.s);
  const [release, setRelease] = useState(props.r);
  const { menu, handleContextMenu } = useContextMenu();
  const color = "#6FAF4F"

  useEffect(() => {setAttack(props.a)}, [props.a]);
  useEffect(() => {setDecay(props.d)}, [props.d]);
  useEffect(() => {setSustain(props.s)}, [props.s]);
  useEffect(() => {setRelease(props.r)}, [props.r]);

  useEffect(() => audioContext.setParam(props.id, "attack", attack), [attack]);
  useEffect(() => audioContext.setParam(props.id, "decay", decay), [decay]);
  useEffect(() => audioContext.setParam(props.id, "sustain", sustain), [sustain]);
  useEffect(() => audioContext.setParam(props.id, "release", release), [release]);

  useEffect(() => {
    if (!moduleRef.current || position) {
      return;
    }

    const rect = moduleRef.current.getBoundingClientRect();
    setPosition({ x: rect.left + window.scrollX, y: rect.top + window.scrollY });
  }, [position]);

  const onMouseDown = useDrag(props, position, setPosition, moduleRef);

  return (
    <ModuleFrame
      id={props.id}
      title={props.title || "Envelope"}
      width={MODULE_WIDTH}
      height={MODULE_HEIGHT}
      position={position}
      baseColor={color}
      menu={menu}
      moduleRef={moduleRef}
      onContextMenu={handleContextMenu}
      onHeaderMouseDown={onMouseDown}
      
    >
      <div className="flex flex-row w-full">
        <div className="w-full flex flex-col gap-3">
          <KnobParam id={props.id} name="attack" side="left" color={color}>
            <Knob max={1000} min={0} step={1} value={attack} onChange={setAttack} size={70} unit="ms" />
          </KnobParam>
          <KnobParam id={props.id} name="decay" side="left" color={color}>
            <Knob max={1000} min={0} step={1} value={decay} onChange={setDecay} size={70} unit="ms" />
          </KnobParam>
          <KnobParam id={props.id} name="sustain" side="left" color={color}>
            <Knob max={100} min={0} step={1} value={sustain} onChange={setSustain} size={70} unit="%" />
          </KnobParam>
          <KnobParam id={props.id} name="release" side="left" color={color}>
            <Knob max={1000} min={0} step={1} value={release} onChange={setRelease} size={70} unit="ms" />
          </KnobParam>
        </div>
      </div>
      <div className="w-full flex flex-col gap-4 mt-2">
        <Param id={props.id} name="trigger" polarity="target" color={color}/>
        <Param id={props.id} name="output" polarity="source" color={color}/>
      </div>
    </ModuleFrame>
  );
}
export const ENV_W = MODULE_WIDTH;
export const ENV_H = MODULE_HEIGHT;
export default Envelope;