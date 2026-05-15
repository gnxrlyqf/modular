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

interface SplitterProps extends ModuleProps {
}

function Splitter(props: SplitterProps) {
  const moduleRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({x: props.x, y: props.y});
  const { menu, handleContextMenu } = useContextMenu();
  const color = "#BBE0EF"

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
      title={props.title || "Splitter"}
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
        <Param id={props.id} name="output 1" polarity="source" color={color}/>
        <Param id={props.id} name="input" polarity="target" color={color}/>
        <Param id={props.id} name="output 2" polarity="source" color={color}/>
      </div>
    </ModuleFrame>
  );
}
export const SPLIT_W = MODULE_WIDTH;
export const SPLIT_H = MODULE_HEIGHT;
export default Splitter;