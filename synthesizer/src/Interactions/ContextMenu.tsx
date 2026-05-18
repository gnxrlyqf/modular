import React from 'react';
import { createPortal } from 'react-dom';

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

const ResetOption = ({ onDispatch, color }: { id: string, color: string, onDispatch: (action: string) => void }) => (
  <button
    className={`${optionClass} text-zinc-300 hover:bg-zinc-800/80`}
    style={{ boxShadow: `0 0 0px ${color}` }}
    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 18px ${color}55`; }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 0 0px ${color}`; }}
    onClick={() => onDispatch('RESET')}
  >
    <span>Reset</span>
    <span className="text-lg leading-none">↺</span>
  </button>
);

const RenameOption = ({ currentName, onDispatch, color }: { id: string, currentName: string, color: string, onDispatch: (action: string, detail?: any) => void }) => (
  <button
    className={`${optionClass} text-zinc-300 hover:bg-zinc-800/80`}
    style={{ boxShadow: `0 0 0px ${color}` }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = `0 0 18px ${color}55`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = `0 0 0px ${color}`;
    }}
    onClick={() => {
      const newName = prompt("Enter new module name:", currentName);
      if (newName) onDispatch('RENAME', { name: newName });
    }}
  >
    <span>Rename</span>
    <span className="text-lg leading-none">✎</span>
  </button>
);

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
    position: 'fixed',
    top: y,
    left: x,
    zIndex: 9999,
    border: `5px solid ${color}55`,
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
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
      <ResetOption id={id} color={color} onDispatch={dispatch} />
      <RenameOption id={id} color={color} onDispatch={dispatch} currentName={currentName} />
      <DeleteOption id={id} color={color} onDispatch={dispatch} />
    </div>,
    document.body
  );
}