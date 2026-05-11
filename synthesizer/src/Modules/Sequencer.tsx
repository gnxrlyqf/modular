import { useEffect, useRef, useState, useMemo } from "react";
import { useDrag } from "../Interactions/useDrag";
import { KnobParam, Param } from "../Interactions/Params";
import { useContextMenu } from "../Utils/useContextMenu";
import ModuleFrame from "./ModuleFrame";
import { audioContext } from "../Scene/Scene";
import { type ModuleProps } from "./Modules";

interface SequencerProps extends ModuleProps {}

const MODULE_WIDTH = 704; 
const MODULE_HEIGHT = 320;

function Trig(props: {on: boolean}) {
  return (
    <>
    </>
  )
}

function Sequencer(props: SequencerProps) {
  const moduleRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({x: props.x, y: props.y});
  const { menu, handleContextMenu } = useContextMenu();
  const [sequence, setSequence] = useState<string>("1010");
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
          lhrba
        </div>
        <Param id={props.id} name="trigger" polarity="source" color={color}/>
      </div>
    </ModuleFrame>
  );
}
export const SEQ_W = MODULE_WIDTH;
export const SEQ_H = MODULE_HEIGHT;
export default Sequencer;