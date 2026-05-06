import { useConnection } from "../ConnectionContext";
import React from "react";

function KnobParam(props: {id: string; name: string; side: "left" | "right"; color: string; children: React.ReactNode}) {
	const {mode, source, target, selectTarget} = useConnection();
	const accentStyle = { backgroundColor: props.color };
	const borderStyle = { borderColor: props.color };
	const portId = `${props.id}.${props.name}`;
	const isSelected = (mode === "selecting-target" && target === portId) || (mode === "selecting-source" && source === portId);
	const isDisabled = isSelected;
	const textColorClass = isDisabled ? "text-zinc-400" : "text-zinc-200";
	const childrenWithDisabled = React.Children.map(props.children, (child) => {
		if (!React.isValidElement<{ disabled?: boolean }>(child)) return child;
		const existingDisabled = Boolean(child.props.disabled);
		return React.cloneElement(child, { disabled: isDisabled || existingDisabled });
	});

	const [divHighlight, setDivHighlight] = React.useState(false);
  return (
	<>
	  <div className="w-full flex items-center">
		{props.side == "left" &&
		  <span
			data-port-id={`${props.id}.${props.name}`}
			data-port-side="left"
			className="h-1 flex-1"
			style={accentStyle}
		  />
		}
		{props.side == "right" && <span className="flex-1" />}
		<div
		  className="px-3 py-1 rounded-xl border-[3px] flex flex-col items-center gap-1 transition-colors duration-200 ease-in-out"
		  style={{
		    ...borderStyle,
		    transition: 'background 0.2s ease-in-out, color 0.2s ease-in-out',
				    background: (divHighlight || isSelected) ? props.color : undefined
		  }}
		  onMouseEnter={() => setDivHighlight(true)}
		  onMouseLeave={() => setDivHighlight(false)}
		>
		  <button
		    className={`text-md uppercase tracking-wide ${textColorClass} ${isDisabled ? "cursor-not-allowed border-gray-400" : "cursor-pointer"}`}
		    onClick={() => {
		      if (!isDisabled) selectTarget(props.id, props.name);
		    }}
		    disabled={isDisabled}
		  >
			{props.name}
		  </button>
		  {childrenWithDisabled}
		</div>
		{props.side == "left" && <span className="flex-1" />}
		{props.side == "right" &&
		  <span
			data-port-id={`${props.id}.${props.name}`}
			data-port-side="right"
			className="h-1 flex-1"
			style={accentStyle}
		  />
		}
	  </div>
	</>
  )
}

function Param(props: {id: string; name: string; polarity: "target" | "source"; color: string}) {
	const {mode, id, source, target, selectSource, selectTarget, isPortConnected} = useConnection();
	const type = props.polarity == "source" ? "selecting-source" : "selecting-target";
	const accentStyle = { backgroundColor: props.color };
	const borderStyle = { borderColor: props.color };
	const portId = `${props.id}.${props.name}`;
	const isConnected = isPortConnected(portId);
	const isSelected = (mode === "selecting-target" && target === portId) || (mode === "selecting-source" && source === portId);
	const isDisabled = mode == type || id == props.id;
	const textColorClass = isConnected
		? "text-zinc-800"
		: isSelected
		? "text-white"
		: isDisabled
		? "text-zinc-600"
		: "text-zinc-200";

  // Highlight state for the button only
	const [divHighlight, setDivHighlight] = React.useState(false);
  return (
	<>
	  <div className="w-full flex items-center">
		{props.polarity == "target" &&
		  <span
			data-port-id={`${props.id}.${props.name}`}
			data-port-side="left"
			className="h-1 flex-1"
			style={accentStyle}
		  />
		}
		{props.polarity == "source" && <span className="flex-1" />}
		<button
		  className={`px-4 py-2 rounded-xl border-[3px] flex items-center transition-colors duration-200 ease-in-out text-xl uppercase tracking-wide leading-none ${textColorClass} ${isDisabled ? "cursor-not-allowed border-gray-400" : "cursor-pointer"}`}
		  style={{
		    ...borderStyle,
		    transition: 'background 0.2s ease-in-out, color 0.2s ease-in-out',
				    background: (divHighlight || isConnected || isSelected) ? props.color : undefined
		  }}
		  onMouseEnter={() => setDivHighlight(true)}
		  onMouseLeave={() => setDivHighlight(false)}
		    onClick={() => {
		      if (props.polarity == "target")
		        selectTarget(props.id, props.name)
		      if (props.polarity == "source")
		        selectSource(props.id, props.name)
		    }}
		    disabled={isDisabled}
		  >
		    {props.name}
		</button>
		{props.polarity == "source" &&
		  <span
			data-port-id={`${props.id}.${props.name}`}
			data-port-side="right"
			className="h-1 flex-1"
			style={accentStyle}
		  />
		}
		{props.polarity == "target" && <span className="flex-1" />}
	  </div>
	</>
  )
}

export {KnobParam, Param};