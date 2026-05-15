import { useEffect, useState } from 'react';
import { authFetch, extractErrorMessage } from './api';
import logger from './logger';
import { t, useLanguage } from './i18n';
import OverlayShell from './OverlayShell';
import { StatusPill, PillButton } from './OverlayParts';

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

// ─── Log level badge ──────────────────────────────────────────────────────────

function levelColor(level: string): string {
  if (level === 'error')   return 'var(--danger)';
  if (level === 'warning') return 'var(--warning)';
  if (level === 'action')  return 'var(--accent)';
  if (level === 'debug')   return 'var(--sub)';
  return 'var(--accent-2)';
}

// ─── Log list ─────────────────────────────────────────────────────────────────

function LogList(props: { logs: LogEntry[] }) {
  if (props.logs.length === 0) {
    return (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub-dim)', fontStyle: 'italic', padding: '8px 0' }}>
        {t('admin.no_logs')}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }}>
      {props.logs.map((l) => (
        <div key={l.id} style={{
          display: 'grid',
          gridTemplateColumns: '52px 64px 1fr',
          gap: 10,
          alignItems: 'baseline',
          padding: '4px 8px',
          borderRadius: 6,
          background: 'var(--panel-inner)',
          borderInlineStart: `2px solid ${levelColor(l.level)}`,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
        }}>
          <span style={{ color: 'var(--sub-dim)' }}>{new Date(l.created_at).toISOString().slice(11, 19)}</span>
          <span style={{ color: levelColor(l.level), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l.level}</span>
          <span style={{ color: 'var(--text-mute)', wordBreak: 'break-all' }}>{l.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow(props: {
  user: AdminUser;
  onDelete: (id: number) => void;
  onViewLogs: (id: number) => void;
  busy: boolean;
  logsOpen: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 14px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--field-bg)',
      border: '1px solid var(--panel-edge)',
      transition: 'border-color 150ms ease',
    }}>
      {/* Identity */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{props.user.username}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub-dim)', marginBlockStart: 2 }}>
          id={props.user.id}{props.user.email ? ` · ${props.user.email}` : ''}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <PillButton
          variant={props.logsOpen ? 'solid' : 'outline'}
          onClick={() => props.onViewLogs(props.user.id)}
        >
          {t('common.logs')}
        </PillButton>
        <PillButton variant="danger" onClick={() => props.onDelete(props.user.id)} disabled={props.busy}>
          {t('common.delete')}
        </PillButton>
      </div>
    </div>
  );
}

// ─── Admin panel ──────────────────────────────────────────────────────────────

function AdminPanel(props: { onClose: () => void }) {
  useLanguage();
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
      if (!res.ok) throw new Error(await extractErrorMessage(res, 'Failed to load users.'));
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : (data?.results ?? []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.confirm_delete'))) return;
    setBusyDelete(id);
    setError(null);
    try {
      const res = await authFetch(`/api/users/admin/users/${id}/`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error(await extractErrorMessage(res, 'Delete failed.'));
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
    if (logsForUser?.userId === id) { setLogsForUser(null); return; }
    setLogsLoading(true);
    setLogsForUser({ userId: id, logs: [] });
    try {
      const res = await authFetch(`/api/users/admin/users/${id}/logs/`);
      if (!res.ok) throw new Error(await extractErrorMessage(res, 'Failed to load logs.'));
      const data = await res.json();
      setLogsForUser({ userId: id, logs: Array.isArray(data) ? data : (data?.results ?? []) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs.');
      setLogsForUser(null);
    } finally {
      setLogsLoading(false);
    }
  };

  const filtered = users.filter((u) => !search || u.username.toLowerCase().includes(search.toLowerCase()));

  const logsUser = logsForUser ? users.find((u) => u.id === logsForUser.userId) : null;

  const headerRight = (
    <PillButton variant="outline" onClick={refresh}>
      {t('admin.refresh')}
    </PillButton>
  );

  return (
    <OverlayShell
      kicker="── Admin · Console"
      title={t('admin.title')}
      headerRight={headerRight}
      width={860}
      maxHeight="90vh"
      onClose={props.onClose}
    >
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Search bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--field-bg)', border: '1px solid var(--panel-edge)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sub)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            placeholder={t('admin.filter')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)' }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {/* Users section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--sub-dim)' }}>
            {t('admin.users')}
          </span>
          {!loading && (
            <StatusPill color="var(--accent-2)" text={`${filtered.length}`} />
          )}
        </div>

        {/* User list */}
        {loading && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub-dim)', textAlign: 'center', padding: '20px 0' }}>{t('common.loading')}</div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub-dim)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>{t('admin.no_users')}</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              onDelete={handleDelete}
              onViewLogs={handleViewLogs}
              busy={busyDelete === u.id}
              logsOpen={logsForUser?.userId === u.id}
            />
          ))}
        </div>

        {/* Logs panel */}
        {logsForUser && (
          <div style={{ borderTop: '1px solid var(--panel-edge)', paddingBlockStart: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--sub-dim)' }}>
                {t('admin.logs_for')} <span style={{ color: 'var(--accent)' }}>@{logsUser?.username ?? `#${logsForUser.userId}`}</span>
              </span>
              <button type="button" onClick={() => setLogsForUser(null)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub-dim)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {t('common.close')} ×
              </button>
            </div>
            {logsLoading ? (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub-dim)', textAlign: 'center', padding: '16px 0' }}>{t('common.loading')}</div>
            ) : (
              <LogList logs={logsForUser.logs} />
            )}
          </div>
        )}
      </div>
    </OverlayShell>
  );
}

// ─── useIsAdmin hook (unchanged) ──────────────────────────────────────────────

export function useIsAdmin(): { isAdmin: boolean | null; refresh: () => void } {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const refresh = () => {
    authFetch('/api/users/admin/check/')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setIsAdmin(Boolean(data?.is_admin)); })
      .catch(() => setIsAdmin(false));
  };

  useEffect(() => { refresh(); }, []);

  return { isAdmin, refresh };
}

// ─── Container ────────────────────────────────────────────────────────────────

export function AdminContainer(props: { func?: (value: boolean) => void }) {
  useLanguage();
  const handleClose = () => props.func?.(false);
  return <AdminPanel onClose={handleClose} />;
}

export default AdminContainer;
