import { useCallback, useEffect, useState } from "react";
import { authFetch } from './api';
import logger from './logger';
import { t, useLanguage, richT } from './i18n';
import OverlayShell from './OverlayShell';
import { StatusPill, PillButton, TimestampMono } from './OverlayParts';

export type NotifType = 'message' | 'friend_request';

export type Notification = {
  id: number;
  type: NotifType;
  actor: number;
  actor_username: string;
  actor_display_name: string;
  actor_avatar: string | null;
  related_id: number | null;
  read_at: string | null;
  created_at: string;
};


// ─── Notification type icon ───────────────────────────────────────────────────

function NotifIcon({ type }: { type: NotifType }) {
  if (type === 'message') {
    return (
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(125,211,252,0.12)', border: '1px solid rgba(125,211,252,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
    );
  }
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </div>
  );
}

// ─── Friend request inline actions ───────────────────────────────────────────

function FriendRequestActions(props: {
  notif: Notification;
  busy: boolean;
  onAccept: (n: Notification) => void;
  onDecline: (n: Notification) => void;
  resolved: 'accepted' | 'declined' | null;
}) {
  if (props.resolved === 'accepted') {
    return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--success)', fontStyle: 'italic' }}>{t('notif.accepted')}</span>;
  }
  if (props.resolved === 'declined') {
    return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub-dim)', fontStyle: 'italic' }}>{t('notif.declined')}</span>;
  }
  if (props.notif.read_at !== null) return null;
  if (props.notif.related_id == null) return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub-dim)', fontStyle: 'italic' }}>{t('notif.expired')}</span>;

  return (
    <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
      <button type="button" disabled={props.busy} onClick={() => props.onAccept(props.notif)}
        style={{ borderRadius: 6, padding: '3px 10px', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500, cursor: 'pointer', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: 'var(--success)', opacity: props.busy ? 0.5 : 1 }}>
        {t('notif.accept')}
      </button>
      <button type="button" disabled={props.busy} onClick={() => props.onDecline(props.notif)}
        style={{ borderRadius: 6, padding: '3px 10px', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500, cursor: 'pointer', background: 'var(--panel-inner)', border: '1px solid var(--panel-edge)', color: 'var(--sub)', opacity: props.busy ? 0.5 : 1 }}>
        {t('notif.decline')}
      </button>
    </div>
  );
}

// ─── Notification body text with rich markup ──────────────────────────────────

function NotifBody({ notif }: { notif: Notification }) {
  const actor = notif.actor_display_name || notif.actor_username;
  const keyMap: Record<NotifType, string> = {
    message: 'overlays.notifications.action.message',
    friend_request: 'overlays.notifications.action.friend_request',
  };
  const key = keyMap[notif.type] as Parameters<typeof richT>[0];
  const nodes = richT(key, {
    actor: <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{actor}</strong>,
  });
  return (
    <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-mute)', lineHeight: 1.4, margin: 0 }}>
      {nodes}
    </p>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

function NotificationsCenter(props: {
  onClose: () => void;
  onOpenMessage: (actorProfileId: number) => void;
  onFriendsChanged?: () => void;
  onOpenCommunity?: () => void;
}) {
  useLanguage();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [resolved, setResolved] = useState<Record<number, 'accepted' | 'declined'>>({});

  const load = useCallback(async () => {
    try {
      const res = await authFetch('/api/notifications/');
      if (!res.ok) return;
      const data = await res.json();
      const list: Notification[] = Array.isArray(data) ? data : (data.results ?? []);
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const tick = setInterval(load, 10000);
    return () => clearInterval(tick);
  }, [load]);

  const markAllRead = async () => {
    await authFetch('/api/notifications/mark-all-read/', { method: 'POST' });
    logger.action('notifications.mark_all_read');
    load();
  };

  const handleClick = async (n: Notification) => {
    if (!n.read_at) {
      authFetch(`/api/notifications/${n.id}/mark-read/`, { method: 'POST' }).catch(() => {});
    }
    if (n.type === 'message') {
      props.onOpenMessage(n.actor);
      props.onClose();
    }
  };

  const handleAccept = async (n: Notification) => {
    if (n.related_id == null || busyId != null) return;
    setBusyId(n.id);
    try {
      const res = await authFetch(`/api/users/social/friendships/${n.related_id}/accept/`, { method: 'POST' });
      if (res.ok) {
        logger.action('friend.accept_from_notif', { friendship: n.related_id });
        setResolved((r) => ({ ...r, [n.id]: 'accepted' }));
        authFetch(`/api/notifications/${n.id}/mark-read/`, { method: 'POST' }).catch(() => {});
        props.onFriendsChanged?.();
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (n: Notification) => {
    if (n.related_id == null || busyId != null) return;
    setBusyId(n.id);
    try {
      const res = await authFetch(`/api/users/social/friendships/${n.related_id}/decline/`, { method: 'POST' });
      if (res.ok) {
        logger.action('friend.decline_from_notif', { friendship: n.related_id });
        setResolved((r) => ({ ...r, [n.id]: 'declined' }));
        authFetch(`/api/notifications/${n.id}/mark-read/`, { method: 'POST' }).catch(() => {});
        props.onFriendsChanged?.();
      }
    } finally {
      setBusyId(null);
    }
  };

  const headerRight = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <PillButton variant="outline" onClick={markAllRead}>
        {t('overlays.notifications.mark_all_read')}
      </PillButton>
    </div>
  );

  return (
    <OverlayShell
      kicker={t('overlays.notifications.kicker')}
      title={t('nav.notifications')}
      headerRight={headerRight}
      width={720}
      maxHeight="90vh"
      onClose={props.onClose}
    >
      {/* Notification list */}
      <div style={{ padding: '8px 12px', minHeight: 300 }}>
        {loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub-dim)' }}>{t('common.loading')}</div>
        )}

        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, color: 'var(--text-mute)' }}>{t('overlays.notifications.empty')}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub-dim)' }}>
              {t('overlays.notifications.empty_hint')}{' '}
              <button type="button" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                onClick={() => { props.onOpenCommunity?.(); props.onClose(); }}>
                Community
              </button>
            </div>
          </div>
        )}

        {items.map((n) => {
          const isFR = n.type === 'friend_request';
          const res = resolved[n.id] ?? null;
          const isUnread = !n.read_at && !res;

          return (
            <div
              key={n.id}
              role="button"
              tabIndex={0}
              onClick={() => handleClick(n)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(n); } }}
              className={`notif-row ${isUnread ? 'unread' : ''}`}
            >
              {/* Left: icon */}
              <NotifIcon type={n.type} />

              {/* Body */}
              <div style={{ minWidth: 0 }}>
                <NotifBody notif={n} />
                {isFR && (
                  <div style={{ marginBlockStart: 6 }}>
                    <FriendRequestActions notif={n} busy={busyId === n.id} onAccept={handleAccept} onDecline={handleDecline} resolved={res} />
                  </div>
                )}
              </div>

              {/* Trailing: timestamp + unread dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                {isUnread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'block' }} aria-label="Unread" />}
                <TimestampMono iso={n.created_at} />
              </div>
            </div>
          );
        })}
      </div>

    </OverlayShell>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────

function NotificationsContainer(props: {
  func: (value: boolean) => void;
  onOpenMessage: (actorProfileId: number) => void;
  onFriendsChanged?: () => void;
  onOpenCommunity?: () => void;
}) {
  const handleClose = () => props.func(false);

  return (
    <NotificationsCenter
      onClose={handleClose}
      onOpenMessage={props.onOpenMessage}
      onFriendsChanged={props.onFriendsChanged}
      onOpenCommunity={props.onOpenCommunity}
    />
  );
}

export default NotificationsContainer;
