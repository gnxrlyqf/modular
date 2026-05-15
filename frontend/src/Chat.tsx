import { useCallback, useEffect, useRef, useState } from "react";
import { useConfirm } from './Reusables';
import { authFetch, extractErrorMessage } from './api';
import logger from './logger';
import { t, useLanguage } from './i18n';
import OverlayShell from './OverlayShell';
import { AvatarRing, PillButton, TimestampMono } from './OverlayParts';

// ─── Types ────────────────────────────────────────────────────────────────────

type Thread = {
  profile_id: number;
  username: string;
  display_name: string;
  avatar: string | null;
  last_message: string;
  last_at: string;
  unread: number;
  is_online?: boolean;
};

type FriendRow = {
  profile_id: number;
  username: string;
  display_name: string;
  avatar: string | null;
  is_online?: boolean;
};

type Message = {
  id: number;
  sender: number;
  receiver: number;
  sender_username: string;
  receiver_username: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

import defaultProfileImg from './assets/default_profile.png';
const FALLBACK_AVATAR = defaultProfileImg;

// ─── Thread list ──────────────────────────────────────────────────────────────

type ConvFilter = 'all' | 'unread';

function ThreadList(props: {
  threads: Thread[];
  activeId: number | null;
  onSelect: (t: Thread) => void;
  onNew: () => void;
  loading: boolean;
}) {
  const [filter, setFilter] = useState<ConvFilter>('all');
  const [searchQ, setSearchQ] = useState('');

  const FILTERS: Array<{ id: ConvFilter; label: string }> = [
    { id: 'all',    label: t('overlays.messaging.filter.all') },
    { id: 'unread', label: t('overlays.messaging.filter.unread') },
  ];

  const visible = props.threads.filter((th) => {
    if (filter === 'unread' && th.unread === 0) return false;
    if (searchQ && !th.username.toLowerCase().includes(searchQ.toLowerCase()) && !th.display_name.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Filter tabs */}
      <div style={{ padding: '10px 12px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={`tab-btn ${filter === f.id ? 'active' : ''}`} style={{ fontSize: 10, padding: '3px 10px' }} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '0 12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--panel-inner)', border: '1px solid var(--panel-edge)', borderRadius: 'var(--radius-sm)', padding: '6px 10px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sub)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="search"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder={t('overlays.messaging.search_placeholder')}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text)' }}
          />
        </div>
      </div>

      {/* New conversation button */}
      <div style={{ padding: '0 12px 8px' }}>
        <button type="button" onClick={props.onNew}
          style={{ width: '100%', padding: '7px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', textAlign: 'start', letterSpacing: '0.05em' }}>
          {t('overlays.messaging.new')}
        </button>
      </div>

      {/* Thread list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
        {props.loading && visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub-dim)' }}>{t('common.loading')}</div>
        )}
        {!props.loading && visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub-dim)' }}>{t('common.coming_soon')}</div>
        )}
        {visible.map((th) => (
          <button
            key={th.profile_id}
            type="button"
            onClick={() => props.onSelect(th)}
            className={`conv-row ${props.activeId === th.profile_id ? 'active' : ''}`}
          >
            {/* Avatar — static ring (no rotation on list) */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <AvatarRing src={th.avatar} alt={th.display_name || th.username} size={44} static />
              {th.is_online && (
                <span style={{ position: 'absolute', insetBlockEnd: 0, insetInlineEnd: 0, width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--panel)' }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBlockEnd: 2 }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text)', fontWeight: th.unread > 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {th.display_name || th.username}
                </span>
                <TimestampMono iso={th.last_at} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{th.last_message}</span>
                {th.unread > 0 && (
                  <span style={{ background: 'var(--accent)', color: 'var(--on-accent)', fontFamily: 'var(--font-mono)', fontSize: 10, padding: '1px 6px', borderRadius: 'var(--radius-pill)', flexShrink: 0, marginInlineStart: 4 }}>{th.unread}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Message list ─────────────────────────────────────────────────────────────

function MessageList(props: { messages: Message[]; myProfileId: number | null }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [props.messages.length]);

  if (props.messages.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '32px 20px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, color: 'var(--text-mute)' }}>{t('overlays.messaging.empty_thread')}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub-dim)' }}>{t('overlays.messaging.empty_thread_hint')}</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 20px' }}>
      {props.messages.map((m) => {
        const mine = props.myProfileId != null && m.sender === props.myProfileId;
        return (
          <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
            <div className={mine ? 'bubble-mine' : 'bubble-theirs'}>{m.content}</div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

// ─── New conversation picker ──────────────────────────────────────────────────

function NewConversationPicker(props: {
  excludeIds: Set<number>;
  onPick: (friend: FriendRow) => void;
  onCancel: () => void;
}) {
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch('/api/users/social/friendships/friends-list/');
        if (!res.ok) return;
        const data: FriendRow[] = await res.json();
        if (cancelled) return;
        setFriends(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const eligible = friends.filter((f) => !props.excludeIds.has(f.profile_id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--panel-edge)' }}>
        <button type="button" onClick={props.onCancel} className="pill-btn pill-btn--outline" style={{ padding: '4px 10px', fontSize: 12 }}>←</button>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text)' }}>{t('chat.new_conversation')}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub-dim)' }}>{t('common.loading')}</div>
        ) : eligible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sub-dim)' }}>
            {friends.length === 0 ? t('chat.no_friends') : t('chat.all_conversations_open')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {eligible.map((f) => (
              <button key={f.profile_id} type="button" onClick={() => props.onPick(f)}
                className="conv-row" style={{ border: '1px solid transparent' }}>
                <AvatarRing src={f.avatar} alt={f.display_name || f.username} size={40} static />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)' }}>{f.display_name || f.username}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub)' }}>@{f.username}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chat pane ────────────────────────────────────────────────────────────────

function ChatPane(props: {
  thread: Thread;
  myProfileId: number | null;
  onClosed: () => void;
  onBlock: (profileId: number) => void;
  onViewProfile: (username: string) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [composeFocused, setComposeFocused] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await authFetch(`/api/users/social/messages/?with=${props.thread.profile_id}`);
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        setAccessError(data?.error ?? 'Conversation unavailable.');
        return;
      }
      if (!res.ok) throw new Error(await extractErrorMessage(res, 'Failed to load messages.'));
      const data = await res.json();
      const list: Message[] = Array.isArray(data) ? data : (data.results ?? []);
      setMessages(list);
      setAccessError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages.');
    }
  }, [props.thread.profile_id]);

  useEffect(() => {
    load();
    const tick = setInterval(load, 3000);
    return () => clearInterval(tick);
  }, [load]);

  const send = async () => {
    const v = input.trim();
    if (!v || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await authFetch('/api/users/social/messages/', {
        method: 'POST',
        body: JSON.stringify({ receiver: props.thread.profile_id, content: v }),
      });
      if (!res.ok) throw new Error(await extractErrorMessage(res, 'Could not send message.'));
      logger.action('chat.message_sent', { receiver: props.thread.profile_id });
      setInput('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send.');
    } finally {
      setSending(false);
    }
  };

  const displayName = props.thread.display_name || props.thread.username;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Thread header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--panel-edge)', flexShrink: 0 }}>
        <AvatarRing src={props.thread.avatar} alt={displayName} size={36} static />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{displayName}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub-dim)' }}>
            {props.thread.is_online ? <span style={{ color: 'var(--success)' }}>online</span> : `@${props.thread.username}`}
          </div>
        </div>
        <button type="button" onClick={() => props.onViewProfile(props.thread.username)} className="pill-btn pill-btn--outline" style={{ fontSize: 11, padding: '4px 10px' }}>{t('chat.view_profile')}</button>
        <button type="button" onClick={() => props.onBlock(props.thread.profile_id)} className="pill-btn pill-btn--danger" style={{ fontSize: 11, padding: '4px 10px' }}>{t('chat.block')}</button>
      </div>

      {/* Messages */}
      {accessError ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', fontSize: 13, padding: '20px' }}>{accessError}</div>
      ) : (
        <MessageList messages={messages} myProfileId={props.myProfileId} />
      )}

      {/* Compose bar */}
      {!accessError && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--panel-edge)', flexShrink: 0 }}>
          {composeFocused && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--sub-dim)', marginBlockEnd: 4, letterSpacing: '0.05em' }}>
              {t('overlays.messaging.compose_hint')}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: 'var(--panel-inner)', border: '1px solid var(--panel-edge)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setComposeFocused(true)}
              onBlur={() => setComposeFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder={t('overlays.messaging.compose_placeholder')}
              rows={1}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none', overflow: 'hidden',
                fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)',
                minHeight: '1.5em', maxHeight: '7em',
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${el.scrollHeight}px`;
              }}
            />
            <PillButton variant="solid" onClick={send} disabled={sending || !input.trim()}>
              {t('overlays.messaging.send')} <span className="rtl-flip" aria-hidden="true">▸</span>
            </PillButton>
          </div>
          {error && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--danger)', marginBlockStart: 4 }}>{error}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Chat main component ──────────────────────────────────────────────────────

function Chat(props: {
  onClose: () => void;
  initialThreadId?: number | null;
  onViewProfile: (username: string) => void;
}) {
  useLanguage();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<Thread | null>(null);
  const [composing, setComposing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [myProfileId, setMyProfileId] = useState<number | null>(null);
  const { confirm, node: confirmNode } = useConfirm();
  const autoSelectedRef = useRef(false);

  const refreshThreads = useCallback(async () => {
    try {
      const res = await authFetch('/api/users/social/messages/threads/');
      if (!res.ok) return;
      const data: Thread[] = await res.json();
      setThreads(data);
      setActive((cur) => {
        if (!cur) return cur;
        return data.find((t) => t.profile_id === cur.profile_id) ?? cur;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      authFetch('/api/users/me/').then(r => r.ok ? r.json() : null).then(d => {
        if (!cancelled && d?.profile_id != null) setMyProfileId(d.profile_id);
      }).catch(() => {});

      let threadList: Thread[] = [];
      try {
        const tres = await authFetch('/api/users/social/messages/threads/');
        if (tres.ok) threadList = await tres.json();
      } catch { /* ignore */ }
      if (cancelled) return;
      setThreads(threadList);

      const id = props.initialThreadId;
      if (id != null) {
        const found = threadList.find((t) => t.profile_id === id);
        if (found) {
          setActive(found);
        } else {
          try {
            const fres = await authFetch('/api/users/social/friendships/friends-list/');
            if (fres.ok) {
              const friends: FriendRow[] = await fres.json();
              if (cancelled) return;
              const friend = friends.find((f) => f.profile_id === id);
              if (friend) {
                setActive({
                  profile_id: friend.profile_id,
                  username: friend.username,
                  display_name: friend.display_name,
                  avatar: friend.avatar,
                  last_message: '',
                  last_at: new Date().toISOString(),
                  unread: 0,
                });
              }
            }
          } catch { /* ignore */ }
        }
      } else if (threadList.length > 0) {
        setActive(threadList[0]);
      } else {
        setComposing(true);
      }

      setLoading(false);
      setSeeded(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!seeded) return;
    const tick = setInterval(refreshThreads, 4000);
    return () => clearInterval(tick);
  }, [seeded, refreshThreads]);

  const startConversationWith = (friend: FriendRow) => {
    const placeholder: Thread = {
      profile_id: friend.profile_id,
      username: friend.username,
      display_name: friend.display_name,
      avatar: friend.avatar,
      last_message: '',
      last_at: new Date().toISOString(),
      unread: 0,
    };
    setActive(threads.find((t) => t.profile_id === friend.profile_id) ?? placeholder);
    setComposing(false);
    autoSelectedRef.current = true;
  };

  const handleBlock = async (profileId: number) => {
    const ok = await confirm({
      title: t('chat.block_title'),
      message: t('chat.block_message'),
      confirmText: t('chat.block'),
      danger: true,
    });
    if (!ok) return;
    const res = await authFetch('/api/users/social/friendships/block/', {
      method: 'POST',
      body: JSON.stringify({ profile_id: profileId }),
    });
    if (res.ok) {
      logger.action('user.blocked', { profile_id: profileId });
      setActive(null);
      refreshThreads();
    }
  };

  return (
    <OverlayShell
      kicker={t('overlays.messaging.kicker')}
      title={t('chat.title')}
      headerRight={<PillButton variant="outline" onClick={() => { setActive(null); setComposing(true); }}>{t('overlays.messaging.new')}</PillButton>}
      width={1120}
      maxHeight="92vh"
      onClose={props.onClose}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: 600, minHeight: 0 }}>
        {/* Thread list */}
        <div style={{ borderInlineEnd: '1px solid var(--panel-edge)', minHeight: 0, overflowY: 'auto' }}>
          <ThreadList
            threads={threads}
            activeId={active?.profile_id ?? null}
            onSelect={(th) => { setActive(th); setComposing(false); }}
            onNew={() => { setActive(null); setComposing(true); }}
            loading={loading}
          />
        </div>

        {/* Thread view */}
        <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {composing ? (
            <NewConversationPicker
              excludeIds={new Set(threads.map((t) => t.profile_id))}
              onPick={startConversationWith}
              onCancel={() => setComposing(false)}
            />
          ) : active ? (
            <ChatPane
              thread={active}
              myProfileId={myProfileId}
              onClosed={() => setActive(null)}
              onBlock={handleBlock}
              onViewProfile={props.onViewProfile}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, color: 'var(--text-mute)' }}>
              {t('chat.select_or_start')}
            </div>
          )}
        </div>
      </div>
      {confirmNode}
    </OverlayShell>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────

function ChatContainer(props: {
  func: (value: boolean) => void;
  initialThreadId?: number | null;
  onViewProfile: (username: string) => void;
}) {
  useLanguage();
  const handleClose = () => props.func(false);

  return (
    <Chat
      onClose={handleClose}
      initialThreadId={props.initialThreadId}
      onViewProfile={props.onViewProfile}
    />
  );
}

export default ChatContainer;
export { Chat };
