import { useState, useEffect, useRef } from "react";

interface Props {
  value: number;
  onSave: (val: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}

function EditableValue({ value, onSave, min = 0, max = 100, unit = "" }: Props)
{
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempValue(value.toString());
  }, [value]);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleBlur = () => {
    const num = Math.min(max, Math.max(min, parseFloat(tempValue) || 0));
    onSave(num);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleBlur();
    if (e.key === "Escape") {
      setTempValue(value.toString());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className="w-16 bg-zinc-800 text-cyan-400 text-xs text-center rounded border border-cyan-500/50 outline-none"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-[10px] text-zinc-400 hover:text-cyan-400 hover:bg-white/5 px-1 rounded transition-colors cursor-edit"
    >
      {value}
      {unit}
    </button>
  );
}

export default EditableValue;