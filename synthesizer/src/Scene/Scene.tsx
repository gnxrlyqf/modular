import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Dock from "../Dock";
import type {Module} from '../Modules/Modules'
import Keyboard from '../Modules/Keyboard'
import { AnimatePresence } from "motion/react";
import { wouldGhostOverlap } from "../Utils/wouldGhostOverlap";
import { snapToGrid } from "../Utils/snapToGrid";
import { createDockItems, GhostModule, instantiateModule, moduleObjects, type ModuleType } from './DockItems'
import { drawFrame } from "../Patch/Cable";
import Matrix from "./Matrix";
import { useContextMenu } from "../Utils/useContextMenu";
import type {Cable} from '../Patch/Cable'
import Context from "../Audio/Context";
import {RenderModules, parseModules} from "../Modules/Modules";
import { authFetch } from "../api";
import { useViewport } from "../Viewport/useViewport";
// import ViewportDebug from "../Viewport/ViewportDebug";

const STATUS_MIN_MS = 1000;

const audioContext = new Context([], []);

function Scene() {
  // Viewport refs — updated directly by RAF, never by React
  const sceneRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const cableDotCanvasRef = useRef<HTMLCanvasElement>(null);

  const [modules, setModules] = useState<Module[]>([]);
  const [cables, setCables] = useState<Cable[]>([]);
  const [ghost, setGhost] = useState<{ type: ModuleType; x: number; y: number } | null>(null);
  const [matrixToggle, setMatrixToggle] = useState<boolean>(false);
  const [matrixView, setMatrixView] = useState<'modules' | 'cables'>('cables');
  const { menu, handleContextMenu } = useContextMenu();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [audioStatus, setAudioStatus] = useState<boolean>(true);
  const [tempo, setTempo] = useState<number>(120);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const projectIdRef = useRef<string | null>(null);
  const hasFetched = useRef(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTransitionAt = useRef<number>(0);
  const queuedTransitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');

  const setStatusQueued = useCallback((
    status: 'idle' | 'pending' | 'saving' | 'saved' | 'error',
    onSet?: () => void,
  ) => {
    if (queuedTransitionRef.current) clearTimeout(queuedTransitionRef.current);
    const delay = Math.max(0, nextTransitionAt.current - Date.now());
    queuedTransitionRef.current = setTimeout(() => {
      setSaveStatus(status);
      nextTransitionAt.current = Date.now() + STATUS_MIN_MS;
      onSet?.();
    }, delay);
  }, []);

  // const [debugMode, setDebugMode] = useState(false);

  // Viewport controller: smooth pan/zoom via RAF, direct DOM transforms
  const viewport = useViewport({ containerRef, bgRef: bgCanvasRef });
  const {
    camera,
    live: cameraLive,
    // target: cameraTarget,
    isPanning,
    isSpaceHeld,
    displayScale,
    loadCamera,
    screenToWorld,
    fitToContent,
    tryStartPan,
    handleDoubleClick,
    onWheel,
  } = viewport;

  // Attach wheel event non-passively (required to call preventDefault inside)
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  // Load project scene data on mount
  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get('project');
      const forkConfig = params.get('fork_config');

      projectIdRef.current = pid; // stays null for fork — autosave won't trigger

      if (!pid && forkConfig) {
        try {
          const bytes = Uint8Array.from(atob(forkConfig), c => c.charCodeAt(0));
          const scene = JSON.parse(new TextDecoder().decode(bytes));
          const parsedModules = parseModules(scene.modules ?? []);
          const parsedCables = (scene.cables ?? []) as Cable[];
          const parsedCamera = scene.camera ?? { x: 0, y: 0, scale: 1 };
          audioContext.initContext(parsedModules, parsedCables);
          setModules(parsedModules);
          setCables(parsedCables);
          loadCamera(parsedCamera);
        } catch {
          // malformed fork_config — start empty
        }
        setLoading(false);
        return;
      }

      if (!pid) {
        setLoading(false);
        return;
      }

      try {
        const resp = await authFetch(`/api/projects/${pid}/`);
        if (!resp.ok) {
          setLoadError(resp.status === 404 ? 'Project not found.' : `Failed to load project (${resp.status}).`);
          setLoading(false);
          return;
        }
        const data = await resp.json();
        const scene = data.config ?? { camera: { x: 0, y: 0, scale: 1 }, modules: [], cables: [] };
        const parsedModules = parseModules(scene.modules ?? []);
        const parsedCables = (scene.cables ?? []) as Cable[];
        const parsedCamera = scene.camera ?? { x: 0, y: 0, scale: 1 };

        audioContext.initContext(parsedModules, parsedCables);
        setModules(parsedModules);
        setCables(parsedCables);
        loadCamera(parsedCamera);
      } catch {
        setLoadError('Network error loading project.');
      } finally {
        setLoading(false);
        hasFetched.current = true;
      }
    };
    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveNow = useCallback(async () => {
    if (!hasFetched.current || !projectIdRef.current) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setStatusQueued('saving');
    try {
      await authFetch(`/api/projects/${projectIdRef.current}/`, {
        method: 'PATCH',
        body: JSON.stringify({ config: { camera, modules, cables } }),
      });
      setStatusQueued('saved', () => {
        savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      });
    } catch (e) {
      console.error(e);
      setStatusQueued('error', () => {
        savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
      });
    }
  }, [camera, modules, cables, setStatusQueued]);

  // Autosave 1.5s after any scene change
  useEffect(() => {
    if (!hasFetched.current || !projectIdRef.current) return;

    setStatusQueued('pending');
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => saveNow(), 1500);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [modules, cables, camera, saveNow, setStatusQueued]);

  // Ctrl+S → immediate save
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNow();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saveNow]);

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
  }, [audioStatus]);

  useEffect(() => { // module menu
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
          break;
      }
    };
    window.addEventListener('MOD_ACTION', handleAction);
    return () => window.removeEventListener('MOD_ACTION', handleAction);
  }, [setModules, setCables]);

  // Cable drawing RAF — reads live camera ref each frame for smooth tracking
  useEffect(() => {
    let rafId = 0;
    const frame = () => {
      drawFrame({
        canvas: bgCanvasRef.current,
        dotCanvas: cableDotCanvasRef.current,
        modules,
        cables,
        camera: cameraLive.current,
      });
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [cables, modules, cameraLive]);

  const canPlaceGhost = ghost
    ? !wouldGhostOverlap(modules, moduleObjects, ghost.type, ghost.x, ghost.y)
    : false;

  // Dock items — use screenToWorld (stable ref, always reads live camera)
  const items = useMemo(
    () => createDockItems((type, e) => {
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      setGhost({ type, x: snapToGrid(x), y: snapToGrid(y) });
    }),
    [screenToWorld]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGhost(null);
      // if (e.key === "d" || e.key === "D") {
      //   const active = document.activeElement;
      //   if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
      //   setDebugMode((prev: boolean) => !prev);
      // }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSceneMouseDown = (e: { button: number; target: EventTarget | null; preventDefault(): void; clientX: number; clientY: number }) => {
    // Space+left or middle → pan takes priority over everything
    if (viewport.spaceHeld.current && e.button === 0) {
      tryStartPan(e);
      e.preventDefault();
      return;
    }
    if (e.button === 1) {
      tryStartPan(e);
      return;
    }

    // Left click + ghost active → place module
    if (e.button === 0 && ghost) {
      e.preventDefault();
      if (!canPlaceGhost) return;
      const module = instantiateModule(ghost.type, ghost.x, ghost.y);
      audioContext.addModule(module);
      setModules((prev) => [...prev, module]);
      setGhost(null);
      return;
    }

    // Right click on empty space → pan
    if (e.button === 2) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-patch-module='true']")) return;
      e.preventDefault();
      tryStartPan(e);
    }
  };

  const handleSceneMouseMove = (e: { clientX: number; clientY: number }) => {
    if (!ghost) return;
    const { x: worldX, y: worldY } = screenToWorld(e.clientX, e.clientY);
    setGhost((prev) => {
      if (!prev) return prev;
      return { ...prev, x: snapToGrid(worldX), y: snapToGrid(worldY) };
    });
  };

  const cursorClass = isPanning
    ? "cursor-grabbing"
    : isSpaceHeld
    ? "cursor-grab"
    : ghost
    ? "cursor-crosshair"
    : "cursor-auto";

  return (
    <main
      ref={sceneRef}
      className={`font-lexend relative h-screen w-screen overflow-hidden bg-zinc-950 text-white ${cursorClass}`}
      onMouseDown={handleSceneMouseDown}
      onMouseMove={handleSceneMouseMove}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e: { preventDefault(): void }) => e.preventDefault()}
    >
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950">
          <p className="text-zinc-400 text-sm">Loading project…</p>
        </div>
      )}
      {loadError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950">
          <p className="text-red-400 text-sm">{loadError}</p>
        </div>
      )}
      
      {/* Background grid canvas — backgroundSize/Position/opacity set by viewport RAF */}
      <section className="absolute inset-0 z-0">
        <canvas
          ref={bgCanvasRef}
          id="canvas"
          width="150"
          height="150"
          className="h-full w-full bg-zinc-900 bg-[radial-gradient(circle,rgba(255,255,255,0.24)_2px,transparent_1.5px)]"
        />
      </section>

      {/* Cable endpoint dots */}
      <section className="pointer-events-none absolute inset-0 z-15">
        <canvas ref={cableDotCanvasRef} className="h-full w-full" />
      </section>

      {/* Modules container — transform applied directly by viewport RAF, no React re-renders */}
      <section
        ref={containerRef}
        className="absolute inset-0 z-10 pointer-events-auto"
        style={{ transformOrigin: "0 0" }}
      >
        <RenderModules
          modules={modules}
          cameraLive={cameraLive}
          f={setCables}
          cables={cables}
        />
        <Keyboard
          id="keyboard"
          x={600}
          y={400}
        />
        {ghost && (
          <div className="pointer-events-none">
            <GhostModule
              type={ghost.type}
              x={ghost.x}
              y={ghost.y}
              className={canPlaceGhost ? "opacity-80" : "border-red-500/90 bg-red-500/10 opacity-90"}
            />
          </div>
        )}
      </section>

      {/* HUD — header + zoom controls */}
      <section className="pointer-events-none absolute inset-0 z-20">
        <header data-hud-header="true" className="pointer-events-auto absolute left-3 right-3 top-3 flex items-center justify-between rounded-xl border border-zinc-700/70 bg-zinc-900/85 pl-2 pr-4 py-2 backdrop-blur">
          {/* Left: Matrix toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMatrixToggle(!matrixToggle)}
              className="px-3 py-1 rounded-md cursor-pointer hover:bg-white/50"
            >
              Matrix
            </button>
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

          {/* Center: module/cable count */}
          <div className="text-sm text-zinc-400">
            {modules.length} modules · {cables.length} cables
          </div>
          {/* Right: audio + tempo + zoom */}
          <div className="flex items-center gap-3">
            {/* Audio toggle */}
            <button
              className={`cursor-pointer transition-colors rounded-md border-2 ${audioStatus ? 'text-red-500 p-1' : 'text-green-500 p-1.5'}`}
              onClick={() => setAudioStatus(!audioStatus)}
            >
              {audioStatus
                ? <svg className="w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M4 18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12z" fill="currentColor"></path></svg>
                : <svg className="w-4" viewBox="-0.5 0 7 7" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g><path d="M296.494737,3608.57322 L292.500752,3606.14219 C291.83208,3605.73542 291,3606.25002 291,3607.06891 L291,3611.93095 C291,3612.7509 291.83208,3613.26444 292.500752,3612.85767 L296.494737,3610.42771 C297.168421,3610.01774 297.168421,3608.98319 296.494737,3608.57322" transform="translate(-291, -3606)"></path></g></svg>
              }
            </button>

            {/* Tempo */}
            <div className="inline-flex items-center gap-1">
              <label className="px-2 text-sm">Tempo</label>
              <input
                className="bg-zinc-300 text-black w-14 px-1 py-0.5 text-sm rounded"
                type="number"
                value={tempo}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (n < 0) setTempo(0);
                  else if (n > 500) setTempo(500);
                  else setTempo(n);
                  audioContext.tempo = n;
                }}
              />
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1 border-l border-zinc-600 pl-3">
              <span className="w-14 text-center text-xs text-zinc-400 tabular-nums select-none">
                {displayScale}%
              </span>
              <button
                onClick={() => fitToContent(modules, moduleObjects)}
                className="ml-1 px-2 py-0.5 text-xs rounded hover:bg-white/20 text-zinc-400 hover:text-white cursor-pointer"
                title="Fit to content"
              >
                ⊞
              </button>
            </div>

            {/* Save button */}
            {projectIdRef.current && (
              <button
                onClick={saveNow}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-zinc-600 text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Save (Ctrl+S)"
              >
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save
              </button>
            )}

            {/* Save status indicator */}
            <div className="w-20 flex items-center justify-end">
              <span
                className={`flex items-center gap-1.5 text-xs select-none transition-opacity duration-200 ${
                  saveStatus === 'idle' ? 'opacity-0 pointer-events-none' : 'opacity-100'
                } ${
                  saveStatus === 'pending' ? 'text-zinc-500' :
                  saveStatus === 'saving'  ? 'text-zinc-400' :
                  saveStatus === 'saved'   ? 'text-zinc-300' :
                  saveStatus === 'error'   ? 'text-red-400'  : ''
                }`}
              >
                {saveStatus === 'pending' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse" />
                )}
                {saveStatus === 'saving' && (
                  <>
                    <svg className="w-3 h-3 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving…
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <svg className="w-3 h-3 text-green-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Saved
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Failed
                  </>
                )}
              </span>
            </div>
          </div>
        </header>
      </section>
      {/* Matrix overlay */}
      <div data-matrix="true" className="absolute z-30 inset-y-20">
        <ul className="flex"></ul>
        <AnimatePresence>
          {matrixToggle && (
            <Matrix
              cables={cables}
              modules={modules}
              setCables={setCables}
              setModules={setModules}
              view={matrixView}
              menu={menu}
              activeModuleId={activeModuleId}
              handleContextMenu={(e, id) => { setActiveModuleId(id); handleContextMenu(e); }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Dock */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30">
        <Dock
          items={items}
          panelHeight={80}
          baseItemSize={60}
          magnification={80}
        />
      </div>

      {/* Viewport debug overlay — toggle with D */}
      {/* {debugMode && (
        <ViewportDebug
          live={cameraLive}
          target={cameraTarget}
          camera={camera}
          displayScale={displayScale}
          containerRef={containerRef}
        />
      )} */}
    </main>
  );
}

export type {Cable};
export {audioContext};
export default Scene;
