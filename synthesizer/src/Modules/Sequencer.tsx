import { useEffect, useRef, useState } from "react";
import { useDrag } from "../Interactions/useDrag";
import { Param } from "../Interactions/Params";
import { useContextMenu } from "../Utils/useContextMenu";
import ModuleFrame from "./ModuleFrame";
import { type ModuleProps } from "./Modules";
import { RadioSelect, RadioSelectOption } from "../Interactions/RadioSelect";
import { audioContext } from "../Scene/Scene";

interface SequencerProps extends ModuleProps {
  s: number[],
  l: number
}

const MODULE_WIDTH = 704; 
const MODULE_HEIGHT = 256;

function Trig(props: {
  on: number;
  index: number;
  len: number;
  setSequence: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  const tileClass =
    props.len === 16
      ? "w-[1.875rem] h-[3.75rem]"
      : props.len === 32
        ? "w-[1.875rem] h-[1.875rem]"
        : "w-[3.75rem] h-[3.75rem]";
  const shadowClass =
    props.len === 32 || props.len === 16
      ? "shadow-[inset_0_0_6px_-2px_rgb(31,31,31),inset_0_0_6px_-2px_rgb(0,0,0)]"
      : "shadow-[inset_0_0_10px_-3px_rgb(31,31,31),inset_0_0_10px_-3px_rgb(0,0,0)]";

  return (
    <button
      type="button"
      onClick={() => {
        props.setSequence((prev) =>
          prev.map((value, currentIndex) => currentIndex === props.index ? (value === 1 ? 0 : 1) : value)
        );
      }}
      className={`${props.on ? "bg-red-700" : "bg-gray-300"} ${tileClass} bg-[rgb(52,52,52)] ${shadowClass} transition-colors cursor-pointer`}
    />
  )
}

function Sequencer(props: SequencerProps) {
  const moduleRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({x: props.x, y: props.y});
  const { menu, handleContextMenu } = useContextMenu();
  const [sequence, setSequence] = useState<number[]>(props.s);
  const [seqLen, setSeqLen] = useState<number>(props.l);
  const color = "#2FA084"

  const onMouseDown = useDrag(props, position, setPosition, moduleRef);
  // useEffect(() => {setRelease(props.r)}, [props.r]); // must do this for reset func later

  useEffect(() => {
    setSequence((prev) => {
      if (prev.length === seqLen) return prev;
      if (prev.length < seqLen) return [...prev, ...Array(seqLen - prev.length).fill(false)];
      return prev.slice(0, seqLen);
    });
  }, [seqLen]);

  useEffect(() => {
    audioContext.setParam(props.id, "sequence", sequence);
    window.dispatchEvent(new CustomEvent("moduleParamChange", {
      detail: { id: props.id, param: "s", value: sequence }
    }));
  }, [sequence, props.id])

  useEffect(() => {
    audioContext.setParam(props.id, "length", seqLen);
    window.dispatchEvent(new CustomEvent("moduleParamChange", {
      detail: { id: props.id, param: "l", value: seqLen }
    }));
  }, [seqLen, props.id])

  return (
    <ModuleFrame
      id={props.id}
      title="Sequencer"
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
        <div className="mx-20">
          <RadioSelect name={`${props.id}-radio`} value={seqLen} onChange={setSeqLen} >
            <RadioSelectOption value={4}>4</RadioSelectOption>
            <RadioSelectOption value={8}>8</RadioSelectOption>
            <RadioSelectOption value={16}>16</RadioSelectOption>
            <RadioSelectOption value={32}>32</RadioSelectOption>
          </RadioSelect>
        </div>
        <Param id={props.id} name="trigger" polarity="source" color={color}/>
      </div>
      <div className="flex flex-1 w-full items-center justify-center mt-1">
        <div
          className="grid w-fit"
          style={{
            gridTemplateColumns: `repeat(${Math.min(seqLen, 16)}, max-content)`,
            gap: seqLen === 32 || seqLen === 16 ? "0.5rem" : "0.75rem",
          }}
        >
          {sequence.map((v, i) => (
            <Trig key={i} on={v} index={i} len={seqLen} setSequence={setSequence} />
          ))}
        </div>
      </div>
    </ModuleFrame>
  );
}

export const SEQ_W = MODULE_WIDTH;
export const SEQ_H = MODULE_HEIGHT;
export default Sequencer;