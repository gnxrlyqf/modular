import styled from "styled-components";
import { useEffect, useMemo, useRef, useState } from "react";

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

const WHITE_KEY_WIDTH = 60;
const BLACK_KEY_WIDTH = 38;
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

const KeyboardWrapper = styled.div`
  padding: 40px;
  background: #111;
  border-radius: 16px;
  width: fit-content;
  overflow-x: auto;
`;

const KeyboardBed = styled.div`
  position: relative;
  display: flex;
  height: 220px;
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
  height: ${(p) => p.$keyType === "black" ? "130px" : "220px"};

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
    return p.$keyType === "black"
      ? "translateY(2px) scaleY(0.985)"
      : "translateY(3px)";
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

export default function Keyboard() {
  const [activeNotes, setActiveNotes] = useState<Record<string, boolean>>({});
  const audioCtx = useRef<AudioContext | null>(null);
  const oscillators = useRef<Record<string, OscillatorNode>>({});
  const gains = useRef<Record<string, GainNode>>({});

  const keys = useMemo(() => {
    const arr: PianoKeyData[] = [];

    for (let octave = 0; octave < OCTAVES; octave++) {
      const whiteOffset = octave * 7;

      WHITE_PATTERN.forEach((note) => {
        arr.push({
          note: `${note}${octave + 2}`,
          type: "white",
        });
      });

      BLACK_PATTERN.forEach((b) => {
        arr.push({
          note: `${b.note}${octave + 2}`,
          type: "black",
          left: (whiteOffset + b.after + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2,
        });
      });
    }

    arr.push({ note: `C${OCTAVES + 2}`, type: "white" });

    return arr;
  }, []);

  const getFrequency = (noteName: string) => {
    const note = noteName.slice(0, -1);
    const octave = parseInt(noteName.slice(-1));
    const semitones = octave * 12 + NOTE_TO_SEMITONE[note];
    return 440 * Math.pow(2, (semitones - 69) / 12);
  };

  const initAudio = async () => {
    if (!audioCtx.current)
      audioCtx.current = new AudioContext();

    if (audioCtx.current.state === "suspended")
      await audioCtx.current.resume();
  };

  const handleNoteDown = async (noteId: string) => {
    if (oscillators.current[noteId]) return;

    await initAudio();

    if (!audioCtx.current) return;

    const now = audioCtx.current.currentTime;

    setActiveNotes((prev) => ({ ...prev, [noteId]: true }));

    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(getFrequency(noteId), now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);

    osc.connect(gain);
    gain.connect(audioCtx.current.destination);

    osc.start();

    oscillators.current[noteId] = osc;
    gains.current[noteId] = gain;
  };

  const handleNoteUp = (noteId: string) => {
    const osc = oscillators.current[noteId];
    const gain = gains.current[noteId];

    if (!osc || !gain || !audioCtx.current) return;

    setActiveNotes((prev) => ({ ...prev, [noteId]: false }));

    const now = audioCtx.current.currentTime;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.stop(now + 0.08);

    delete oscillators.current[noteId];
    delete gains.current[noteId];
  };

  useEffect(() => {
    return () => {
      Object.values(oscillators.current).forEach((osc) => {
        try {
          osc.stop();
        } catch {}
      });

      audioCtx.current?.close();
    };
  }, []);

  return (
    <KeyboardWrapper>
      <KeyboardBed>
        {keys.map((key) => (
          <Key
            key={key.note}
            keyType={key.type}
            left={key.left}
            isActive={!!activeNotes[key.note]}
            onPress={() => handleNoteDown(key.note)}
            onRelease={() => handleNoteUp(key.note)}
          />
        ))}
      </KeyboardBed>
    </KeyboardWrapper>
  );
}
