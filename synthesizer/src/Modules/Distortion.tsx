import { useEffect, useRef, useState } from "react";
import Knob from "../Interactions/Knob";
import { RadioSelect, RadioSelectOption } from "../Interactions/RadioSelect";
import { useDrag } from "../Interactions/useDrag";
import { useContextMenu } from "../Utils/useContextMenu";
import { KnobParam, Param } from "../Interactions/Params";
import ModuleFrame from "./ModuleFrame";
import { audioContext } from "../Scene/Scene";
import type { ModuleProps } from "./Modules";

const MODULE_WIDTH = 224;
const MODULE_HEIGHT = 480;

function HardIcon() {
  return (
    <svg className="w-10 h-10" viewBox="0 0 300 300">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m 150,150 28.86751,-50 H 250 v 0"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m 150,150 -28.86751,50 H 50 v 0"
      />
    </svg>
  );
}

function SoftIcon() {
  return (
    <svg viewBox="-24 -24 300 300">
      <path d="M233 64.5h-28.495c-18.104 0-32.517 4.04-49.695 18.089-15.765 12.892-30.941 31.655-39.559 46.948-12.478 22.144-33.858 39.953-43.54 43.463-9.68 3.51-23.202 3.5-30.711 3.5H25V192h23.5c9.747 0 26.265-.681 39.867-7.61 18.496-9.42 33.507-35.51 47.578-54.853 9.879-13.579 21.773-27.756 32.732-36.034C182.775 82.853 196.637 80 216.5 80H233V64.5z" />
    </svg>
  );
}

function SineIcon() {
  return (
    <svg className="w-10 h-10" viewBox="0 0 300 300">
      <g transform="scale(-1,1) translate(-300,0)">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M 30,150 Q 90,50 150,150 T 270,150"
        />
      </g>
    </svg>
  );
}

function DownsampleIcon() {
  return (
    <svg className="w-10 h-10" viewBox="0 0 300 300">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m 150,150 v -24.56609 h 24.87881 V 99.930748 H 199.8615 V 84.837041 h 25.50315 v 15.093707 h 24.46222 v 24.462212 h 25.50315"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 150,125.43391 V 150 h -24.87881 v 25.50316 H 100.1385 v 15.09371 H 74.63535 V 175.50316 H 50.17313 V 151.04095 H 24.66998"
      />
    </svg>
  );
}

interface DistortionProps extends ModuleProps {
  d: number;
  t: "soft" | "hard" | "sine" | "downsample";
}

function Distortion(props: DistortionProps) {
  const moduleRef = useRef<HTMLDivElement | null>(null);

  const [position, setPosition] = useState({
    x: props.x,
    y: props.y,
  });

  const [drive, setDrive] = useState(props.d);
  const [type, setType] = useState(props.t);

  const { menu, handleContextMenu } = useContextMenu();
  const color = "#DDBA7D";

  const onMouseDown = useDrag(props, position, setPosition, moduleRef);

  useEffect(() => {setDrive(props.d)}, [props.d]);
  useEffect(() => {setType(props.t)}, [props.t]);

  useEffect(() => {
    audioContext.setParam(props.id, "drive", drive);
  }, [drive]);

  useEffect(() => {
    audioContext.setParam(props.id, "type", type);
  }, [type]);

  return (
    <ModuleFrame
      id={props.id}
      title={props.title || "Distortion" }
      width={MODULE_WIDTH}
      height={MODULE_HEIGHT}
      position={position}
      baseColor={color}
      menu={menu}
      moduleRef={moduleRef}
      onContextMenu={handleContextMenu}
      onHeaderMouseDown={onMouseDown}
    >
      <KnobParam id={props.id} name="drive" side="left" color={color}>
        <Knob
          max={100}
          min={0}
          step={1}
          value={drive}
          onChange={setDrive}
          size={100}
          unit="%"
        />
      </KnobParam>

      <div className="w-full flex flex-col gap-4 mt-2">
        <RadioSelect
          name={`${props.id}-radio`}
          value={type}
          onChange={setType}
        >
          <RadioSelectOption value="soft" label="soft"><SoftIcon /></RadioSelectOption>
          <RadioSelectOption value="hard" label="hard"><HardIcon /></RadioSelectOption>
          <RadioSelectOption value="sine" label="sine"><SineIcon /></RadioSelectOption>
          <RadioSelectOption value="downsample" label="downsample"><DownsampleIcon /></RadioSelectOption>
        </RadioSelect>

        <Param id={props.id} name="input" polarity="target" color={color} />
        <Param id={props.id} name="output" polarity="source" color={color} />
      </div>
    </ModuleFrame>
  );
}

export const DIST_W = MODULE_WIDTH;
export const DIST_H = MODULE_HEIGHT;
export default Distortion;