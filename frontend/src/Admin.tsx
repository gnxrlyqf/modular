import { useEffect, useState } from 'react';
import { AnimatedContent } from './ReactBits/ReactBits';
import { authFetch, extractErrorMessage } from './api';
import { CloseButton } from './Reusables';
import logger from './logger';

type AdminUser = {
  id: number;
  username: string;
  email?: string | null;
};

type LogEntry = {
  id: number;
  user: number | null;
  level: string;
  message: string;
  context: unknown;
  source: string;
  created_at: string;
};

function UserRow(props: {
  user: AdminUser;
  onDelete: (id: number) => void;
  onViewLogs: (id: number) => void;
  busy: boolean;
}) {
  return (
    <div className="settings-row settings-row-box">
      <div className="flex flex-col">
        <span className="text-indigo-100 text-sm">{props.user.username}</span>
        <span className="text-indigo-300/40 text-xs">id={props.user.id}{props.user.email ? ` · ${props.user.email}` : ''}</span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => props.onViewLogs(props.user.id)}
          className="glass glass-hover rounded-lg px-3 py-1 text-xs font-medium text-indigo-300/80 hover:text-white tracking-wide cursor-pointer"
        >
          Logs
        </button>
        <button
          type="button"
          disabled={props.busy}
          onClick={() => props.onDelete(props.user.id)}
          className="rounded-lg px-3 py-1 text-xs font-medium bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 text-red-300/80 hover:text-red-200 tracking-wide cursor-pointer disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function LogList(props: { logs: LogEntry[] }) {
  if (props.logs.length === 0) {
    return <p className="text-indigo-300/40 text-xs italic">No logs.</p>;
  }
  return (
    <div className="space-y-1.5 max-h-80 overflow-y-auto">
      {props.logs.map((l) => (
        <div key={l.id} className="text-xs font-mono text-indigo-200/80 border-l-2 border-indigo-500/30 pl-2">
          <span className="text-indigo-300/50">{new Date(l.created_at).toISOString().slice(11, 19)}</span>
          <span className={`ml-2 uppercase ${l.level === 'error' ? 'text-red-300/90' : l.level === 'warning' ? 'text-yellow-300/80' : 'text-indigo-300/70'}`}>{l.level}</span>
          <span className="ml-2">{l.message}</span>
        </div>
      ))}
    </div>
  );
}

function AdminPanel(props: { onClose: () => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyDelete, setBusyDelete] = useState<number | null>(null);
  const [logsForUser, setLogsForUser] = useState<{ userId: number; logs: LogEntry[] } | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [search, setSearch] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/users/admin/users/');
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, 'Failed to load users.'));
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      setUsers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    setBusyDelete(id);
    setError(null);
    try {
      const res = await authFetch(`/api/users/admin/users/${id}/`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        throw new Error(await extractErrorMessage(res, 'Delete failed.'));
      }
      logger.action('admin.user_deleted', { id });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (logsForUser?.userId === id) setLogsForUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setBusyDelete(null);
    }
  };

  const handleViewLogs = async (id: number) => {
    setLogsLoading(true);
    setLogsForUser({ userId: id, logs: [] });
    try {
      const res = await authFetch(`/api/users/admin/users/${id}/logs/`);
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, 'Failed to load logs.'));
      }
      const data = await res.json();
      const logs: LogEntry[] = Array.isArray(data) ? data : (data?.results ?? []);
      setLogsForUser({ userId: id, logs });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs.');
      setLogsForUser(null);
    } finally {
      setLogsLoading(false);
    }
  };

  const filtered = users.filter((u) =>
    !search || u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="font-lexend overlay-panel rounded-2xl z-50 w-full max-w-3xl mx-3 sm:mx-auto">
      <div className="flex justify-between items-center px-5 pt-5 pb-2">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-200 via-blue-200 to-indigo-400 bg-clip-text text-transparent tracking-wide">
          Admin
        </h1>
        <CloseButton onClick={props.onClose} />
      </div>

      <div className="mx-3 sm:mx-4 mb-4 mt-2 rounded-xl border border-white/6 bg-white/2 p-4 sm:p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Filter by username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-indigo-100 border border-white/10 placeholder:text-indigo-300/30 outline-none focus:border-indigo-500/40"
          />
          <button
            type="button"
            onClick={refresh}
            className="glass glass-hover rounded-lg px-3 py-2 text-xs font-medium text-indigo-300/80 hover:text-white cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {error && <p className="text-red-300/80 text-sm">{error}</p>}

        <section className="space-y-2">
          <h2 className="text-sm uppercase tracking-wider text-indigo-300/60">Users ({filtered.length})</h2>
          {loading && <p className="text-indigo-300/50 text-xs">Loading…</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-indigo-300/40 text-xs italic">No users.</p>
          )}
          <div className="space-y-2">
            {filtered.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                onDelete={handleDelete}
                onViewLogs={handleViewLogs}
                busy={busyDelete === u.id}
              />
            ))}
          </div>
        </section>

        {logsForUser && (
          <section className="space-y-2 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-sm uppercase tracking-wider text-indigo-300/60">
                Logs for user #{logsForUser.userId}
              </h2>
              <button
                type="button"
                onClick={() => setLogsForUser(null)}
                className="text-xs text-indigo-300/50 hover:text-indigo-200 cursor-pointer"
              >
                Close
              </button>
            </div>
            {logsLoading ? (
              <p className="text-indigo-300/50 text-xs">Loading…</p>
            ) : (
              <LogList logs={logsForUser.logs} />
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export function useIsAdmin(): { isAdmin: boolean | null; refresh: () => void } {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const refresh = () => {
    authFetch('/api/users/admin/check/')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setIsAdmin(Boolean(data?.is_admin));
      })
      .catch(() => setIsAdmin(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  return { isAdmin, refresh };
}

export function AdminContainer(props: { func?: (value: boolean) => void }) {
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
        <AdminPanel onClose={() => setVisible(false)} />
      </AnimatedContent>
    </AnimatedContent>
  );
}

export default AdminContainer;
