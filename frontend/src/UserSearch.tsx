import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatedContent } from './ReactBits/ReactBits';
import { Input, CloseButton } from './Reusables';
import { authFetch, extractErrorMessage } from './api';
import logger from './logger';
import { t, useLanguage } from './i18n';

type ApiUser = {
  id: number;
  username: string;
  email: string;
  profile_id: number | null;
  is_online?: boolean;
};

function OnlineDot() {
  return (
    <span className="online-dot absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400" />
  );
}

type PaginatedResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiUser[];
};

type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

type Friendship = {
  id: number;
  sender: number;
  receiver: number;
  status: FriendshipStatus;
};

type RelationKind = 'none' | 'pending_out' | 'pending_in' | 'friends';
type Relation = {
  kind: RelationKind;
  friendshipId?: number;
};

// ─── Search Input ─────────────────────────────────────────────────────────────

function Search(props: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative flex-1">
      <Input
        placeholder={t('users.search_placeholder')}
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

// ─── Action Button ────────────────────────────────────────────────────────────

function ActionButton(props: {
  relation: Relation;
  busy: boolean;
  onAdd: () => void;
  onAccept: () => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  const base = "rounded-lg px-3 py-1 text-xs font-medium tracking-wide cursor-pointer transition-all duration-150 disabled:opacity-50";
  if (props.busy) {
    return <button disabled className={`${base} bg-indigo-500/10 text-indigo-300/50 border border-indigo-400/15`}>…</button>;
  }
  switch (props.relation.kind) {
    case 'none':
      return (
        <button
          type="button"
          onClick={props.onAdd}
          className={`${base} bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-indigo-200 hover:text-white`}
        >
          {t('users.add_friend')}
        </button>
      );
    case 'pending_out':
      return (
        <button
          type="button"
          onClick={props.onCancel}
          title="Click to cancel"
          className={`${base} bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-400/30 text-yellow-200`}
        >
          {t('users.pending')}
        </button>
      );
    case 'pending_in':
      return (
        <button
          type="button"
          onClick={props.onAccept}
          className={`${base} bg-green-500/15 hover:bg-green-500/25 border border-green-400/30 text-green-200 hover:text-white`}
        >
          {t('users.accept')}
        </button>
      );
    case 'friends':
      return (
        <button
          type="button"
          onClick={props.onRemove}
          className={`${base} bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 text-red-200`}
        >
          {t('users.remove')}
        </button>
      );
  }
}

// ─── User Row ─────────────────────────────────────────────────────────────────

function UserRow(props: {
  user: ApiUser;
  relation: Relation;
  busy: boolean;
  onAdd: (user: ApiUser) => void;
  onAccept: (relation: Relation) => void;
  onCancel: (relation: Relation) => void;
  onRemove: (relation: Relation) => void;
  isSelf: boolean;
  onUserClick?: (username: string) => void;
  onMessage?: (profileId: number) => void;
}) {
  const initials = props.user.username.slice(0, 2).toUpperCase();
  const canClick = !props.isSelf && props.user.profile_id != null && props.onUserClick;

  return (
    <div className="user-row flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2.5">
      <div
        className={`relative flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-400/20 text-xs font-semibold text-indigo-200 tracking-wide ${canClick ? 'cursor-pointer hover:bg-indigo-500/35 transition-colors' : ''}`}
        onClick={canClick ? () => props.onUserClick!(props.user.username) : undefined}
      >
        {initials}
        {props.user.is_online && <OnlineDot />}
      </div>
      <div
        className={`min-w-0 flex-1 ${canClick ? 'cursor-pointer' : ''}`}
        onClick={canClick ? () => props.onUserClick!(props.user.username) : undefined}
      >
        <p className={`truncate text-sm font-medium text-indigo-100 ${canClick ? 'hover:text-white transition-colors' : ''}`}>{props.user.username}</p>
        <p className="truncate text-xs text-indigo-300/40">{props.user.email}</p>
      </div>
      {props.isSelf ? (
        <span className="text-xs text-indigo-300/40 italic">{t('users.you')}</span>
      ) : props.user.profile_id == null ? (
        <span className="text-xs text-indigo-300/30 italic">{t('users.no_profile')}</span>
      ) : (
        <div className="flex items-center gap-1.5">
          {props.relation.kind === 'friends' && props.onMessage && props.user.profile_id != null && (
            <button
              type="button"
              onClick={() => props.onMessage!(props.user.profile_id!)}
              className="rounded-lg px-3 py-1 text-xs font-medium tracking-wide cursor-pointer transition-all duration-150 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-indigo-200 hover:text-white"
            >
              {t('users.message')}
            </button>
          )}
          <ActionButton
            relation={props.relation}
            busy={props.busy}
            onAdd={() => props.onAdd(props.user)}
            onAccept={() => props.onAccept(props.relation)}
            onCancel={() => props.onCancel(props.relation)}
            onRemove={() => props.onRemove(props.relation)}
          />
        </div>
      )}
    </div>
  );
}

// ─── UserSearch ───────────────────────────────────────────────────────────────

function UserSearch(props: { onUserClick?: (username: string) => void; onMessage?: (profileId: number) => void }) {
  useLanguage();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [myProfileId, setMyProfileId] = useState<number | null>(null);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [busyProfileId, setBusyProfileId] = useState<number | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PAGE_SIZE = 9;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const refreshFriendships = useCallback(async () => {
    try {
      const res = await authFetch('/api/users/social/friendships/');
      if (!res.ok) return;
      const data = await res.json();
      const list: Friendship[] = Array.isArray(data) ? data : (data.results ?? []);
      setFriendships(list);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    authFetch('/api/users/me/')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.profile_id != null) setMyProfileId(data.profile_id);
      })
      .catch(() => {});
    refreshFriendships();
  }, [refreshFriendships]);

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
        if (!response.ok) {
          throw new Error(await extractErrorMessage(response, 'Could not fetch users.'));
        }
        const data: PaginatedResponse = await response.json();
        setUsers(data.results);
        setTotalCount(data.count);
      } catch (err) {
        logger.error('users.search_error', { query: debouncedSearch });
        setUsers([]);
        setError(err instanceof Error ? err.message : 'Failed to load users.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [debouncedSearch, page]);

  const computeRelation = useCallback((profileId: number | null): Relation => {
    if (profileId == null || myProfileId == null) return { kind: 'none' };
    const f = friendships.find(
      (x) =>
        (x.sender === myProfileId && x.receiver === profileId) ||
        (x.sender === profileId && x.receiver === myProfileId)
    );
    if (!f) return { kind: 'none' };
    if (f.status === 'accepted') return { kind: 'friends', friendshipId: f.id };
    if (f.status === 'pending') {
      if (f.sender === myProfileId) return { kind: 'pending_out', friendshipId: f.id };
      return { kind: 'pending_in', friendshipId: f.id };
    }
    return { kind: 'none', friendshipId: f.id };
  }, [friendships, myProfileId]);

  const handleAdd = async (user: ApiUser) => {
    if (user.profile_id == null) return;
    setBusyProfileId(user.profile_id);
    setError(null);
    try {
      const res = await authFetch('/api/users/social/friendships/', {
        method: 'POST',
        body: JSON.stringify({ receiver: user.profile_id }),
      });
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, 'Could not send request.'));
      }
      logger.action('friend.request_sent', { receiver: user.profile_id });
      await refreshFriendships();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send request.');
    } finally {
      setBusyProfileId(null);
    }
  };

  const runFriendshipAction = async (
    relation: Relation,
    profileIdForBusy: number,
    method: 'POST' | 'DELETE',
    pathSuffix: string,
    actionLog: string
  ) => {
    if (!relation.friendshipId) return;
    setBusyProfileId(profileIdForBusy);
    setError(null);
    try {
      const res = await authFetch(
        `/api/users/social/friendships/${relation.friendshipId}/${pathSuffix}`,
        { method }
      );
      if (!res.ok && res.status !== 204) {
        throw new Error(await extractErrorMessage(res, 'Action failed.'));
      }
      logger.action(actionLog, { friendship: relation.friendshipId });
      await refreshFriendships();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyProfileId(null);
    }
  };

  const handleAccept = async (relation: Relation) => {
    const u = users.find((x) => computeRelation(x.profile_id).friendshipId === relation.friendshipId);
    const pid = u?.profile_id ?? -1;
    await runFriendshipAction(relation, pid, 'POST', 'accept/', 'friend.accept');
  };

  const handleCancel = async (relation: Relation) => {
    const u = users.find((x) => computeRelation(x.profile_id).friendshipId === relation.friendshipId);
    const pid = u?.profile_id ?? -1;
    await runFriendshipAction(relation, pid, 'DELETE', '', 'friend.cancel');
  };

  const handleRemove = async (relation: Relation) => {
    const u = users.find((x) => computeRelation(x.profile_id).friendshipId === relation.friendshipId);
    const pid = u?.profile_id ?? -1;
    await runFriendshipAction(relation, pid, 'DELETE', '', 'friend.remove');
  };

  return (
    <div className="font-lexend flex flex-col gap-4 p-5">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-wide whitespace-nowrap">{t('users.find_title')}</h2>
        <Search value={searchQuery} onChange={handleSearchChange} />
      </div>

      <div className="flex flex-col gap-1 min-h-20">
        {!debouncedSearch.trim() && (
          <p className="text-indigo-300/40 text-xs py-4 text-center font-light tracking-wide">
            {t('users.type_to_search')}
          </p>
        )}
        {loading && <p className="text-indigo-300/40 py-4 text-center text-xs">{t('users.searching')}</p>}
        {!loading && error && <p className="text-red-300/80 py-4 text-center text-xs">{error}</p>}
        {!loading && !error && debouncedSearch.trim() && users.length === 0 && (
          <p className="text-indigo-300/40 py-4 text-center text-xs">{t('users.no_results')}</p>
        )}
        {!loading && !error && users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            relation={computeRelation(user.profile_id)}
            busy={busyProfileId === user.profile_id}
            isSelf={user.profile_id != null && user.profile_id === myProfileId}
            onAdd={handleAdd}
            onAccept={handleAccept}
            onCancel={handleCancel}
            onRemove={handleRemove}
            onUserClick={props.onUserClick}
            onMessage={props.onMessage}
          />
        ))}
      </div>

      {totalCount > 0 && (
        <div className="flex items-center justify-between text-xs text-indigo-300/50">
          <span>{totalCount} {totalCount === 1 ? t('users.count_singular') : t('users.count_plural')}</span>
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

function UserSearchContainer(props: { func?: (value: boolean) => void; onUserClick?: (username: string) => void; onMessage?: (profileId: number) => void }) {
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
        <div className="overlay-panel rounded-2xl w-full max-w-[28rem] mx-3 sm:mx-auto">
          <div className="flex justify-end px-4 pt-4 pb-0">
            <CloseButton onClick={() => setVisible(false)} />
          </div>
          <UserSearch onUserClick={props.onUserClick} onMessage={props.onMessage} />
        </div>
      </AnimatedContent>
    </AnimatedContent>
  );
}

export { UserSearchContainer, UserSearch };
