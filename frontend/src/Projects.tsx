import { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import { AnimatedContent } from './ReactBits/ReactBits';
import { authFetch, extractErrorMessage } from './api';
import { Input, CloseButton } from './Reusables';
import logger from './logger';
import { t, useLanguage } from './i18n';

const SYNTH_URL = (import.meta.env.VITE_SYNTHESIZER_URL as string | undefined) ?? 'http://localhost:5174';

const arrow = "M5.70711 9.71069C5.31658 10.1012 5.31658 10.7344 5.70711 11.1249L10.5993 16.0123C11.3805 16.7927 12.6463 16.7924 13.4271 16.0117L18.3174 11.1213C18.708 10.7308 18.708 10.0976 18.3174 9.70708C17.9269 9.31655 17.2937 9.31655 16.9032 9.70708L12.7176 13.8927C12.3271 14.2833 11.6939 14.2832 11.3034 13.8927L7.12132 9.71069C6.7308 9.32016 6.09763 9.32016 5.70711 9.71069Z"

type ApiProject = {
  id: string;
  name: string;
  user: number;
  username?: string;
  config: Record<string, unknown> | null;
  analytics: {
    sharing?: { share_count: number; shared_days: string[] };
  } | null;
  created_at: string;
  updated_at: string;
  net_votes: number;
  upvotes: number;
  downvotes: number;
  user_vote: 0 | 1 | -1;
};

type PaginatedResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiProject[];
};

const FALLBACK_IMAGE = "https://via.placeholder.com/1920x1080?text=Project";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Project JSON validation ──────────────────────────────────────────────────

const VALID_MODULE_TYPES = new Set([
  'oscillator', 'gain', 'envelope', 'output', 'lfo',
  'filter', 'distortion', 'modulator', 'keyboard', 'sequencer',
]);

function validateProjectJson(raw: unknown): string | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return 'File must be a JSON object.';
  }
  const obj = raw as Record<string, unknown>;

  if (!('camera' in obj)) return 'Missing field: camera';
  const cam = obj.camera as Record<string, unknown>;
  if (typeof cam !== 'object' || cam === null) return 'camera must be an object';
  if (typeof cam.x !== 'number') return 'camera.x must be a number';
  if (typeof cam.y !== 'number') return 'camera.y must be a number';

  if (!('modules' in obj)) return 'Missing field: modules';
  if (!Array.isArray(obj.modules)) return 'modules must be an array';

  if (!('cables' in obj)) return 'Missing field: cables';
  if (!Array.isArray(obj.cables)) return 'cables must be an array';

  for (let i = 0; i < (obj.modules as unknown[]).length; i++) {
    const m = (obj.modules as unknown[])[i] as Record<string, unknown>;
    if (typeof m !== 'object' || m === null) return `modules[${i}] must be an object`;
    if (typeof m.id !== 'string') return `modules[${i}].id must be a string`;
    if (typeof m.type !== 'string' || !VALID_MODULE_TYPES.has(m.type)) {
      return `modules[${i}].type "${m.type}" is not a valid module type`;
    }
    if (typeof m.x !== 'number') return `modules[${i}].x must be a number`;
    if (typeof m.y !== 'number') return `modules[${i}].y must be a number`;
    if (typeof m.params !== 'object' || m.params === null) return `modules[${i}].params must be an object`;
  }

  return null;
}

// ─── Create Modal ────────────────────────────────────────────────────────────

function CreateModal(props: { onClose: () => void; onCreate: (name: string, config?: Record<string, unknown>) => Promise<void> }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedConfig, setImportedConfig] = useState<Record<string, unknown> | null>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const err = validateProjectJson(parsed);
        if (err) {
          setError(`Invalid project file: ${err}`);
          setImportedConfig(null);
          setImportFileName(null);
        } else {
          setError(null);
          setImportedConfig(parsed as Record<string, unknown>);
          setImportFileName(file.name);
          if (!name.trim()) {
            setName(file.name.replace(/\.json$/i, ''));
          }
        }
      } catch {
        setError('Invalid project file: could not parse JSON');
        setImportedConfig(null);
        setImportFileName(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await props.onCreate(name.trim(), importedConfig ?? undefined);
      props.onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-sm font-lexend">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">{t('projects.new_modal_title')}</h3>
          <CloseButton onClick={props.onClose} />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            autoFocus
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('projects.name_placeholder')}
            className="w-full"
          />
          <div>
            <p className="text-xs text-indigo-300/50 mb-1.5 tracking-wide">{t('projects.import_json_hint')}</p>
            {importFileName ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-300/80 truncate flex-1">{t('projects.import_json_selected')}: {importFileName}</span>
                <button
                  type="button"
                  onClick={() => { setImportedConfig(null); setImportFileName(null); }}
                  className="text-xs text-red-300/70 hover:text-red-200 cursor-pointer shrink-0"
                >
                  {t('projects.import_json_clear')}
                </button>
              </div>
            ) : (
              <label className="glass glass-hover rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-300/80 hover:text-white cursor-pointer inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {t('projects.import_json')}
                <input type="file" accept=".json,application/json" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>
          {error && <p className="text-red-300/80 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
              {submitting ? t('projects.creating') : t('projects.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Rename Modal ─────────────────────────────────────────────────────────────

function RenameModal(props: {
  currentName: string;
  onClose: () => void;
  onRename: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(props.currentName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === props.currentName) { props.onClose(); return; }
    setSubmitting(true);
    setError(null);
    try {
      await props.onRename(name.trim());
      props.onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-sm font-lexend">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">{t('projects.rename_modal_title')}</h3>
          <CloseButton onClick={props.onClose} />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            autoFocus
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full"
          />
          {error && <p className="text-red-300/80 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
              {submitting ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────

function SettingsModal(props: {
  card: ApiProject;
  onClose: () => void;
  onSave: (id: string, patch: { name?: string; config?: Record<string, unknown> }) => Promise<void>;
}) {
  const [name, setName] = useState(props.card.name);
  const [thumbnail, setThumbnail] = useState<string | null>((props.card.config?.thumbnail as string | undefined) ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      setError('Image must be JPEG/PNG/WebP/GIF.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be ≤ 2 MB.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setThumbnail(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const patch: { name?: string; config?: Record<string, unknown> } = {};
    const trimmed = name.trim();
    if (trimmed && trimmed !== props.card.name) patch.name = trimmed;
    const currentThumb = (props.card.config?.thumbnail as string | undefined) ?? null;
    if (thumbnail !== currentThumb) {
      patch.config = { ...(props.card.config ?? {}), thumbnail };
    }
    if (!patch.name && !patch.config) { props.onClose(); return; }
    setSubmitting(true);
    setError(null);
    try {
      await props.onSave(props.card.id, patch);
      props.onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  };

  const preview = thumbnail ?? FALLBACK_IMAGE;

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-sm font-lexend">
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">{t('projects.settings_title')}</h3>
          <CloseButton onClick={props.onClose} />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-indigo-300/60 mb-1.5 tracking-wide">{t('projects.picture')}</label>
            <div className="flex items-center gap-3">
              <img src={preview} alt="" className="h-14 w-20 object-cover rounded-lg shrink-0" />
              <label className="glass glass-hover rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-300/80 hover:text-white cursor-pointer">
                {t('projects.choose_image')}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFile} className="hidden" />
              </label>
              {thumbnail && (
                <button type="button" onClick={() => setThumbnail(null)} className="text-xs text-red-300/70 hover:text-red-200 cursor-pointer">
                  {t('projects.remove')}
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs text-indigo-300/60 mb-1.5 tracking-wide">{t('projects.sort_name')}</label>
            <Input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full" />
          </div>
          {error && <p className="text-red-300/80 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
              {submitting ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function NewButton(props: { onClick?: () => void }) {
  return (
    <button type="button" onClick={props.onClick} className="btn-new" aria-label="New project">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 12H18M12 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

function ViewToggle(props: { mode: 'grid' | 'list'; onChange: (mode: 'grid' | 'list') => void }) {
  return (
    <div className="flex items-center glass rounded-lg overflow-hidden">
      <button
        type="button"
        aria-label="Grid view"
        onClick={() => props.onChange('grid')}
        className={`px-2 py-1.5 transition-colors cursor-pointer ${props.mode === 'grid' ? 'text-indigo-300' : 'text-indigo-300/30 hover:text-indigo-300/70'}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      </button>
      <button
        type="button"
        aria-label="List view"
        onClick={() => props.onChange('list')}
        className={`px-2 py-1.5 transition-colors cursor-pointer ${props.mode === 'list' ? 'text-indigo-300' : 'text-indigo-300/30 hover:text-indigo-300/70'}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

function FilterButton(props: {text?: string; onClick?: () => void; isActive?: boolean}) {
  const [rot, setRot] = useState(0);
  const rotation = ["rotate-0", "rotate-180"]

  const f = () => {
    setRot((prev) => (prev ? 0 : 1));
    props.onClick?.();
  }

  return (
    <button type="button" className={`btn-filter transition-colors ${props.isActive ? 'text-indigo-300' : 'text-indigo-300/40 hover:text-indigo-300/70'}`} onClick={f}>
      <span>{props.text}</span>
      <svg className={`${rotation[rot]} transition-transform duration-200`}
      width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} fill="currentColor"
      >
        <path d={arrow} />
      </svg>
    </button>
  )
}

function Filters(props: {onDateSort?: () => void; onNameSort?: () => void; ordering?: string}) {
  const isDateActive = props.ordering?.includes('created_at');
  const isNameActive = props.ordering?.includes('name');

  return (
    <div className="font-lexend flex flex-row gap-2 mx-3">
      <FilterButton text={t('projects.sort_date')} onClick={props.onDateSort} isActive={isDateActive} />
      <FilterButton text={t('projects.sort_name')} onClick={props.onNameSort} isActive={isNameActive} />
    </div>
  )
}

function Search(props: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative sm:ml-auto mr-3 flex-1 sm:flex-none sm:max-w-xs">
      <Input
        placeholder={t('projects.search')}
        name="search"
        type="search"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="w-full sm:w-32 sm:focus:w-48 sm:hover:w-48 transition-[width] pr-8"
      />
      <svg
        className="size-4 absolute top-1/2 -translate-y-1/2 right-2.5 text-indigo-300/30 pointer-events-none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    </div>
  )
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

function MenuEntry(props: {children?: React.ReactNode; func?: () => void; danger?: boolean}) {
  return (
    <li>
      <button
        className={`px-3 py-1.5 w-full text-left text-sm cursor-pointer duration-150 rounded-md ${props.danger ? 'text-red-300/80 hover:text-red-200 hover:bg-red-500/10' : 'text-indigo-300/80 hover:text-white hover:bg-white/6'}`}
        onClick={props.func}
      >
        {props.children}
      </button>
    </li>
  )
}

function ContextMenu(props: {
  onDelete?: () => void;
  onRename?: () => void;
  onCopyLink?: () => void;
  onShare?: () => void;
}) {
  return (
    <ul className="overlay-panel rounded-xl py-1.5 px-1 font-lexend min-w-36 space-y-0.5">
      <MenuEntry func={props.onRename}>{t('projects.context.rename')}</MenuEntry>
      <MenuEntry func={props.onShare}>{t('projects.context.share')}</MenuEntry>
      <MenuEntry func={props.onCopyLink}>{t('projects.context.copy_id')}</MenuEntry>
      <MenuEntry func={props.onDelete} danger>{t('projects.context.delete')}</MenuEntry>
    </ul>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card(props: {
  card: ApiProject;
  index: number;
  onDelete?: (id: string) => Promise<void>;
  onRename?: (id: string, currentName: string) => void;
  onVote?: (id: string, vote: 0 | 1 | -1) => void;
  onFork?: (id: string, config: Record<string, unknown> | null) => void; // sync — no backend project created
  onShare?: (id: string) => void;
  onSettings?: (card: ApiProject) => void;
  onUserClick?: (username: string) => void;
  showVotes?: boolean;
  isOwn?: boolean;
  listView?: boolean;
}) {
  const showAuthor = (props.showVotes || !props.isOwn) && !!props.card.username;
  const GearIcon = (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
  const cardRef = useRef<HTMLAnchorElement>(null);
  const cardTitle = props.card.name || `Untitled project ${props.index + 1}`;
  const cardTime = formatDate(props.card.created_at);
  const cardImage = (props.card.config?.thumbnail as string | undefined) ?? FALLBACK_IMAGE;

  useEffect(() => {
    const handleRightClick = (event: MouseEvent) => {
      event.preventDefault();

      const existingMenu = document.querySelector('[data-custom-menu]');
      if (existingMenu) existingMenu.remove();

      const menu = document.createElement('div');
      menu.setAttribute('data-custom-menu', 'true');
      menu.className = "fixed z-50"
      menu.style.left = event.pageX + 'px';
      menu.style.top = event.pageY + 'px';
      document.body.appendChild(menu);

      const root = createRoot(menu);

      const removeMenu = () => {
        root.unmount();
        menu.remove();
      };

      root.render(
        <ContextMenu
          onDelete={() => {
            removeMenu();
            props.onDelete?.(props.card.id);
          }}
          onRename={() => {
            removeMenu();
            props.onRename?.(props.card.id, props.card.name);
          }}
          onShare={() => {
            removeMenu();
            // Copy the synthesizer link then record the share on the backend
            const link = `${SYNTH_URL}?project=${props.card.id}`;
            navigator.clipboard.writeText(link).catch(() => {});
            props.onShare?.(props.card.id);
          }}
          onCopyLink={() => {
            removeMenu();
            navigator.clipboard.writeText(props.card.id).catch(() => {});
            logger.action('project.copy_id', { id: props.card.id });
          }}
        />
      );

      document.addEventListener('click', removeMenu, { once: true });
    }

    const cardElement = cardRef.current;
    cardElement?.addEventListener("contextmenu", handleRightClick);

    return () => {
      cardElement?.removeEventListener('contextmenu', handleRightClick);
    };
  }, [props.card.id, props.card.name, props.onDelete, props.onRename, props.onShare])

  const handleClick = (e: React.MouseEvent) => {
    if (!props.isOwn && props.onFork) {
      e.preventDefault();
      props.onFork(props.card.id, props.card.config);
    }
  };

  if (props.listView) {
    return (
      <a
        href={`${SYNTH_URL}?project=${props.card.id}`}
        target="_blank"
        rel="noreferrer"
        ref={cardRef}
        onClick={handleClick}
        className="flex items-center gap-3 glass card-lift w-full rounded-xl font-lexend cursor-pointer px-3 py-2.5 border border-white/6"
      >
        <img className="rounded-lg h-10 w-16 object-cover shrink-0" src={cardImage} alt={cardTitle} />
        <div className="min-w-0 flex-1">
          <span className="truncate text-sm text-indigo-100 font-medium block">{cardTitle}</span>
          {showAuthor && (
            <button
              type="button"
              className="text-xs text-indigo-400/60 hover:text-indigo-300 transition-colors cursor-pointer"
              onClick={e => { e.preventDefault(); e.stopPropagation(); props.onUserClick?.(props.card.username!); }}
            >
              by @{props.card.username}
            </button>
          )}
        </div>
        {props.isOwn && props.onSettings && (
          <button
            type="button"
            aria-label="Project settings"
            className="shrink-0 text-indigo-300/40 hover:text-indigo-200 p-1 cursor-pointer"
            onClick={e => { e.preventDefault(); e.stopPropagation(); props.onSettings?.(props.card); }}
          >
            {GearIcon}
          </button>
        )}
        {props.showVotes ? (
          <div className="flex items-center gap-1 shrink-0" onClick={e => e.preventDefault()}>
            <button
              type="button"
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs transition-colors cursor-pointer ${props.card.user_vote === 1 ? 'text-indigo-300' : 'text-indigo-300/40 hover:text-indigo-300'}`}
              onClick={e => { e.preventDefault(); e.stopPropagation(); props.onVote?.(props.card.id, props.card.user_vote === 1 ? 0 : 1); }}
            >▲ {props.card.upvotes}</button>
            <button
              type="button"
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs transition-colors cursor-pointer ${props.card.user_vote === -1 ? 'text-red-300' : 'text-indigo-300/40 hover:text-red-300'}`}
              onClick={e => { e.preventDefault(); e.stopPropagation(); props.onVote?.(props.card.id, props.card.user_vote === -1 ? 0 : -1); }}
            >▼ {props.card.downvotes}</button>
          </div>
        ) : (
          <span className="shrink-0 text-xs text-indigo-300/40">{cardTime}</span>
        )}
      </a>
    );
  }

  return (
    <a
      href={`${SYNTH_URL}?project=${props.card.id}`}
      target="_blank"
      rel="noreferrer"
      ref={cardRef}
      onClick={handleClick}
      className="block glass card-lift w-full rounded-2xl font-lexend cursor-pointer overflow-hidden"
    >
      <img className="rounded-t-2xl h-36 w-full object-cover" src={cardImage} alt={cardTitle} />
      <div className="flex flex-col border-t border-white/6">
        <div className="flex flex-row items-center py-2.5 px-3">
          <span className="truncate text-sm text-indigo-100 font-medium">{cardTitle}</span>
          {props.showVotes ? (
            <div className="ml-auto flex items-center gap-1 pl-3" onClick={e => e.preventDefault()}>
              <button
                type="button"
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs transition-colors cursor-pointer ${props.card.user_vote === 1 ? 'text-indigo-300' : 'text-indigo-300/40 hover:text-indigo-300'}`}
                onClick={e => { e.preventDefault(); e.stopPropagation(); props.onVote?.(props.card.id, props.card.user_vote === 1 ? 0 : 1); }}
              >
                ▲ {props.card.upvotes}
              </button>
              <button
                type="button"
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs transition-colors cursor-pointer ${props.card.user_vote === -1 ? 'text-red-300' : 'text-indigo-300/40 hover:text-red-300'}`}
                onClick={e => { e.preventDefault(); e.stopPropagation(); props.onVote?.(props.card.id, props.card.user_vote === -1 ? 0 : -1); }}
              >
                ▼ {props.card.downvotes}
              </button>
            </div>
          ) : (
            <span className="ml-auto pl-3 whitespace-nowrap text-xs text-indigo-300/40">{cardTime}</span>
          )}
        </div>
        {(showAuthor || (props.isOwn && props.onSettings)) && (
          <div className="px-3 pb-2 -mt-1 flex items-center justify-between gap-2">
            {showAuthor ? (
              <button
                type="button"
                className="text-xs text-indigo-400/60 hover:text-indigo-300 transition-colors cursor-pointer"
                onClick={e => { e.preventDefault(); e.stopPropagation(); props.onUserClick?.(props.card.username!); }}
              >
                by @{props.card.username}
              </button>
            ) : <span />}
            {props.isOwn && props.onSettings && (
              <button
                type="button"
                aria-label="Project settings"
                className="text-indigo-300/40 hover:text-indigo-200 p-1 cursor-pointer ml-auto"
                onClick={e => { e.preventDefault(); e.stopPropagation(); props.onSettings?.(props.card); }}
              >
                {GearIcon}
              </button>
            )}
          </div>
        )}
      </div>
    </a>
  )
}

// ─── Projects ─────────────────────────────────────────────────────────────────

function Projects(props: {user?: string; currentUsername?: string; onUserClick?: (username: string) => void; initialOrdering?: string}) {
  useLanguage();
  const [cards, setCards] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ordering, setOrdering] = useState(props.initialOrdering ?? '-created_at');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [renameModal, setRenameModal] = useState<{ id: string; currentName: string } | null>(null);
  const [settingsModal, setSettingsModal] = useState<ApiProject | null>(null);
  const [refetchTick, setRefetchTick] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PAGE_SIZE = 9;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Debounce search input
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      if (value.trim()) logger.action('project.search', { query: value.trim() });
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  const handleDateSort = () => {
    const next = ordering === '-created_at' ? 'created_at' : '-created_at';
    logger.action('project.sort_date', { ordering: next });
    setOrdering(next);
    setPage(1);
  };

  const handleNameSort = () => {
    const next = ordering === 'name' ? '-name' : 'name';
    logger.action('project.sort_name', { ordering: next });
    setOrdering(next);
    setPage(1);
  };

  const isCommunity = !props.user;

  // Fetch projects from real API
  useEffect(() => {
    let cancelled = false;
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (ordering) params.set('ordering', ordering);
        params.set('page', String(page));

        const endpoint = isCommunity ? '/api/community/' : '/api/search/';
        const response = await authFetch(`${endpoint}?${params.toString()}`);

        if (!response.ok) {
          const msg = await extractErrorMessage(response, 'Failed to load projects.');
          throw new Error(msg);
        }

        const data: PaginatedResponse = await response.json();
        if (cancelled) return;
        setCards(data.results);
        setTotalCount(data.count);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load projects.';
        logger.error('project.fetch_error', { search: debouncedSearch, page, msg });
        setCards([]);
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProjects();
    return () => { cancelled = true; };
  }, [debouncedSearch, ordering, page, isCommunity, refetchTick]);

  const retry = () => {
    setError(null);
    setRefetchTick((t) => t + 1);
  };

  const handleCreate = async (name: string, config?: Record<string, unknown>) => {
    const response = await authFetch('/api/projects/', {
      method: 'POST',
      body: JSON.stringify({
        name,
        config: config ?? { camera: { x: 0, y: 0 }, modules: [], cables: [] },
      }),
    });

    if (!response.ok) {
      const msg = await extractErrorMessage(response, 'Failed to create project.');
      logger.error('project.create_failed', { name, status: response.status });
      throw new Error(msg);
    }

    const created: ApiProject = await response.json();
    logger.action('project.create', { name });
    setPage(1);
    setOrdering('-created_at');
    setDebouncedSearch('');
    setSearchQuery('');
    setRefetchTick((t) => t + 1);
    window.open(`${SYNTH_URL}?project=${created.id}`, '_blank', 'noreferrer');
  };

  const handleFork = (id: string, config: Record<string, unknown> | null) => {
    const scene = config ?? { camera: { x: 0, y: 0 }, modules: [], cables: [] };
    const bytes = new TextEncoder().encode(JSON.stringify(scene));
    const encoded = btoa(String.fromCharCode(...bytes));
    logger.action('project.fork', { source_id: id });
    window.open(`${SYNTH_URL}?fork_config=${encoded}`, '_blank', 'noreferrer');
  };

  const handleVote = async (id: string, vote: 0 | 1 | -1) => {
    const response = await authFetch(`/api/projects/${id}/vote/`, {
      method: 'POST',
      body: JSON.stringify({ vote }),
    });
    if (!response.ok) return;
    const updated: ApiProject = await response.json();
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleShare = async (id: string) => {
    // Increment share_count and add today to shared_days on the backend
    const response = await authFetch(`/api/projects/${id}/share/`, { method: 'POST' });
    if (!response.ok) return;
    const updated: ApiProject = await response.json();
    logger.action('project.share', { id, share_count: updated.analytics?.sharing?.share_count });
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleDelete = async (id: string) => {
    const response = await authFetch(`/api/projects/${id}/`, { method: 'DELETE' });
    if (!response.ok && response.status !== 204) {
      logger.error('project.delete_failed', { id, status: response.status });
      return;
    }
    logger.action('project.delete', { id });
    setCards(prev => prev.filter(c => c.id !== id));
    setTotalCount(prev => prev - 1);
  };

  const handleSettingsSave = async (id: string, patch: { name?: string; config?: Record<string, unknown> }) => {
    const response = await authFetch(`/api/projects/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    if (!response.ok) {
      const msg = await extractErrorMessage(response, 'Failed to save project.');
      logger.error('project.settings_failed', { id, status: response.status });
      throw new Error(msg);
    }
    logger.action('project.settings_save', { id, fields: Object.keys(patch) });
    const updated: ApiProject = await response.json();
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleRename = async (name: string) => {
    if (!renameModal) return;
    const response = await authFetch(`/api/projects/${renameModal.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const msg = await extractErrorMessage(response, 'Failed to rename project.');
      logger.error('project.rename_failed', { id: renameModal.id, name, status: response.status });
      throw new Error(msg);
    }

    logger.action('project.rename', { id: renameModal.id, name });
    const updated: ApiProject = await response.json();
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  return (
    <>
      {!props.user && (
        <p className="font-lexend text-center text-2xl font-semibold pb-4 pt-1 bg-gradient-to-r from-indigo-200 via-blue-200 to-indigo-400 bg-clip-text text-transparent tracking-wide">
          {t('projects.community_title')}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-2 my-2 sm:items-center">
        <Filters onDateSort={handleDateSort} onNameSort={handleNameSort} ordering={ordering} />
        <Search value={searchQuery} onChange={handleSearchChange} />
        <div className="mr-3 sm:ml-0 ml-3 flex items-center gap-2">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <NewButton onClick={() => setCreateModalOpen(true)} />
        </div>
      </div>
      <div className="mx-3 mb-3">
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" : "flex flex-col gap-1.5"}>
          {loading && <p className={`${viewMode === 'grid' ? 'col-span-full' : ''} text-indigo-300/40 py-8 text-center text-sm font-light`}>{t('projects.loading')}</p>}
          {!loading && error && (
            <div className={`${viewMode === 'grid' ? 'col-span-full' : ''} py-8 text-center space-y-3`}>
              <p className="text-red-300/80 text-sm">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="glass glass-hover rounded-lg px-4 py-1.5 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide cursor-pointer"
              >
                {t('projects.retry')}
              </button>
            </div>
          )}
          {!loading && !error && cards.length === 0 && (
            <p className={`${viewMode === 'grid' ? 'col-span-full' : ''} text-indigo-300/40 py-8 text-center text-sm font-light`}>
              {isCommunity ? t('projects.empty_community') : t('projects.empty')}
            </p>
          )}
          {!loading && !error && cards.map((card, index) => {
            const isOwn = props.user !== undefined || (props.currentUsername !== undefined && card.username === props.currentUsername);
            return (
              <Card
                key={card.id}
                card={card}
                index={index}
                onDelete={isOwn ? handleDelete : undefined}
                onRename={isOwn ? (id, currentName) => setRenameModal({ id, currentName }) : undefined}
                onVote={handleVote}
                onFork={!isOwn ? handleFork : undefined}
                onShare={isOwn ? handleShare : undefined}
                onSettings={isOwn ? setSettingsModal : undefined}
                onUserClick={props.onUserClick}
                showVotes={isCommunity}
                isOwn={isOwn}
                listView={viewMode === 'list'}
              />
            );
          })}
        </div>
        <div className="flex flex-row items-center justify-between py-3 font-lexend text-xs text-indigo-300/40">
          <p>{totalCount} {totalCount === 1 ? t('projects.count_one') : t('projects.count_other')}</p>
          {totalPages > 1 && (
            <div className="flex flex-row gap-2 items-center">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="btn-page"
              >
                ←
              </button>
              <span className="tabular-nums">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="btn-page"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>

      {createModalOpen && (
        <CreateModal
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreate}
        />
      )}

      {renameModal && (
        <RenameModal
          currentName={renameModal.currentName}
          onClose={() => setRenameModal(null)}
          onRename={handleRename}
        />
      )}

      {settingsModal && (
        <SettingsModal
          card={settingsModal}
          onClose={() => setSettingsModal(null)}
          onSave={handleSettingsSave}
        />
      )}
    </>
  )
}

// ─── Container ────────────────────────────────────────────────────────────────

function ProjectsContainer(props: {func?: (value: boolean) => void; currentUsername?: string; onUserClick?: (username: string) => void; initialOrdering?: string}) {
  const [visible, setVisible] = useState(true);

  return (
    <AnimatedContent
      className="items-center mx-auto z-10"
      distance={0}
      direction="vertical"
      reverse={false}
      duration={1}
      ease="power3.out"
      initialOpacity={1}
      animateOpacity
      scale={1}
      visible={visible}
      threshold={0.1}
      delay={0.1}
      disappearDuration={0.5}
      onDisappearanceComplete={() => props.func && props.func(false)}
    >
        <AnimatedContent
          distance={50}
          direction="vertical"
          reverse={false}
          duration={1}
          ease="power3.out"
          initialOpacity={1}
          animateOpacity
          scale={1}
          visible={true}
          threshold={0.1}
          delay={.1}
        >
          <div className="font-lexend overlay-panel rounded-2xl z-50 w-full max-w-[60rem] mx-3 sm:mx-auto">
            <div className="flex justify-end px-4 pt-4 pb-0">
              <CloseButton onClick={() => setVisible(false)} />
            </div>
            <Projects currentUsername={props.currentUsername} onUserClick={props.onUserClick} initialOrdering={props.initialOrdering} />
          </div>
        </AnimatedContent>
    </AnimatedContent>
  )
}

export { ProjectsContainer, Projects }
