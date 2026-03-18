import React from "react";

function Anchor(props : {text?: React.ReactNode}) {
    return (
        <div className="group">
            <a
                className="inline-block font-lexend leading-6 hover:text-white hover:shadow-xl text-indigo-700 bg-indigo-300 shadow-2xl cursor-pointer rounded-md duration-100 ease-in-out hover:scale-110"
            >
            <span className="block px-2 py-1 rounded-md bg-indigo-300">
                <div className="flex items-center space-x-2">
                <span className="duration-100">{props.text}</span>
                </div>
            </span>
            </a>
        </div>
    )
}

function Button(props : {text?: React.ReactNode; func?: (value: boolean) => void}) {
    return (
        <div className="group" onClick={() => {props.func && props.func(true)}}>
            <button type="button"
                className="inline-block font-lexend leading-6 hover:text-white hover:shadow-xl text-indigo-700 bg-indigo-300 shadow-2xl cursor-pointer rounded-md duration-100 ease-in-out hover:scale-110"
            >
            <span className="block px-2 py-1 rounded-md bg-indigo-300">
                <div className="flex items-center space-x-2">
                <span className="duration-100">{props.text}</span>
                </div>
            </span>
            </button>
        </div>
    )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const { className = "", ...inputProps } = props;

    return (
      <input 
            {...inputProps}
            className={`
                px-3 py-2 rounded-md outline-none
                bg-white/30
                focus:bg-white/50
                transform-all duration-200 ease-in-out
                ${className}
            `}
      />
    )
}

export {Anchor, Button, Input};