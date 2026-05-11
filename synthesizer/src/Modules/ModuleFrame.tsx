import React from "react";
import { ModuleMenu } from "../Interactions/ContextMenu";

interface ModuleFrameProps {
  id: string;
  title: string;
  width: number;
  height: number;
  position: { x: number; y: number };
  baseColor: string;
  menu: { x: number; y: number } | null;
  moduleRef: React.RefObject<HTMLDivElement | null>;
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
  onHeaderMouseDown?: React.MouseEventHandler<HTMLDivElement>;
  children: React.ReactNode;
}

const MODULE_SHADOW_SIZE = 30;

function toShadowColor(baseColor: string) {
  if (baseColor.startsWith("#") && baseColor.length === 7) {
    return `${baseColor}60`;
  }

  return baseColor;
}

export default function ModuleFrame({
  id,
  title,
  width,
  height,
  position,
  baseColor,
  menu,
  moduleRef,
  onContextMenu,
  onHeaderMouseDown,
  children,
}: ModuleFrameProps) {
  const shadowColor = toShadowColor(baseColor);

  return (
    <div
      ref={moduleRef}
      data-patch-module="true"
      data-module-id={id}
      style={{ width, height, left: position.x, top: position.y, backgroundColor: baseColor, transition: 'box-shadow 0.2s'}}
      onContextMenu={onContextMenu}
      className={`bg-linear-to-b to-zinc-800/30 from-90% to-100% absolute m-4 flex flex-col text-white rounded-2xl overflow-visible font-lexend group`}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 ${MODULE_SHADOW_SIZE}px 0 ${shadowColor}`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
    >
      {menu && (
        <ModuleMenu
          id={id}
          x={menu.x}
          y={menu.y}
          color={baseColor}
          currentName={title}
        />
      )}
      <div
        className="bg-linear-to-t to-zinc-800/40 w-full px-4 pt-2 cursor-move select-none text-center rounded-2xl"
        onMouseDown={onHeaderMouseDown}
      >
        <span className="text-zinc-800 hover:text-zinc-300 duration-200 text-4xl leading-none">
          {title}
        </span>
      </div>
      <div className="bg-[rgb(52,52,52)] shadow-[inset_0_0_100px_-12px_rgb(31,31,31),inset_0_0_100px_-12px_rgb(0,0,0)] flex flex-1 min-h-0 flex-col gap-3 items-center rounded-lg  py-6 m-2">
        {children}
      </div>
    </div>
  );
}
