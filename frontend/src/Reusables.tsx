import React from "react";

function Anchor(props : {text?: React.ReactNode}) {
    return (
        <a
            className="inline-flex items-center gap-2 font-lexend leading-6 text-indigo-300/80 hover:text-white cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium tracking-wide duration-200 ease-out hover:scale-105 glass glass-hover glow-indigo"
        >
            {props.text}
        </a>
    )
}

function Button(props : {text?: React.ReactNode; func?: (value: boolean) => void}) {
    return (
        <button type="button"
            onClick={() => {props.func && props.func(true)}}
            className="inline-flex items-center gap-2 font-lexend leading-6 text-indigo-300/80 hover:text-white cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium tracking-wide duration-200 ease-out hover:scale-105 glass glass-hover glow-indigo"
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

export {Anchor, Button, Input, CloseButton};