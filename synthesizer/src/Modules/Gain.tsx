import { useEffect, useRef, useState } from "react";
import Knob from "../Interactions/Knob";
import {useDrag} from "../Interactions/useDrag";
import { useConnection } from "../ConnectionContext";
import { KnobParam, Param } from "../Interactions/Params";
import type { ModuleProps } from "./Modules";
import { useContextMenu } from "../Utils/useContextMenu";
import ModuleFrame from "./ModuleFrame";
import { audioContext } from "../Scene/Scene";

const MODULE_WIDTH = 224;
const MODULE_HEIGHT = 416;

interface GainProps extends ModuleProps {
  g: number;
}

function Gain(props: GainProps) {
  const moduleRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({x: props.x, y: props.y});
  const [gain, setGain] = useState<number>(props.g);
  const {mode} = useConnection();
  const { menu, handleContextMenu } = useContextMenu();
  const color = "#3852B4"

  useEffect(() => {
    audioContext.setParam(props.id, "gain", gain);
  }, [gain]);

  useEffect(() => {
    if (!moduleRef.current || position)
      return;

    const rect = moduleRef.current.getBoundingClientRect();
    setPosition({ x: rect.left + window.scrollX, y: rect.top + window.scrollY });
  }, [position]);

  const onMouseDown = useDrag(props, position, setPosition, moduleRef);

  return (
    <ModuleFrame
      id={props.id}
      title={props.title || "Gain"}
      width={MODULE_WIDTH}
      height={MODULE_HEIGHT}
      position={position}
      baseColor={color}
      menu={menu}
      moduleRef={moduleRef}
      onContextMenu={handleContextMenu}
      onHeaderMouseDown={onMouseDown}
    >
      <KnobParam id={props.id} name="gain" side="left" color={color}>
        <Knob max={20} min={-60} step={0.25} value={gain} onChange={setGain} size={100} unit="dB" disabled={mode != "idle"}/>
      </KnobParam>
      <div className="w-full flex flex-col gap-4 mt-2">
        <Param id={props.id} name="input" polarity="target" color={color}/>
        <Param id={props.id} name="output" polarity="source" color={color}/>
      </div>
    </ModuleFrame>
  );
}
export const GAIN_W = MODULE_WIDTH;
export const GAIN_H = MODULE_HEIGHT;
export default Gain;