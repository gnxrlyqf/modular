import { useCallback, useEffect, useState } from "react";
import { AnimatedContent } from './ReactBits/ReactBits';
import { CloseButton } from './Reusables';
import { authFetch } from './api';
import logger from './logger';
import { t, useLanguage } from './i18n';

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

const FALLBACK_AVATAR = "https://picsum.photos/120/120";

function relTime(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const dd = Math.floor(h / 24);
  return `${dd}d`;
}

function notifText(n: Notification): string {
  const who = n.actor_display_name || n.actor_username;
  if (n.type === 'message') return `${who} ${t('notif.action.message')}`;
  return `${who} ${t('notif.action.friend_request')}`;
}

function FriendRequestActions(props: {
  notif: Notification;
  busy: boolean;
  onAccept: (n: Notification) => void;
  onDecline: (n: Notification) => void;
  resolved: 'accepted' | 'declined' | null;
}) {
  if (props.resolved === 'accepted') {
    return <span className="text-[10px] text-green-300/80 italic">{t('notif.accepted')}</span>;
  }
  if (props.resolved === 'declined') {
    return <span className="text-[10px] text-zinc-400 italic">{t('notif.declined')}</span>;
  }
  if (props.notif.read_at !== null) {
    // Acted upon in a previous session — don't re-show buttons.
    return null;
  }
  if (props.notif.related_id == null) {
    return <span className="text-[10px] text-indigo-300/30 italic">{t('notif.expired')}</span>;
  }
  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled={props.busy}
        onClick={() => props.onAccept(props.notif)}
        className="rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide cursor-pointer bg-green-500/15 hover:bg-green-500/30 border border-green-400/30 text-green-100 disabled:opacity-50"
      >
        {t('notif.accept')}
      </button>
      <button
        type="button"
        disabled={props.busy}
        onClick={() => props.onDecline(props.notif)}
        className="rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide cursor-pointer bg-white/5 hover:bg-white/10 border border-white/15 text-indigo-200 disabled:opacity-50"
      >
        {t('notif.decline')}
      </button>
    </div>
  );
}

function NotificationsList(props: {
  items: Notification[];
  busyId: number | null;
  resolved: Record<number, 'accepted' | 'declined'>;
  onItemClick: (n: Notification) => void;
  onAccept: (n: Notification) => void;
  onDecline: (n: Notification) => void;
}) {
  if (props.items.length === 0) {
    return <p className="text-indigo-300/40 py-8 text-center text-xs">{t('common.coming_soon')}</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      {props.items.map((n) => {
        const isFR = n.type === 'friend_request';
        const resolved = props.resolved[n.id] ?? null;
        return (
          <div
            key={n.id}
            role="button"
            tabIndex={0}
            onClick={() => props.onItemClick(n)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                props.onItemClick(n);
              }
            }}
            className={`flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors hover:bg-white/5 cursor-pointer ${
              n.read_at ? '' : 'bg-indigo-500/8 border border-indigo-400/15'
            }`}
          >
            <img
              src={n.actor_avatar ?? FALLBACK_AVATAR}
              alt={n.actor_username}
              className="size-8 shrink-0 rounded-full object-cover border border-white/10"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-indigo-100">{notifText(n)}</p>
              <p className="truncate text-[11px] text-indigo-300/40">{relTime(n.created_at)} {t('common.ago')}</p>
            </div>
            {isFR ? (
              <FriendRequestActions
                notif={n}
                busy={props.busyId === n.id}
                onAccept={props.onAccept}
                onDecline={props.onDecline}
                resolved={resolved}
              />
            ) : !n.read_at ? (
              <span className="size-2 rounded-full bg-indigo-400" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function NotificationsCenter(props: {
  func: (value: boolean) => void;
  onOpenMessage: (actorProfileId: number) => void;
  onFriendsChanged?: () => void;
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
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
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
      props.func(false);
    }
    // friend_request: do nothing on row click — actions are inline.
  };

  const handleAccept = async (n: Notification) => {
    if (n.related_id == null || busyId != null) return;
    setBusyId(n.id);
    try {
      const res = await authFetch(`/api/users/social/friendships/${n.related_id}/accept/`, {
        method: 'POST',
      });
      if (res.ok) {
        logger.action('friend.accept_from_notif', { friendship: n.related_id });
        setResolved((r) => ({ ...r, [n.id]: 'accepted' }));
        // Mark this notification read so the badge clears.
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
      // Use the explicit decline action so the FE intent is recorded; it
      // deletes the underlying Friendship row server-side.
      const res = await authFetch(`/api/users/social/friendships/${n.related_id}/decline/`, {
        method: 'POST',
      });
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

  return (
    <div className="font-lexend overlay-panel rounded-2xl z-50 w-full max-w-[28rem] mx-3 sm:mx-auto">
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-wide">
          {t('nav.notifications')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={markAllRead}
            className="rounded-lg px-2 py-1 text-[11px] font-medium tracking-wide cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-200"
          >
            {t('notif.mark_all_read')}
          </button>
          <CloseButton onClick={() => props.func(false)} />
        </div>
      </div>
      <div className="px-3 sm:px-4 pb-4 max-h-[28rem] overflow-y-auto">
        {loading && items.length === 0 ? (
          <p className="text-indigo-300/40 py-6 text-center text-xs">{t('common.loading')}</p>
        ) : (
          <NotificationsList
            items={items}
            busyId={busyId}
            resolved={resolved}
            onItemClick={handleClick}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        )}
      </div>
    </div>
  );
}

function NotificationsContainer(props: {
  func: (value: boolean) => void;
  onOpenMessage: (actorProfileId: number) => void;
  onFriendsChanged?: () => void;
}) {
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
      disappearDuration={0.25}
      onDisappearanceComplete={() => props.func(false)}
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
        <NotificationsCenter
          func={() => setVisible(false)}
          onOpenMessage={props.onOpenMessage}
          onFriendsChanged={props.onFriendsChanged}
        />
      </AnimatedContent>
    </AnimatedContent>
  );
}

export default NotificationsContainer;
