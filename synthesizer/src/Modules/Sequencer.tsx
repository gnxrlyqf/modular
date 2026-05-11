import { useRef, useState } from "react";
import { useDrag } from "../Interactions/useDrag";
import { Param } from "../Interactions/Params";
import { useContextMenu } from "../Utils/useContextMenu";
import ModuleFrame from "./ModuleFrame";
import { type ModuleProps } from "./Modules";
import { RadioSelect, RadioSelectOption } from "../Interactions/RadioSelect";

interface SequencerProps extends ModuleProps {}

const MODULE_WIDTH = 704; 
const MODULE_HEIGHT = 320;

function Trig(props: {on: boolean}) {
  return (
    <div className={`${props.on ? "bg-red-500" : "bg-black"}`}>
      test
    </div>
  )
}

function Sequencer(props: SequencerProps) {
  const moduleRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({x: props.x, y: props.y});
  const { menu, handleContextMenu } = useContextMenu();
  const [sequence] = useState<boolean[]>([true, false, true, false]);
  const [seqLen, setSeqLen] = useState<number>(4);
  const color = "#63748d"

  const onMouseDown = useDrag(props, position, setPosition, moduleRef);

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
        <div className="ml-10 mr-20">
          <RadioSelect value={seqLen} onChange={setSeqLen} >
            <RadioSelectOption value={4}>4</RadioSelectOption>
            <RadioSelectOption value={8}>8</RadioSelectOption>
            <RadioSelectOption value={16}>16</RadioSelectOption>
            <RadioSelectOption value={32}>32</RadioSelectOption>
          </RadioSelect>
        </div>
        <Param id={props.id} name="trigger" polarity="source" color={color}/>
      </div>
      <div className="flex flex-row">
        {sequence.map((v) => <Trig on={v}/>)}
      </div>
    </ModuleFrame>
  );
}
export const SEQ_W = MODULE_WIDTH;
export const SEQ_H = MODULE_HEIGHT;
export default Sequencer;