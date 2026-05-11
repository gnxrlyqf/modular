import React, { useRef, useState, useEffect, useCallback, type ReactNode, type MouseEventHandler, type UIEvent, type JSX } from 'react';
import { motion, useInView } from 'motion/react';
import {audioContext, type Cable} from './Scene';
import type {Module} from '../Modules/Modules'
import { OscIcon, GainIcon, EnvelopeIcon, OutputIcon, LfoIcon, FilterIcon, DistIcon, ModIcon } from './DockItems';
import { ModuleMenu } from '../Interactions/ContextMenu';

const modules: {
  [key: string]: {
    color: string;
    icon: JSX.Element;
  }
} = {
  oscillator: { color: "#C44A3A", icon: <OscIcon size={35} />},
  gain: { color: "#3852B4", icon: <GainIcon size={23} />},
  envelope: { color: "#6FAF4F", icon: <EnvelopeIcon size={32} />},
  output: { color: "#63748d", icon: <OutputIcon size={30} />},
  distortion: { color: "#DDBA7D", icon: <DistIcon size={35} />},
  filter: { color: "#F68048", icon: <FilterIcon size={40} />},
  lfo: { color: "#8F0177", icon: <LfoIcon size={35} />},
  modulator: { color: "#456882", icon: <ModIcon size={40} />}
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 12H20M20 12L16 8M20 12L16 16" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
  )
}

function Delete() {
  return (
    <svg
      fill="currentColor"
      width="24"
      height="24"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <path d="M18.8,16l5.5-5.5c0.8-0.8,0.8-2,0-2.8l0,0C24,7.3,23.5,7,23,7c-0.5,0-1,0.2-1.4,0.6L16,13.2l-5.5-5.5
        c-0.8-0.8-2.1-0.8-2.8,0C7.3,8,7,8.5,7,9.1s0.2,1,0.6,1.4l5.5,5.5l-5.5,5.5C7.3,21.9,7,22.4,7,23c0,0.5,0.2,1,0.6,1.4
        C8,24.8,8.5,25,9,25c0.5,0,1-0.2,1.4-0.6l5.5-5.5l5.5,5.5c0.8,0.8,2.1,0.8,2.8,0c0.8-0.8,0.8-2.1,0-2.8L18.8,16z"/>
    </svg>
  );
}

interface AnimatedItemProps {
  children: ReactNode;
  delay?: number;
  index: number;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const AnimatedItem: React.FC<AnimatedItemProps> = ({ children, delay = 0, index, onMouseEnter, onClick }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: false });
  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.2, delay }}
      className="mb-4 cursor-pointer"
    >
      {children}
    </motion.div>
  );
};

interface AnimatedListProps {
  items?: ReactNode[];
  onItemSelect?: (item: ReactNode, index: number) => void;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  className?: string;
  itemClassName?: string;
  displayScrollbar?: boolean;
  initialSelectedIndex?: number;
}

const AnimatedList: React.FC<AnimatedListProps> = ({
  items = [],
  onItemSelect,
  showGradients = true,
  enableArrowNavigation = true,
  className = '',
  itemClassName = '',
  displayScrollbar = true,
  initialSelectedIndex = -1
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(initialSelectedIndex);
  const [keyboardNav, setKeyboardNav] = useState<boolean>(false);
  const [topGradientOpacity, setTopGradientOpacity] = useState<number>(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState<number>(1);

  const handleItemMouseEnter = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleItemClick = useCallback(
    (item: ReactNode, index: number) => {
      setSelectedIndex(index);
      if (onItemSelect) {
        onItemSelect(item, index);
      }
    },
    [onItemSelect]
  );

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLDivElement;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
  };

  useEffect(() => {
    if (!enableArrowNavigation) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          if (onItemSelect) {
            onItemSelect(items[selectedIndex], selectedIndex);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;
    if (selectedItem) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: 'smooth'
        });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`mx-3 relative w-100 h-[calc(100%-1rem)] bg-zinc-950/70 rounded-2xl overflow-visible ${className}`}
    >
      <div
        ref={listRef}
        className={`overflow-y-auto p-2 pb-8 ${
          displayScrollbar
            ? '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-zinc-900/70 [&::-webkit-scrollbar-thumb]:bg-[#222] [&::-webkit-scrollbar-thumb]:rounded-1'
            : 'scrollbar-hide'
        }`}
        onScroll={handleScroll}
        style={{
          scrollbarWidth: displayScrollbar ? 'thin' : 'none',
          scrollbarColor: '#222 #120F17'
        }}
      >
        {items.map((item, index) => (
          <AnimatedItem
            key={index}
            delay={0.1}
            index={index}
            onMouseEnter={() => handleItemMouseEnter(index)}
            onClick={() => handleItemClick(item, index)}
          >
            <div className={`p-1 bg-zinc-800 rounded-xl ${itemClassName}`}>
              {item}
            </div>
          </AnimatedItem>
        ))}
      </div>
      {showGradients && (
        <>
          <div
            className="absolute top-0 left-0 right-0 h-12.5 bg-linear-to-b from-[#120F17] to-transparent pointer-events-none transition-opacity duration-300 ease"
            style={{ opacity: topGradientOpacity }}
          ></div>
          <div
            className="absolute bottom-0 left-0 right-0 h-25 bg-linear-to-t from-[#120F17] to-transparent pointer-events-none transition-opacity duration-300 ease"
            style={{ opacity: bottomGradientOpacity }}
          ></div>
        </>
      )}
    </motion.div>
  );
};
const MODULE_SHADOW_SIZE = 30;

function Matrix(props: {
  cables: Cable[],
  modules: Module[],
  setModules: React.Dispatch<React.SetStateAction<Module[]>>,
  setCables: React.Dispatch<React.SetStateAction<Cable[]>>, 
  view: 'modules' | 'cables',
  menu: { x: number, y: number } | null,
  activeModuleId: string | null
  handleContextMenu: (e: React.MouseEvent, id: string) => void
}) {
  
  const getModuleType = (portId: string) => {
    const [moduleId, param] = portId.split(".");
    const module = props.modules.find((m) => m.id === moduleId);
    return { moduleId, param, type: module?.type ?? "unknown" };
  };
  
  const onClickMouse = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, module: Module) => {
    document.querySelectorAll("[data-patch-module='true']").forEach((el) => {
      (el as HTMLDivElement).style.boxShadow = "none";
    });
    const moduleElement = document.querySelector(`[data-module-id='${module.id}']`) as HTMLDivElement | null;
    if (moduleElement) {
      const color = modules[module.type]?.color || "#646464ff";
      const shadowColor = `${color}60`;
      moduleElement.style.boxShadow = `0 0 ${MODULE_SHADOW_SIZE}px 0 ${shadowColor}`;
    }
    props.handleContextMenu(e, module.id);
  }

  const items = props.cables.map((item, idx) => {
    const from = getModuleType(item.from);
    const to = getModuleType(item.to);
    return (
      <div key={idx} className="text-white flex flex-row items-center justify-between">
        <div className="flex flex-row gap-1">
          <span
            className="rounded-l-lg w-10 h-10 flex items-center justify-center"
            style={{ background: modules[from.type].color}}>
            {modules[from.type].icon}
          </span>
          <span
            className="rounded-r-lg py-1 px-2 w-25 flex justify-center items-center"
            style={{ background: modules[from.type].color}}>
            {from.param}
          </span>
        </div>
        <div className='w-10 text-white'><Arrow /></div>
        <div className="flex flex-row gap-1">
          <span
            className="rounded-l-lg py-1 px-2 w-25 flex justify-center items-center"
            style={{ background: modules[to.type].color}}>
            {to.param}
          </span>
          <span
            className="rounded-r-lg w-10 h-10 flex items-center justify-center"
            style={{ background: modules[to.type].color}}>
            {modules[to.type].icon}
          </span>
        </div>
        <button
          className='mr-0.5 cursor-pointer text-red-500 border-2 border-red-500 rounded-md hover:bg-red-500 hover:text-white ease-in-out duration-100'
          onClick={() => {
            props.setCables(cables => cables.filter((_, i) => i !== idx));
            audioContext.delCable(props.cables[idx]);
          }}
        >
          <Delete />
        </button>
      </div>
    );
  });
  
  const moduleItems = props.modules.map((module) => (
    <div 
      key={module.id} 
      className="text-white flex flex-row items-center w-full cursor-pointer hover:bg-white/5 p-1 rounded-xl group" 
      onClick={(e) => {onClickMouse(e, module)}}
    >
      <div className="rounded-lg flex gap-1 flex-1 pointer-events-none block truncate max-w-full">
        <span
          className="rounded-l-lg w-10 h-10 flex-shrink-0 flex items-center justify-center "
          style={{ background: modules[module.type]?.color }}>
          {modules[module.type]?.icon}
        </span>
        <span
          className="rounded-r-lg py-1 px-2 flex items-center truncate min-w-0"
          style={{ background: modules[module.type]?.color }}>
          {(module as any).title || module.type}
        </span>
      </div>
      {props.menu && props.activeModuleId === module.id && (
        <div className="absolute z-9999">
          <ModuleMenu 
            id={module.id} 
            x={props.menu.x} 
            y={props.menu.y} 
            color={(modules[module.type] as any)?.color || "#C44A3A"}
            currentName={(module as any).title || module.type}
          />
        </div>
      )}
    </div>
  ));
  
  return (
    <AnimatedList items={props.view === 'modules' ? moduleItems : items} showGradients={false}/>
  )
}

export default Matrix;

