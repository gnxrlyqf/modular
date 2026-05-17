import { useEffect, useState, useRef, useCallback, type ReactNode, type CSSProperties } from "react";
import { authFetch, extractErrorMessage } from './api';
import logger from './logger';
import { t, useLanguage } from './i18n';
import { AvatarRing } from './OverlayParts';

import defaultProfileImg from './assets/default_profile.png';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiUser = {
  id: number;
  username: string;
  email: string;
  profile_id: number | null;
  is_online?: boolean;
};

type PaginatedResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiUser[];
};

type FriendshipStatus = 'pending' | 'accepted' | 'blocked';
type Friendship = { id: number; sender: number; receiver: number; status: FriendshipStatus };
type RelationKind = 'none' | 'pending_out' | 'pending_in' | 'friends';
type Relation = { kind: RelationKind; friendshipId?: number };

type ApiProject = { id: string; name: string; username?: string; created_at: string; net_votes: number };
type ProjectPaginatedResponse = { count: number; results: ApiProject[] };

const SUGGESTED = ['ambient patches', 'techno modules', 'filter design', 'beginner synth'];

// ─── SearchInput row (replaces the shell header) ──────────────────────────────

function SearchInputRow(props: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 20px',
      height: 56,
      background: 'var(--panel)',
      backdropFilter: 'blur(28px) saturate(140%)',
      WebkitBackdropFilter: 'blur(28px) saturate(140%)',
      borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      borderBottom: '1px solid var(--panel-edge)',
    }}>
      {/* Magnifier */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sub)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      {/* Input */}
      <input
        type="search"
        autoFocus
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={t('overlays.search.placeholder')}
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          outline: 'none',
          fontFamily: 'var(--font-ui)',
          fontSize: 18,
          color: 'var(--text)',
          caretColor: 'var(--accent)',
        }}
        aria-label={t('overlays.search.placeholder')}
      />

      {/* Esc keycap */}
      <span dir="ltr" onClick={props.onClose} style={{ cursor: 'pointer' }}>
        <kbd style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--sub)',
          background: 'var(--panel-inner)',
          border: '1px solid var(--panel-edge)',
          borderRadius: 4,
          padding: '4px 8px',
          letterSpacing: '0.05em',
          cursor: 'pointer',
        }}>Esc</kbd>
      </span>
    </div>
  );
}

// ─── Search result row ────────────────────────────────────────────────────────

function SearchRow(props: {
  focused: boolean;
  onClick: () => void;
  icon: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={props.onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); props.onClick(); } }}
      className={`search-row ${props.focused ? 'focused' : ''}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, flexShrink: 0 }}>
        {props.icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{props.primary}</div>
        {props.secondary && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub)', marginBlockStart: 1 }}>{props.secondary}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {props.trailing}
        {props.focused && (
          <span dir="ltr"><kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub-dim)', background: 'var(--panel-inner)', border: '1px solid var(--panel-edge)', borderRadius: 4, padding: '2px 6px' }}>↵</kbd></span>
        )}
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SearchSection({ label, count }: { label: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px 4px', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--sub-dim)' }}>
      {label}
      {count != null && <span style={{ color: 'var(--sub-dim)' }}>({count})</span>}
    </div>
  );
}

// ─── Friendship action ────────────────────────────────────────────────────────

function FriendActionChip({ relation, busy, onAdd, onAccept, onCancel, onRemove }: {
  relation: Relation; busy: boolean;
  onAdd: () => void; onAccept: () => void; onCancel: () => void; onRemove: () => void;
}) {
  if (busy) return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub-dim)' }}>…</span>;
  const chipStyle = (bg: string, color: string, border: string): CSSProperties => ({
    fontFamily: 'var(--font-mono)', fontSize: 10, padding: '3px 8px',
    borderRadius: 'var(--radius-pill)', background: bg, color, border: `1px solid ${border}`, cursor: 'pointer', letterSpacing: '0.05em',
  });
  switch (relation.kind) {
    case 'none':       return <button type="button" style={chipStyle('rgba(167,139,250,0.12)','var(--accent)','rgba(167,139,250,0.3)')} onClick={(e) => { e.stopPropagation(); onAdd(); }}>{t('users.add_friend')}</button>;
    case 'pending_out':return <button type="button" style={chipStyle('rgba(251,191,36,0.1)','var(--warning)','rgba(251,191,36,0.25)')} onClick={(e) => { e.stopPropagation(); onCancel(); }}>{t('users.pending')}</button>;
    case 'pending_in': return <button type="button" style={chipStyle('rgba(52,211,153,0.12)','var(--success)','rgba(52,211,153,0.3)')} onClick={(e) => { e.stopPropagation(); onAccept(); }}>{t('users.accept')}</button>;
    case 'friends':    return <button type="button" style={chipStyle('rgba(248,113,113,0.08)','var(--danger)','rgba(248,113,113,0.2)')} onClick={(e) => { e.stopPropagation(); onRemove(); }}>{t('users.remove')}</button>;
  }
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', gap: 12 }}>
      {/* Mini constellation */}
      <svg width="64" height="36" viewBox="0 0 64 36" aria-hidden="true">
        {[[8,18],[20,8],[32,24],[44,10],[56,20],[24,28],[48,28]].map(([x,y], i, arr) => (
          i < arr.length - 1 && <line key={i} x1={x} y1={y} x2={arr[i+1][0]} y2={arr[i+1][1]} stroke="var(--sub-dim)" strokeWidth="1" opacity="0.5" />
        ))}
        {[[8,18],[20,8],[32,24],[44,10],[56,20],[24,28],[48,28]].map(([x,y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill="var(--sub)" opacity="0.6" />
        ))}
      </svg>
      <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--text-mute)' }}>
        {t('overlays.search.empty.title')}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub-dim)' }}>
        {t('overlays.search.empty.hint')}{' '}
        <button type="button" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-mono)', fontSize: 11 }} onClick={onClose}>
          {t('overlays.search.empty.community')}
        </button>
      </div>
    </div>
  );
}

// ─── Main Search panel ────────────────────────────────────────────────────────

function SearchPanel(props: {
  onClose: () => void;
  onUserClick?: (username: string) => void;
  onMessage?: (profileId: number) => void;
}) {
  useLanguage();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [focusedIdx, setFocusedIdx] = useState(0);

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [myProfileId, setMyProfileId] = useState<number | null>(null);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [busyProfileId, setBusyProfileId] = useState<number | null>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('search_recent') ?? '[]'); } catch { return []; }
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTime = useRef(Date.now());

  // Debounce query
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    startTime.current = Date.now();
    debounceRef.current = setTimeout(() => setDebounced(query), 300);
  }, [query]);

  // Load my profile ID + friendships
  useEffect(() => {
    authFetch('/api/users/me/').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.profile_id != null) setMyProfileId(data.profile_id);
    }).catch(() => {});
    authFetch('/api/users/social/friendships/').then(r => r.ok ? r.json() : null).then(data => {
      if (Array.isArray(data)) setFriendships(data);
      else if (data?.results) setFriendships(data.results);
    }).catch(() => {});
  }, []);

  // Search users
  useEffect(() => {
    if (!debounced.trim()) { setUsers([]); return; }
    setLoadingUsers(true);
    authFetch(`/api/users/search/?search=${encodeURIComponent(debounced)}`).then(r => r.ok ? r.json() : null).then((data: PaginatedResponse | null) => {
      setUsers(data?.results ?? []);
    }).catch(() => setUsers([])).finally(() => setLoadingUsers(false));
  }, [debounced]);

  // Search projects
  useEffect(() => {
    if (!debounced.trim()) { setProjects([]); return; }
    setLoadingProjects(true);
    authFetch(`/api/search/?search=${encodeURIComponent(debounced)}`).then(r => r.ok ? r.json() : null).then((data: ProjectPaginatedResponse | null) => {
      setProjects((data?.results ?? []).slice(0, 8));
    }).catch(() => setProjects([])).finally(() => setLoadingProjects(false));
  }, [debounced]);

  // Save to recent on enter
  const saveRecent = (q: string) => {
    if (!q.trim()) return;
    const updated = [q, ...recentSearches.filter(r => r !== q)].slice(0, 5);
    setRecentSearches(updated);
    try { localStorage.setItem('search_recent', JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const removeRecent = (q: string) => {
    const updated = recentSearches.filter(r => r !== q);
    setRecentSearches(updated);
    try { localStorage.setItem('search_recent', JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const computeRelation = useCallback((profileId: number | null): Relation => {
    if (profileId == null || myProfileId == null) return { kind: 'none' };
    const f = friendships.find(x => (x.sender === myProfileId && x.receiver === profileId) || (x.sender === profileId && x.receiver === myProfileId));
    if (!f) return { kind: 'none' };
    if (f.status === 'accepted') return { kind: 'friends', friendshipId: f.id };
    if (f.status === 'pending') return f.sender === myProfileId ? { kind: 'pending_out', friendshipId: f.id } : { kind: 'pending_in', friendshipId: f.id };
    return { kind: 'none' };
  }, [friendships, myProfileId]);

  const refreshFriendships = async () => {
    const r = await authFetch('/api/users/social/friendships/');
    if (!r.ok) return;
    const d = await r.json();
    setFriendships(Array.isArray(d) ? d : (d.results ?? []));
  };

  const handleFriendshipAction = async (user: ApiUser, method: 'POST' | 'DELETE', path: string, log: string, body?: object) => {
    if (user.profile_id == null) return;
    setBusyProfileId(user.profile_id);
    try {
      await authFetch(path, { method, body: body ? JSON.stringify(body) : undefined });
      logger.action(log);
      await refreshFriendships();
    } catch { /* ignore */ } finally { setBusyProfileId(null); }
  };

  const handleAdd = (user: ApiUser) => {
    if (user.profile_id == null) return;
    handleFriendshipAction(user, 'POST', '/api/users/social/friendships/', 'friend.request_sent', { receiver: user.profile_id });
  };

  const handleAcceptUser = (user: ApiUser, rel: Relation) => {
    if (!rel.friendshipId) return;
    handleFriendshipAction(user, 'POST', `/api/users/social/friendships/${rel.friendshipId}/accept/`, 'friend.accept');
  };

  const handleCancelUser = (user: ApiUser, rel: Relation) => {
    if (!rel.friendshipId) return;
    handleFriendshipAction(user, 'DELETE', `/api/users/social/friendships/${rel.friendshipId}/`, 'friend.cancel');
  };

  const handleRemoveUser = (user: ApiUser, rel: Relation) => {
    if (!rel.friendshipId) return;
    handleFriendshipAction(user, 'DELETE', `/api/users/social/friendships/${rel.friendshipId}/`, 'friend.remove');
  };

  const totalResults = users.length + projects.length;
  const elapsed = Date.now() - startTime.current;
  const hasResults = totalResults > 0;
  const showEmpty = debounced.trim() && !loadingUsers && !loadingProjects && !hasResults;
  const showRecent = !debounced.trim();

  return (
    <div
      className="overlay-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={t('overlays.search.placeholder')}
    >
      <div
        className="glass-shell overlay-shell overlay-enter"
        style={{ width: '100%', maxWidth: 720, maxHeight: '80vh', display: 'flex', flexDirection: 'column', outline: 'none' }}
        tabIndex={-1}
      >
        {/* Search input IS the header */}
        <SearchInputRow value={query} onChange={setQuery} onClose={props.onClose} />

        {/* Body */}
        <div className="overlay-content" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

          {/* Recent + suggestions (empty state) */}
          {showRecent && (
            <div style={{ padding: '4px 0 8px' }}>
              {recentSearches.length > 0 && (
                <>
                  <SearchSection label={t('overlays.search.section.recent')} />
                  {recentSearches.map((r) => (
                    <div key={r} className="search-row" style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--sub)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </div>
                      <button type="button" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-mute)', background: 'none', border: 'none', textAlign: 'start', cursor: 'pointer', padding: 0 }} onClick={() => setQuery(r)}>{r}</button>
                      <button type="button" onClick={() => removeRecent(r)} aria-label="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub-dim)', fontSize: 14, lineHeight: 1, padding: '0 4px' }}>×</button>
                    </div>
                  ))}
                </>
              )}
              <SearchSection label={t('overlays.search.section.try')} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '4px 20px 8px' }}>
                {SUGGESTED.map((s) => (
                  <button key={s} type="button" onClick={() => setQuery(s)}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '4px 12px', borderRadius: 'var(--radius-pill)', background: 'var(--panel-inner)', border: '1px solid var(--panel-edge)', color: 'var(--sub)', cursor: 'pointer', letterSpacing: '0.05em' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {showEmpty && <EmptyState onClose={props.onClose} />}

          {/* Results */}
          {debounced.trim() && (hasResults || loadingUsers || loadingProjects) && (
            <div style={{ padding: '4px 0 8px' }}>
              {/* Patches section */}
              {(projects.length > 0 || loadingProjects) && (
                <>
                  <SearchSection label={t('overlays.search.section.patches')} count={projects.length || undefined} />
                  {projects.map((p, i) => (
                    <SearchRow
                      key={p.id}
                      focused={focusedIdx === i}
                      onClick={() => { saveRecent(query); window.open(`/project/${p.id}`, '_blank'); }}
                      icon={
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--panel-inner)', border: '1px solid var(--panel-edge)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                            <circle cx="4" cy="10" r="1.5" fill="var(--accent)" opacity="0.7" />
                            <circle cx="10" cy="5" r="1.5" fill="var(--accent-2)" opacity="0.7" />
                            <circle cx="16" cy="12" r="1.5" fill="var(--accent-3)" opacity="0.7" />
                            <line x1="4" y1="10" x2="10" y2="5" stroke="var(--sub)" strokeWidth="1" opacity="0.5" />
                            <line x1="10" y1="5" x2="16" y2="12" stroke="var(--sub)" strokeWidth="1" opacity="0.5" />
                          </svg>
                        </div>
                      }
                      primary={p.name}
                      secondary={p.username ? `@${p.username}` : ''}
                      trailing={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub-dim)' }}>▲ {p.net_votes}</span>}
                    />
                  ))}
                </>
              )}

              {/* Creators section */}
              {(users.length > 0 || loadingUsers) && (
                <>
                  <SearchSection label={t('overlays.search.section.users')} count={users.length || undefined} />
                  {users.map((u, i) => {
                    const rel = computeRelation(u.profile_id);
                    const isSelf = u.profile_id != null && u.profile_id === myProfileId;
                    const idx = projects.length + i;
                    return (
                      <SearchRow
                        key={u.id}
                        focused={focusedIdx === idx}
                        onClick={() => { saveRecent(query); if (!isSelf && u.profile_id != null && props.onUserClick) { props.onUserClick(u.username); props.onClose(); } }}
                        icon={<AvatarRing src={null} alt={u.username} size={32} static />}
                        primary={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>@{u.username}</span>}
                        secondary={u.email}
                        trailing={isSelf
                          ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub-dim)', fontStyle: 'italic' }}>{t('users.you')}</span>
                          : u.profile_id != null
                            ? <FriendActionChip
                                relation={rel}
                                busy={busyProfileId === u.profile_id}
                                onAdd={() => handleAdd(u)}
                                onAccept={() => handleAcceptUser(u, rel)}
                                onCancel={() => handleCancelUser(u, rel)}
                                onRemove={() => handleRemoveUser(u, rel)}
                              />
                            : null
                        }
                      />
                    );
                  })}
                </>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', borderTop: '1px solid var(--panel-edge)' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { key: t('overlays.search.footer.navigate') },
              { key: t('overlays.search.footer.open') },
              { key: t('overlays.search.footer.close') },
            ].map((hint) => (
              <span key={hint.key} dir="ltr" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub-dim)' }}>{hint.key}</span>
            ))}
          </div>
          {debounced.trim() && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub-dim)' }}>
              {totalResults} {totalResults === 1 ? t('overlays.search.footer.results_one') : t('overlays.search.footer.results_other')} · {elapsed}ms
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── UserSearch (legacy internal component, kept for compatibility) ────────────

function UserSearch(props: { onUserClick?: (username: string) => void; onMessage?: (profileId: number) => void }) {
  return <SearchPanel onClose={() => {}} onUserClick={props.onUserClick} onMessage={props.onMessage} />;
}

// ─── Container ────────────────────────────────────────────────────────────────

function UserSearchContainer(props: {
  func?: (value: boolean) => void;
  onUserClick?: (username: string) => void;
  onMessage?: (profileId: number) => void;
}) {
  const handleClose = () => props.func?.(false);

  return (
    <SearchPanel
      onClose={handleClose}
      onUserClick={(username) => { props.onUserClick?.(username); handleClose(); }}
      onMessage={props.onMessage}
    />
  );
}

export { UserSearchContainer, UserSearch };
