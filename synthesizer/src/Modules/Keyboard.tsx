import { useEffect, useRef, useState, useMemo } from "react";
import { useDrag } from "../Interactions/useDrag";
import type { ModuleProps } from "./Modules";
import { useContextMenu } from "../Utils/useContextMenu";
import ModuleFrame from "./ModuleFrame";
import styled from "styled-components";
import { audioContext } from "../Scene/Scene";
import { RadioSelect, RadioSelectOption } from "../Interactions/RadioSelect";



type KeyType = "white" | "black";

interface PianoKeyData {
  note: string;
  type: KeyType;
  left?: number;
}

interface KeyProps {
  keyType: KeyType;
  isActive: boolean;
  left?: number;
  onPress: () => void;
  onRelease: () => void;
}

interface KeyboardProps extends ModuleProps {
  // Add specific keyboard settings here if needed (e.g. octave)
}

const MODULE_WIDTH = 704; 
const MODULE_HEIGHT = 320;

const WHITE_KEY_WIDTH = 45;
const BLACK_KEY_WIDTH = 28;

const BLACK_KEY_HEIGHT = 100;
const WHITE_KEY_HEIGHT = 180;
const OCTAVES = 2;

const WHITE_PATTERN = ["C", "D", "E", "F", "G", "A", "B"];

const BLACK_PATTERN = [
  { note: "C#", after: 0 },
  { note: "D#", after: 1 },
  { note: "F#", after: 3 },
  { note: "G#", after: 4 },
  { note: "A#", after: 5 },
];

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5,
  "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};

const KeyboardBed = styled.div`
  position: relative;
  display: flex;
  margin-top: 0px;
`;

const StyledKey = styled.div<{ $keyType: KeyType; $isActive: boolean; $left?: number;}>`
  position: ${(p) => (p.$keyType === "black" ? "absolute" : "relative")};

  ${(p) => p.$keyType === "black" && `
    left: ${p.$left}px;
    top: 0;
    z-index: 10;
    overflow: hidden;
  `}

  width: ${(p) => p.$keyType === "black" ? `${BLACK_KEY_WIDTH}px` : `${WHITE_KEY_WIDTH}px`};
  height: ${(p) => p.$keyType === "black" ? `${BLACK_KEY_HEIGHT}px`: `${WHITE_KEY_HEIGHT}px`};

  border-radius: 0 0 10px 10px;
  cursor: pointer;
  user-select: none;

  background: ${(p) =>
    p.$keyType === "black"
      ? "linear-gradient(to bottom, #444 0%, #000 100%)"
      : "linear-gradient(to bottom, #ffffff 0%, #e9e9e9 100%)"};

  border: 1px solid ${(p) => (p.$keyType === "black" ? "#000" : "#bbb")};

  box-shadow: ${(p) =>
    p.$isActive
      ? "inset 0 4px 10px rgba(0,0,0,0.6)"
      : p.$keyType === "black"
      ? "0 6px 10px rgba(0,0,0,0.6)"
      : "0 4px 6px rgba(0,0,0,0.25)"};

  transform: ${(p) => {
    if (!p.$isActive) return "translateY(0)";
    return p.$keyType === "black" ? "translateY(2px) scaleY(0.985)" : "translateY(3px)";
  }};

  transform-origin: top center;

  transition:
    transform 0.04s ease,
    box-shadow 0.04s ease;

  &:hover { filter: brightness(1.05); }
`;

function Key({ keyType, isActive, left, onPress, onRelease }: KeyProps) {
  return (
    <StyledKey
      $keyType={keyType}
      $isActive={isActive}
      $left={left}
      onMouseDown={onPress}
      onMouseUp={onRelease}
      onMouseLeave={onRelease}
      onTouchStart={(e) => { e.preventDefault(); onPress(); }}
      onTouchEnd={onRelease}
    />
  );
}

function Keyboard(props: KeyboardProps) {
  const moduleRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ x: props.x, y: props.y });
  const { menu, handleContextMenu } = useContextMenu();
  const color = "#a0a0a0ff";
  const [activeNotes, setActiveNotes] = useState<Record<string, boolean>>({});
  const [octaveShift, setOctaveShift] = useState(0);

  const MIN_OCTAVE = 0;
  const MAX_OCTAVE = 4;

  useEffect(() => {
    if (!moduleRef.current || position) return;
    const rect = moduleRef.current.getBoundingClientRect();
    setPosition({ x: rect.left + window.scrollX, y: rect.top + window.scrollY });
  }, [position]);

  const onMouseDown = useDrag(props, position, setPosition, moduleRef);

  const keys = useMemo(() => {
    const arr: PianoKeyData[] = [];

    const baseOctave = 2 + octaveShift;

    for (let octave = 0; octave < OCTAVES; octave++) {
      const realOctave = baseOctave + octave;
      const whiteOffset = octave * 7;

      WHITE_PATTERN.forEach((note) => {
        arr.push({ note: `${note}${realOctave}`, type: "white", });
      });

      BLACK_PATTERN.forEach((b) => {
        arr.push({
          note: `${b.note}${realOctave}`,
          type: "black",
          left: (whiteOffset + b.after + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2,
        });
      });
    }

    return arr;
  }, [octaveShift]);

  const getFrequency = (noteName: string) => {
    const note = noteName.slice(0, -1);
    const octave = parseInt(noteName.slice(-1));
    const semitone = octave * 12 + NOTE_TO_SEMITONE[note];

    return 440 * Math.pow(2, (semitone - 69) / 12);
  };

  const handleNoteDown = (noteId: string) => {
    setActiveNotes((p) => ({ ...p, [noteId]: true }));

    audioContext.setParam(props.id, "noteOn", {
      note: noteId,
      freq: getFrequency(noteId),
    });
  };

  const handleNoteUp = (noteId: string) => {
    setActiveNotes((p) => ({ ...p, [noteId]: false }));
    audioContext.setParam(props.id, "noteOff", noteId);
  };

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const incrementOctave = () => setOctaveShift((v) => clamp(v + 1, MIN_OCTAVE, MAX_OCTAVE));
  const decrementOctave = () => setOctaveShift((v) => clamp(v - 1, MIN_OCTAVE, MAX_OCTAVE));

  return (
    <ModuleFrame
      id={props.id}
      title={props.title || "Keyboard"}
      width={MODULE_WIDTH}
      height={MODULE_HEIGHT}
      position={position}
      baseColor={color}
      menu={menu}
      moduleRef={moduleRef}
      onContextMenu={handleContextMenu}
      onHeaderMouseDown={onMouseDown}
    >
      {/* Octave Shifting fih 7 octaves*/}
      <div className="mb-2 flex items-center justify-center gap-4">
        <button className="px-3 py-1 rounded-md bg-zinc-800 text-zinc-200 disabled:opacity-40"
          onClick={decrementOctave} disabled={octaveShift === MIN_OCTAVE} > 
          −
        </button>
        <div className="w-10 text-center text-zinc-300 text-sm">
          {octaveShift}
        </div>
        <button className="px-3 py-1 rounded-md bg-zinc-800 text-zinc-200 disabled:opacity-40"
          onClick={incrementOctave} disabled={octaveShift === MAX_OCTAVE} >
          +
        </button>
      </div>

      <KeyboardBed>
        {keys.map((k) => (
          <Key
            key={k.note}
            keyType={k.type}
            left={k.left}
            isActive={!!activeNotes[k.note]}
            onPress={() => handleNoteDown(k.note)}
            onRelease={() => handleNoteUp(k.note)}
          />
        ))}
      </KeyboardBed>
    </ModuleFrame>
  );
}

export const KYBD_W = MODULE_WIDTH;
export const KYBD_H = MODULE_HEIGHT;
export default Keyboard;