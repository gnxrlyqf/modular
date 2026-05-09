import React, { useState, useCallback } from "react";
import type { XyloNote } from "./Xylophone";

function Anchor(props : {text?: React.ReactNode; note?: XyloNote; href?: string; onClick?: () => void}) {
    const note = props.note ?? "E4";
    return (
        <a
            href={props.href}
            onClick={props.onClick}
            data-xylo-note={note}
            tabIndex={0}
            className={`xylo-note xylo-note--${note.toLowerCase()} font-lexend`}
        >
            {props.text}
        </a>
    )
}

function Button(props : {text?: React.ReactNode; func?: (value: boolean) => void; note?: XyloNote}) {
    const note = props.note ?? "G4";
    return (
        <button type="button"
            onClick={() => {props.func && props.func(true)}}
            data-xylo-note={note}
            className={`xylo-note xylo-note--${note.toLowerCase()} font-lexend`}
        >
            {props.text}
        </button>
    )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const { className = "", ...inputProps } = props;

    return (
      <input
            {...inputProps}
            className={`
                w-full block box-border h-12
                px-4 py-3 rounded-lg outline-none font-lexend text-base
                bg-white/5 text-indigo-100
                border border-white/10
                focus:bg-white/8 focus:border-indigo-500/40
                placeholder:text-indigo-300/30
                transition-all duration-200 ease-out
                ${className}
            `}
      />
    )
}

/** Reusable close-button icon (X) — uses the .btn-close CSS class */
function CloseButton(props: { onClick?: () => void; className?: string }) {
    return (
        <button
            type="button"
            onClick={props.onClick}
            className={`btn-close ${props.className ?? ""}`}
            aria-label="Close"
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    )
}

// ─── Confirm Modal ───────────────────────────────────────────────────────────

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
};

type ConfirmState = ConfirmOptions & { resolve: (v: boolean) => void };

function ConfirmModal(props: { state: ConfirmState; onClose: (v: boolean) => void }) {
  const { title, message, confirmText = 'Confirm', danger } = props.state;
  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-sm font-lexend">
        <h3 className="text-lg font-semibold text-indigo-200 tracking-wide pb-2">{title}</h3>
        <p className="text-sm text-indigo-300/70 pb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => props.onClose(false)}
            className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => props.onClose(true)}
            className={`glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium tracking-wide duration-200 ease-out hover:scale-105 cursor-pointer ${danger ? 'text-red-300 hover:text-red-200 glow-red' : 'text-indigo-300/80 hover:text-white glow-indigo'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const handleClose = useCallback((value: boolean) => {
    state?.resolve(value);
    setState(null);
  }, [state]);

  const node = state ? <ConfirmModal state={state} onClose={handleClose} /> : null;

  return { confirm, node };
}

export {Anchor, Button, Input, CloseButton, ConfirmModal, useConfirm};
