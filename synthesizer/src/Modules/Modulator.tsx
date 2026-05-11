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
const MODULE_HEIGHT = 544;

function Modulator(props: ModuleProps & {
  m: "AM" | "FM" | "PM" | "RM";
  d: number;
}) {
  const moduleRef = useRef<HTMLDivElement | null>(null);

  const [position, setPosition] = useState({
    x: props.x,
    y: props.y,
  });

  const [depth, setDepth] = useState(props.d);
  const [mode, setMode] = useState<"AM" | "FM" | "PM" | "RM">(props.m);

  const color = "#005fadff";
  const onMouseDown = useDrag(props, position, setPosition, moduleRef);
  const { menu, handleContextMenu } = useContextMenu();

  useEffect(() => {setDepth(props.d)}, [props.d]);
  useEffect(() => {setMode(props.m)}, [props.m]);

  // sync position init (same pattern as Oscillator)
  useEffect(() => {
    if (!moduleRef.current || position) return;

    const rect = moduleRef.current.getBoundingClientRect();
    setPosition({
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
    });
  }, [position]);

  // audio sync (consistent naming style)
  useEffect(() => {
    audioContext.setParam(props.id, "depth", depth);
  }, [depth]);

  useEffect(() => {
    audioContext.setParam(props.id, "mode", mode);
  }, [mode]);

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
      <div className="w-full flex items-center">
        <KnobParam id={props.id} name="depth" side="left" color={color}>
          <Knob
            max={15000}
            min={20}
            step={1}
            value={depth}
            onChange={setDepth}
            size={100}
            unit="Hz"
          />
        </KnobParam>
      </div>

      <div className="w-full flex flex-col gap-4 mt-2">
        <RadioSelect
          name={`${props.id}-radio`}
          value={mode}
          onChange={setMode}
        >
          <RadioSelectOption value="FM">FM</RadioSelectOption>
          <RadioSelectOption value="AM">AM</RadioSelectOption>
          <RadioSelectOption value="PM">PM</RadioSelectOption>
          <RadioSelectOption value="RM">RM</RadioSelectOption>
        </RadioSelect>

        <Param id={props.id} name="mod in" polarity="target" color={color} />
        <Param id={props.id} name="carrier" polarity="target" color={color} />
        <Param id={props.id} name="output" polarity="source" color={color} />
      </div>
    </ModuleFrame>
  );
}

export const MOD_W = MODULE_WIDTH;
export const MOD_H = MODULE_HEIGHT;
export default Modulator;