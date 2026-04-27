import { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import { AnimatedContent } from './ReactBits/ReactBits';
import { authFetch, extractErrorMessage } from './api';
import { Input, CloseButton } from './Reusables';
import logger from './logger';

const arrow = "M5.70711 9.71069C5.31658 10.1012 5.31658 10.7344 5.70711 11.1249L10.5993 16.0123C11.3805 16.7927 12.6463 16.7924 13.4271 16.0117L18.3174 11.1213C18.708 10.7308 18.708 10.0976 18.3174 9.70708C17.9269 9.31655 17.2937 9.31655 16.9032 9.70708L12.7176 13.8927C12.3271 14.2833 11.6939 14.2832 11.3034 13.8927L7.12132 9.71069C6.7308 9.32016 6.09763 9.32016 5.70711 9.71069Z"

type ApiProject = {
  id: string;
  name: string;
  user: number;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
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

// ─── Create Modal ────────────────────────────────────────────────────────────

function CreateModal(props: { onClose: () => void; onCreate: (name: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await props.onCreate(name.trim());
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
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">New Project</h3>
          <CloseButton onClick={props.onClose} />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            autoFocus
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Project name"
            className="w-full"
          />
          {error && <p className="text-red-300/80 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={props.onClose} className="glass glass-hover rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
              {submitting ? 'Creating…' : 'Create'}
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
          <h3 className="text-lg font-semibold text-indigo-200 tracking-wide">Rename Project</h3>
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
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="glass glass-hover glow-indigo rounded-lg px-4 py-1.5 text-sm font-medium text-indigo-300/80 hover:text-white tracking-wide duration-200 ease-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer">
              {submitting ? 'Saving…' : 'Save'}
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

function FilterButton(props: {text?: string; onClick?: () => void}) {
  const [rot, setRot] = useState(0);
  const rotation = ["rotate-0", "rotate-180"]

  const f = () => {
    setRot((prev) => (prev ? 0 : 1));
    props.onClick?.();
  }

  return (
    <button type="button" className="btn-filter" onClick={f}>
      <span>{props.text}</span>
      <svg className={`${rotation[rot]} transition-transform duration-200`}
      width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} fill="currentColor"
      >
        <path d={arrow} />
      </svg>
    </button>
  )
}

function Filters(props: {onDateSort?: () => void; onNameSort?: () => void}) {
  return (
    <div className="font-lexend flex flex-row gap-2 mx-3">
      <FilterButton text="Date" onClick={props.onDateSort} />
      <FilterButton text="Name" onClick={props.onNameSort} />
    </div>
  )
}

function Search(props: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative sm:ml-auto mr-3 flex-1 sm:flex-none sm:max-w-xs">
      <Input
        placeholder="Search…"
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
}) {
  return (
    <ul className="overlay-panel rounded-xl py-1.5 px-1 font-lexend min-w-36 space-y-0.5">
      <MenuEntry func={props.onRename}>Rename</MenuEntry>
      <MenuEntry func={props.onCopyLink}>Copy ID</MenuEntry>
      <MenuEntry func={props.onDelete} danger>Delete</MenuEntry>
    </ul>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card(props: {
  card: ApiProject;
  index: number;
  onDelete?: (id: string) => Promise<void>;
  onRename?: (id: string, currentName: string) => void;
}) {
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
  }, [props.card.id, props.card.name, props.onDelete, props.onRename])

  return (
    <a href="#" ref={cardRef} className="block glass card-lift w-full rounded-2xl font-lexend cursor-pointer overflow-hidden">
      <img className="rounded-t-2xl h-36 w-full object-cover" src={cardImage} alt={cardTitle} />
      <div className="flex flex-row items-center py-2.5 px-3 border-t border-white/6">
        <span className="truncate text-sm text-indigo-100 font-medium">{cardTitle}</span>
        <span className="ml-auto pl-3 whitespace-nowrap text-xs text-indigo-300/40">{cardTime}</span>
      </div>
    </a>
  )
}

// ─── Projects ─────────────────────────────────────────────────────────────────

function Projects(props: {user?: string}) {
  const [cards, setCards] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [renameModal, setRenameModal] = useState<{ id: string; currentName: string } | null>(null);
  const [refetchTick, setRefetchTick] = useState(0);

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

  const handleCreate = async (name: string) => {
    const response = await authFetch('/api/projects/', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const msg = await extractErrorMessage(response, 'Failed to create project.');
      logger.error('project.create_failed', { name, status: response.status });
      throw new Error(msg);
    }

    logger.action('project.create', { name });
    // Refresh list from page 1
    setPage(1);
    setOrdering('-created_at');
    setDebouncedSearch('');
    setSearchQuery('');
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
          Community Projects
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-2 my-2 sm:items-center">
        <Filters onDateSort={handleDateSort} onNameSort={handleNameSort} />
        <Search value={searchQuery} onChange={handleSearchChange} />
        <div className="mr-3 sm:ml-0 ml-3">
          <NewButton onClick={() => setCreateModalOpen(true)} />
        </div>
      </div>
      <div className="mx-3 mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading && <p className="col-span-full text-indigo-300/40 py-8 text-center text-sm font-light">Loading projects…</p>}
          {!loading && error && (
            <div className="col-span-full py-8 text-center space-y-3">
              <p className="text-red-300/80 text-sm">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="glass glass-hover rounded-lg px-4 py-1.5 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}
          {!loading && !error && cards.length === 0 && (
            <p className="col-span-full text-indigo-300/40 py-8 text-center text-sm font-light">
              {isCommunity ? 'No community projects yet.' : 'No projects found.'}
            </p>
          )}
          {!loading && !error && cards.map((card, index) => (
            <Card
              key={card.id}
              card={card}
              index={index}
              onDelete={handleDelete}
              onRename={(id, currentName) => setRenameModal({ id, currentName })}
            />
          ))}
        </div>
        <div className="flex flex-row items-center justify-between py-3 font-lexend text-xs text-indigo-300/40">
          <p>{totalCount} {totalCount === 1 ? 'project' : 'projects'}</p>
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
    </>
  )
}

// ─── Container ────────────────────────────────────────────────────────────────

function ProjectsContainer(props: {func?: (value: boolean) => void}) {
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
            <Projects />
          </div>
        </AnimatedContent>
    </AnimatedContent>
  )
}

export { ProjectsContainer, Projects }
