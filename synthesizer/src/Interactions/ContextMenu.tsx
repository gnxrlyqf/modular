import React from 'react';
import { useEffect, useRef, useState } from "react";

interface ModuleMenuProps {
  id: string;
  x: number;
  y: number;
  color: string;
  currentName: string;
}

const optionClass =
  "w-full text-left px-4 py-3 text-base rounded-xl flex justify-between \
  items-center transition-all duration-400 origin-center hover:scale-[1.03] hover:text-white";

const DisconnectOption = ({ onDispatch, color }: { id: string, color: string, onDispatch: (action: string) => void }) => (
  <button
    className={`${optionClass} text-zinc-300 hover:bg-zinc-800/80`}
    style={{ boxShadow: `0 0 0px ${color}` }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = `0 0 18px ${color}55`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = `0 0 0px ${color}`;
    }}
    onClick={() => onDispatch('DISCONNECT')}
  >
    <span>Disconnect</span>
    <span className="text-lg leading-none">✕</span>
  </button>
);


const RenameOption = ({ currentName, onDispatch, color }: {
    id: string; 
    currentName: string; 
    color: string; 
    onDispatch: (action: string, detail?: any) => void; 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and auto-select text when prompt opens
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== currentName) {
      onDispatch('RENAME', { name: trimmed });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setValue(currentName); // revert
      setIsEditing(false);
    }
  };

  // --- Styled UI Prompt Mode ---
  if (isEditing) {
    return (
      <div className={`${optionClass} bg-zinc-900/95 border border-zinc-800/60`} style={{boxShadow: `0 0 14px ${color}44`}} >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSubmit} // Saves automatically if user clicks away
          className="w-full bg-transparent text-zinc-200 text-sm outline-none pr-2 font-medium"
          style={{ caretColor: color }}
          placeholder="New name..."
        />
        <button 
          onClick={handleSubmit}
          className="text-xs font-bold px-2 py-0.5 rounded active:scale-95 transition-transform"
          style={{ color: color, backgroundColor: `${color}18` }}
        >
          OK
        </button>
      </div>
    );
  }

  // --- Standard Menu View ---
  return (
    <button
      className={`${optionClass} text-zinc-300 hover:bg-zinc-800/80`}
      style={{ boxShadow: `0 0 0px ${color}` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 18px ${color}55`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0px ${color}`;
      }}
      onClick={() => setIsEditing(true)}
    >
      <span>Rename</span>
      <span className="text-lg leading-none">✎</span>
    </button>
  );
};

const DeleteOption = ({ onDispatch, color }: { id: string, color: string, onDispatch: (action: string) => void }) => (
  <button
    className={`${optionClass} text-red-400 hover:bg-red-500 hover:text-white`}
    style={{ boxShadow: `0 0 0px ${color}` }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = `0 0 22px rgba(239,68,68,0.45)`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = `0 0 0px ${color}`;
    }}
    onClick={() => {onDispatch('DELETE');}}
  >
    <span className="font-semibold">Delete</span>
    <span className="text-lg leading-none">🗑</span>
  </button>
);

export function ModuleMenu({ id, x, y, color, currentName }: ModuleMenuProps)
{
  const dispatch = (action: string, detail = {}) => {
    window.dispatchEvent(new CustomEvent('MOD_ACTION', {
      detail: { type: action, id, ...detail }
    }));
  };

  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: y,
    left: x,
    zIndex: 9999,
    border: `5px solid ${color}55`,
  };

  return (
    <div
      style={menuStyle}
      className="w-56 bg-[#161616ee] backdrop-blur-xl rounded-2xl shadow-[0_12px_50px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col p-2 gap-1"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <div
        style={{ background: color, boxShadow: `0 0 18px ${color}55` }}
        className="px-4 py-3 text-base font-semibold text-white text-center rounded-xl mb-1 select-none"
      >
        Module Settings
      </div>

      <DisconnectOption id={id} color={color} onDispatch={dispatch} />
      <RenameOption id={id} color={color} onDispatch={dispatch} currentName={currentName} />
      <DeleteOption id={id} color={color} onDispatch={dispatch} />
    </div>
  );
}