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
const MODULE_HEIGHT = 280;

interface MixerProps extends ModuleProps {
}

function Mixer(props: MixerProps) {
  const moduleRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({x: props.x, y: props.y});
  const {mode} = useConnection();
  const { menu, handleContextMenu } = useContextMenu();
  const color = "#FD8A6B"

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
      title={props.title || "Mixer"}
      width={MODULE_WIDTH}
      height={MODULE_HEIGHT}
      position={position}
      baseColor={color}
      menu={menu}
      moduleRef={moduleRef}
      onContextMenu={handleContextMenu}
      onHeaderMouseDown={onMouseDown}
    >
      <div className="w-full flex flex-col gap-4 mt-2">
        <Param id={props.id} name="input 1" polarity="target" color={color}/>
        <Param id={props.id} name="output" polarity="source" color={color}/>
        <Param id={props.id} name="input 2" polarity="target" color={color}/>
      </div>
    </ModuleFrame>
  );
}
export const MIX_W = MODULE_WIDTH;
export const MIX_H = MODULE_HEIGHT;
export default Mixer;