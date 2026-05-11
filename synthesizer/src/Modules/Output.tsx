import { useEffect, useRef, useState } from "react";
import Knob from "../Interactions/Knob";
import { type ModuleProps } from "./Modules";
import {useDrag} from "../Interactions/useDrag";
import { KnobParam, Param } from "../Interactions/Params";
import { useContextMenu } from "../Utils/useContextMenu";
import ModuleFrame from "./ModuleFrame";
import { audioContext } from "../Scene/Scene";

const MODULE_WIDTH = 224;
const MODULE_HEIGHT = 352;

interface OutputProps extends ModuleProps { m: number; }

function Output(props: OutputProps) {
  const moduleRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({x: props.x, y: props.y});
  const [master, setMaster] = useState(props.m);
  const { menu, handleContextMenu } = useContextMenu();
  const color = "#63748d"

  useEffect(() => {
    if (!moduleRef.current || position) return;

    const rect = moduleRef.current.getBoundingClientRect();
    setPosition({ x: rect.left + window.scrollX, y: rect.top + window.scrollY });
  }, [position]);

  const onMouseDown = useDrag(props, position, setPosition, moduleRef);

  useEffect(() => {
    audioContext.setParam(props.id, "master", master);
  }, [master]);

  return (
    <ModuleFrame
      id={props.id}
      title={props.title || "Output"}
      width={MODULE_WIDTH}
      height={MODULE_HEIGHT}
      position={position}
      baseColor={color}
      menu={menu}
      moduleRef={moduleRef}
      onContextMenu={handleContextMenu}
      onHeaderMouseDown={onMouseDown}
      
    >
      <KnobParam id={props.id} name="master" side="left" color={color}>
        <Knob max={0} min={-60} step={0.1} value={master} onChange={setMaster} size={100} unit="dB" />
      </KnobParam>
      <Param id={props.id} name="input" polarity="target" color={color}/>
    </ModuleFrame>
  );
}
export const OUT_W = MODULE_WIDTH;
export const OUT_H = MODULE_HEIGHT;
export default Output;