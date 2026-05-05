import Dock from "../Dock";
import type {Module} from '../Modules/Modules'
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import sceneData from "../scene.json";
import { wouldGhostOverlap } from "../Utils/wouldGhostOverlap";
import { snapToGrid } from "../Utils/snapToGrid";
import { createDockItems, GhostModule, instantiateModule, moduleObjects, type ModuleType } from './DockItems'
import { drawFrame } from "../Patch/Cable";
import Matrix from "./Matrix";
import { useContextMenu } from "../Utils/useContextMenu";
import type {Cable} from '../Patch/Cable'
import Context from "../Audio/Context";
import {RenderModules, parseModules} from "../Modules/Modules";

const initModules: Module[] = parseModules(sceneData.modules);
const initCables: Cable[] = sceneData.cables as Cable[]
const initCamera: {x: number, y: number} = sceneData.camera;
const audioContext = new Context(initModules, initCables);

function Scene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cableDotCanvasRef = useRef<HTMLCanvasElement>(null);
  const [modules, setModules] = useState<Module[]>(initModules);
  const [cables, setCables] = useState<Cable[]>(initCables);
  const [ghost, setGhost] = useState<{ type: ModuleType; x: number; y: number } | null>(null);
  const [camera, setCamera] = useState(initCamera);
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef<{ startX: number; startY: number; cameraX: number; cameraY: number } | null>(null);
  const [matrixToggle, setMatrixToggle] = useState<boolean>(false);
  const [matrixView, setMatrixView] = useState<'modules' | 'cables'>('cables');
  const { menu, handleContextMenu } = useContextMenu();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [audioStatus, setAudioStatus] = useState<boolean>(true);
  const [tempo, setTempo] = useState<number>(120);

  useEffect(() => {
    const syncAudioContext = async () => {
      try {
        if (!audioStatus && audioContext.audioContext.state === "running")
          await audioContext.audioContext.suspend();

        if (audioStatus && audioContext.audioContext.state === "suspended")
          await audioContext.audioContext.resume();
      } catch (error) {
        console.error("Failed to change audio context state", error);
      }
    };

    void syncAudioContext();
  }, [audioStatus])

  useEffect(() => {
    const handleAction = (e: any) => {
      const { type, id, name } = e.detail;
      switch (type) {
        case 'DELETE':
          setCables((prev) => prev.filter((c) => !c.from.startsWith(id) && !c.to.startsWith(id)));
          setModules((prev) => prev.filter((m) => m.id !== id));
          break;
        case 'RENAME':
          setModules((prev) => prev.map((m) => (m.id === id ? { ...m, title: name } : m)));
          break;
        case 'DISCONNECT':
          setCables((prev) => prev.filter((c) => !c.from.startsWith(id) && !c.to.startsWith(id)));
          break;
        case 'RESET':
          // Implementation for reset logic
          break;
      }
    };
    window.addEventListener('MOD_ACTION', handleAction);
    return () => window.removeEventListener('MOD_ACTION', handleAction);
  }, [setModules, setCables]);

  useEffect(() => {
    const update = {
      "camera": camera,
      "modules": modules,
      "cables": cables
    }
    // api call here to POST this object to the server

    let rafId = 0;

    const frame = () => {
      drawFrame({
        canvas: canvasRef.current,
        dotCanvas: cableDotCanvasRef.current,
        modules,
        cables,
        camera,
      });
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [cables, modules, camera]);

  const canPlaceGhost = ghost
    ? !wouldGhostOverlap(modules, moduleObjects, ghost.type, ghost.x, ghost.y)
    : false;

  const items = useMemo(
    () => createDockItems((type, e) => {
      const spawnX = e.clientX - camera.x;
      const spawnY = e.clientY - camera.y;
      setGhost({ type, x: snapToGrid(spawnX), y: snapToGrid(spawnY) });
    }),
    [camera.x, camera.y]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!panRef.current) return;
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setCamera({
        x: panRef.current.cameraX + dx,
        y: panRef.current.cameraY + dy,
      });
    };

    const handleMouseUp = () => {
      panRef.current = null;
      setIsPanning(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleSceneMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    if (e.button === 0 && ghost) {
      e.preventDefault();
      if (!canPlaceGhost) return;
      const module = instantiateModule(ghost.type, ghost.x, ghost.y);
      audioContext.addModule(module);
      setModules((prev) => [...prev, module]);
      setGhost(null);
      return;
    }
    if (e.button !== 2) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-patch-module='true']")) return;
    e.preventDefault();
    setIsPanning(true);
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      cameraX: camera.x,
      cameraY: camera.y,
    };
  };

  const handleSceneMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!ghost) return;
    const worldX = e.clientX - camera.x;
    const worldY = e.clientY - camera.y;
    setGhost((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        x: snapToGrid(worldX),
        y: snapToGrid(worldY),
      };
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGhost(null);
    };

    console.log(modules);
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

	return (
		<main
      className={`font-lexend relative h-screen w-screen overflow-hidden bg-zinc-950 text-white ${isPanning ? "cursor-grabbing" : "cursor-auto"}`}
      onMouseDown={handleSceneMouseDown}
      onMouseMove={handleSceneMouseMove}
      onContextMenu={(e) => e.preventDefault()}
    >
      <section className="absolute inset-0 z-0">
        <canvas
          ref={canvasRef}
          id="canvas"
          width="150" height="150"
          className="h-full w-full bg-zinc-900 bg-[radial-gradient(circle,rgba(255,255,255,0.24)_2px,transparent_1.5px)] bg-size-[32px_32px]"
          style={{
            backgroundPosition: `${camera.x}px ${camera.y}px`,
          }}
        />
      </section>

      <section className="pointer-events-none absolute inset-0 z-15">
        <canvas
          ref={cableDotCanvasRef}
          className="h-full w-full"
        />
      </section>

      <section
        className="absolute inset-0 z-10 pointer-events-auto"
        style={{
          transform: `translate3d(${camera.x}px, ${camera.y}px, 0)`,
          transformOrigin: "0 0",
        }}
      >
        <RenderModules modules={modules} cameraX={camera.x} cameraY={camera.y} f={setCables} cables={cables}/>
        {ghost && (
          <div className="pointer-events-none"> {/* this one solves the ghost preventing the module instantiation */}
          <GhostModule
            type={ghost.type}
            x={ghost.x}
            y={ghost.y}
            className={canPlaceGhost ? "opacity-80" : "border-red-500/90 bg-red-500/10 opacity-90"}
          />
          </div>
        )}
      </section>
			<section className="pointer-events-none absolute inset-0 z-20">
				<header className="pointer-events-auto absolute left-3 right-3 top-3 flex items-center justify-between rounded-xl border border-zinc-700/70 bg-zinc-900/85 pl-2 pr-4 py-2 backdrop-blur">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMatrixToggle(!matrixToggle)}
              className="px-3 py-1 rounded-md cursor-pointer hover:bg-white/50 hover"
            >Matrix</button>
            {matrixToggle && (
              <div className="flex gap-2">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="matrix-view" checked={matrixView === 'modules'} onChange={() => setMatrixView('modules')} className="cursor-pointer" />
                  <span className="text-sm">Modules</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="matrix-view" checked={matrixView === 'cables'} onChange={() => setMatrixView('cables')} className="cursor-pointer" />
                  <span className="text-sm">Cables</span>
                </label>
              </div>
            )}
          </div>
          <div className="inline-flex w-fit flex-row items-center gap-2">
            <button
            className={`cursor-pointer transition-colors rounded-md border-2 ${audioStatus ? 'text-red-500 p-1' : 'text-green-500 p-1.5'}`}
            onClick={() => {setAudioStatus(!audioStatus)}}
            >
              {audioStatus
              ? <svg className="w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="1"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill-rule="evenodd" clip-rule="evenodd" d="M4 18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12z" fill="currentColor"></path></g></svg>
              : <svg className="w-4" viewBox="-0.5 0 7 7" version="1.1" xmlns="http://www.w3.org/2000/svg"  fill="currentColor"><g id="SVGRepo_bgCarrier" stroke-width="20"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-347.000000, -3766.000000)" fill="currentColor"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M296.494737,3608.57322 L292.500752,3606.14219 C291.83208,3605.73542 291,3606.25002 291,3607.06891 L291,3611.93095 C291,3612.7509 291.83208,3613.26444 292.500752,3612.85767 L296.494737,3610.42771 C297.168421,3610.01774 297.168421,3608.98319 296.494737,3608.57322" id="play-[#1003]"> </path> </g> </g> </g> </g></svg>}
            </button>
            <div className="inline-flex items-center gap-1">
              <label className="px-2 text-sm">Tempo</label>
              <input
                className="bg-zinc-300 text-black w-14 px-1 py-0.5 text-sm rounded"
                type="number"
                value={tempo}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (n < 0)
                    setTempo(0);
                  else if (n > 500)
                    setTempo(500);
                  else
                    setTempo(n);
                  audioContext.tempo = n;
                }}
              />
            </div>
          </div>
					<div className="text-xl text-zinc-300">{modules.length} modules · {cables.length} cables</div>
				</header>
			</section>

      <div className="absolute z-30 inset-y-20">
        <ul className="flex"></ul>
        <AnimatePresence>
          {matrixToggle &&
            <Matrix
            cables={cables}
            modules={modules}
            setCables={setCables}
            setModules={setModules}
            view={matrixView}
            menu={menu}
            activeModuleId={activeModuleId}
            handleContextMenu={(e, id) => { setActiveModuleId(id); handleContextMenu(e); }}
            />}
        </AnimatePresence>
      </div>
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30">
        <Dock
          items={items}
          panelHeight={80}
          baseItemSize={60}
          magnification={80}
        />
      </div>
		</main>
	);
}

export type {Cable};
export {audioContext};
export default Scene;
