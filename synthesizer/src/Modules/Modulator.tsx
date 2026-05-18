import { useEffect, useRef, useState } from "react";
import Knob from "../Interactions/Knob";
import { RadioSelect, RadioSelectOption } from "../Interactions/RadioSelect";
import { useDrag } from "../Interactions/useDrag";
import { useContextMenu } from "../Utils/useContextMenu";
import { KnobParam, Param } from "../Interactions/Params";
import type { ModuleProps } from "./Modules";
import ModuleFrame from "./ModuleFrame";
import { audioContext } from "../Scene/Scene";

const MODULE_WIDTH = 224;
const MODULE_HEIGHT = 512;

function Modulator(props: ModuleProps & { m?: "AM" | "FM" | "PM" | "RM"; d?: number }) {
  const moduleRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ x: props.x, y: props.y });
  
  // Normalized range: 0% to 100%
  const [depth, setDepth] = useState(props.d ?? 50);
  const [mode, setMode] = useState<"AM" | "FM" | "PM" | "RM">(props.m ?? "AM");

  const color = "#005fadff";
  const onMouseDown = useDrag(props, position, setPosition, moduleRef);
  const { menu, handleContextMenu } = useContextMenu();

  useEffect(() => { if (props.d !== undefined) setDepth(props.d); }, [props.d]);
  useEffect(() => { if (props.m !== undefined) setMode(props.m); }, [props.m]);

  useEffect(() => {
    if (!moduleRef.current || position) return;
    const rect = moduleRef.current.getBoundingClientRect();
    setPosition({ x: rect.left + window.scrollX, y: rect.top + window.scrollY });
  }, [position]);

  useEffect(() => {
    audioContext.setParam(props.id, "depth", depth);
  }, [depth, props.id]);

  useEffect(() => {
    audioContext.setParam(props.id, "mode", mode);
  }, [mode, props.id]);

  return (
    <ModuleFrame
      id={props.id}
      title={props.title || "Modulator"}
      width={MODULE_WIDTH}
      height={MODULE_HEIGHT}
      position={position}
      baseColor={color}
      menu={menu}
      moduleRef={moduleRef}
      onContextMenu={handleContextMenu}
      onHeaderMouseDown={onMouseDown}
    >
      {/* Depth Knob Control */}
      <div className="w-full flex items-center justify-center">
        <KnobParam id={props.id} name="depth" side="left" color={color}>
          <Knob
            max={100}
            min={0}
            step={1}
            value={depth}
            onChange={setDepth}
            size={90}
            unit="%"
          />
        </KnobParam>
      </div>

      {/* Mode Selectors */}
      <div className="w-full px-4 flex justify-center my-2">
        <RadioSelect name={`${props.id}-radio`} value={mode} onChange={setMode}>
          <RadioSelectOption value="FM">FM</RadioSelectOption>
          <RadioSelectOption value="AM">AM</RadioSelectOption>
          <RadioSelectOption value="PM">PM</RadioSelectOption>
          <RadioSelectOption value="RM">RM</RadioSelectOption>
        </RadioSelect>
      </div>

      {/* Edge-wired I/O Jacks */}
      <Param id={props.id} name="mod in" polarity="target" color={color} />
      <Param id={props.id} name="carrier" polarity="target" color={color} />
      <Param id={props.id} name="output" polarity="source" color={color} />
    </ModuleFrame>
  );
}

export const MOD_W = MODULE_WIDTH;
export const MOD_H = MODULE_HEIGHT;
export default Modulator;