import { useEffect, useState, useRef } from "react";
import { AnimatedContent } from './ReactBits/ReactBits';
import { Input, CloseButton } from './Reusables';
import { authFetch } from './api';
import logger from './logger';

type ApiUser = {
  id: number;
  username: string;
  email: string;
};

type PaginatedResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiUser[];
};

// ─── Search Input ─────────────────────────────────────────────────────────────

function Search(props: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative flex-1">
      <Input
        placeholder="Search users…"
        type="search"
        autoFocus
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full pr-8"
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
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────

function UserRow(props: { user: ApiUser }) {
  const initials = props.user.username.slice(0, 2).toUpperCase();

  return (
    <div className="user-row flex items-center gap-3 px-3 py-2.5 cursor-default">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-400/20 text-xs font-semibold text-indigo-200 tracking-wide">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-indigo-100">{props.user.username}</p>
        <p className="truncate text-xs text-indigo-300/40">{props.user.email}</p>
      </div>
    </div>
  );
}

// ─── UserSearch ───────────────────────────────────────────────────────────────

function UserSearch() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PAGE_SIZE = 9;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      if (value.trim()) logger.action('users.search', { query: value.trim() });
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setUsers([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ search: debouncedSearch, page: String(page) });
        const response = await authFetch(`/api/users/search/?${params.toString()}`);
        if (!response.ok) throw new Error('Could not fetch users.');
        const data: PaginatedResponse = await response.json();
        setUsers(data.results);
        setTotalCount(data.count);
      } catch {
        logger.error('users.search_error', { query: debouncedSearch });
        setUsers([]);
        setError('Failed to load users.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [debouncedSearch, page]);

  return (
    <div className="font-lexend flex flex-col gap-4 p-5">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-wide whitespace-nowrap">Find Users</h2>
        <Search value={searchQuery} onChange={handleSearchChange} />
      </div>

      <div className="flex flex-col gap-1 min-h-20">
        {!debouncedSearch.trim() && (
          <p className="text-indigo-300/40 text-xs py-4 text-center font-light tracking-wide">
            Type to search by username or email.
          </p>
        )}
        {loading && <p className="text-indigo-300/40 py-4 text-center text-xs">Searching…</p>}
        {!loading && error && <p className="text-red-300/80 py-4 text-center text-xs">{error}</p>}
        {!loading && !error && debouncedSearch.trim() && users.length === 0 && (
          <p className="text-indigo-300/40 py-4 text-center text-xs">No users found.</p>
        )}
        {!loading && !error && users.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </div>

      {totalCount > 0 && (
        <div className="flex items-center justify-between text-xs text-indigo-300/50">
          <span>{totalCount} {totalCount === 1 ? 'user' : 'users'}</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="btn-page"
              >
                ←
              </button>
              <span className="text-indigo-300/40 tabular-nums">{page} / {totalPages}</span>
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
      )}
    </div>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────

function UserSearchContainer(props: { func?: (value: boolean) => void }) {
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
        delay={0.1}
      >
        <div className="overlay-panel rounded-2xl w-[28rem] mx-auto">
          <div className="flex justify-end px-4 pt-4 pb-0">
            <CloseButton onClick={() => setVisible(false)} />
          </div>
          <UserSearch />
        </div>
      </AnimatedContent>
    </AnimatedContent>
  );
}

export { UserSearchContainer, UserSearch };
