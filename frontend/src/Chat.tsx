import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatedContent } from './ReactBits/ReactBits';
import { CloseButton, Input, useConfirm } from './Reusables';
import { authFetch, extractErrorMessage } from './api';
import logger from './logger';
import { t, useLanguage } from './i18n';

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

function OnlineDot() {
  return (
    <span className="online-dot absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400" />
  );
}

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

function ThreadList(props: {
  threads: Thread[];
  activeId: number | null;
  onSelect: (t: Thread) => void;
  onNew: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={props.onNew}
        className="rounded-lg px-3 py-2 text-xs font-medium tracking-wide cursor-pointer bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-indigo-100 flex items-center gap-2"
      >
        <span className="size-4 rounded-full bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-[11px]">+</span>
        {t('chat.new_conversation')}
      </button>
      {props.loading && props.threads.length === 0 && (
        <p className="text-indigo-300/40 py-4 text-center text-xs">{t('common.loading')}</p>
      )}
      {!props.loading && props.threads.length === 0 && (
        <p className="text-indigo-300/40 py-4 text-center text-xs">
          {t('common.coming_soon')}
        </p>
      )}
      {props.threads.map((t) => (
        <button
          key={t.profile_id}
          type="button"
          onClick={() => props.onSelect(t)}
          className={`user-row flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2.5 text-left rounded-lg transition-colors ${
            props.activeId === t.profile_id ? 'bg-indigo-500/15 border border-indigo-400/25' : 'hover:bg-white/5'
          }`}
        >
          <div className="relative shrink-0">
            <img
              src={t.avatar ?? FALLBACK_AVATAR}
              alt={t.username}
              className="w-9 h-9 rounded-full object-cover"
            />
            {t.is_online && <OnlineDot />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-indigo-100">
                {t.display_name || t.username}
              </p>
              {t.unread > 0 && (
                <span className="rounded-full bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 font-semibold">
                  {t.unread}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-indigo-300/40">{t.last_message}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function MessageList(props: { messages: Message[]; myProfileId: number | null }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [props.messages.length]);

  if (props.messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-indigo-300/40 text-xs">
        {t('common.coming_soon')}
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-3 py-3">
      {props.messages.map((m) => {
        const mine = props.myProfileId != null && m.sender === props.myProfileId;
        return (
          <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-xl px-3 py-2 max-w-[75%] text-sm break-words ${
              mine
                ? 'bg-indigo-500/40 text-white border border-indigo-400/40'
                : 'bg-white/8 text-indigo-100 border border-white/10'
            }`}>
              {m.content}
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

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
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <button
          type="button"
          onClick={props.onCancel}
          className="rounded-lg px-2 py-1 text-[11px] font-medium tracking-wide cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-200"
        >
          ←
        </button>
        <p className="text-sm font-medium text-indigo-100">{t('chat.new_conversation')}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading ? (
          <p className="text-indigo-300/40 py-6 text-center text-xs">{t('common.loading')}</p>
        ) : eligible.length === 0 ? (
          <p className="text-indigo-300/40 py-6 text-center text-xs">
            {friends.length === 0
              ? t('chat.no_friends')
              : t('chat.all_conversations_open')}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {eligible.map((f) => (
              <button
                key={f.profile_id}
                type="button"
                onClick={() => props.onPick(f)}
                className="user-row flex items-center gap-3 px-2 py-2 text-left rounded-lg hover:bg-white/5"
              >
                <div className="relative shrink-0">
                  <img
                    src={f.avatar ?? FALLBACK_AVATAR}
                    alt={f.username}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  {f.is_online && <OnlineDot />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-indigo-100">{f.display_name || f.username}</p>
                  <p className="truncate text-[11px] text-indigo-300/40">@{f.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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

  const load = useCallback(async () => {
    try {
      const res = await authFetch(`/api/users/social/messages/?with=${props.thread.profile_id}`);
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        setAccessError(data?.error ?? 'Conversation unavailable.');
        return;
      }
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, 'Failed to load messages.'));
      }
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
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
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
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, 'Could not send message.'));
      }
      logger.action('chat.message_sent', { receiver: props.thread.profile_id });
      setInput('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-white/5">
        <div className="relative shrink-0">
          <img
            src={props.thread.avatar ?? FALLBACK_AVATAR}
            alt={props.thread.username}
            className="w-8 h-8 rounded-full object-cover"
          />
          {props.thread.is_online && <OnlineDot />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-indigo-100">
            {props.thread.display_name || props.thread.username}
          </p>
          <p className="truncate text-[10px] text-indigo-300/40">
            {props.thread.is_online
              ? <span className="text-green-400/80">online</span>
              : `@${props.thread.username}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => props.onViewProfile(props.thread.username)}
          className="rounded-lg px-2 py-1 text-[11px] font-medium tracking-wide cursor-pointer bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-400/25 text-indigo-200"
        >
          {t('chat.view_profile')}
        </button>
        <button
          type="button"
          onClick={() => props.onBlock(props.thread.profile_id)}
          className="rounded-lg px-2 py-1 text-[11px] font-medium tracking-wide cursor-pointer bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 text-red-200"
        >
          {t('chat.block')}
        </button>
      </div>

      {accessError ? (
        <div className="flex-1 flex items-center justify-center px-4 text-center text-sm text-red-300/80">
          {accessError}
        </div>
      ) : (
        <MessageList messages={messages} myProfileId={props.myProfileId} />
      )}

      {!accessError && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-white/5">
          <Input
            placeholder={t('chat.type_message')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            className="rounded-lg px-3 py-2 text-xs font-medium tracking-wide cursor-pointer bg-indigo-500/25 hover:bg-indigo-500/40 border border-indigo-400/40 text-white disabled:opacity-50"
          >
            {t('chat.send')}
          </button>
        </div>
      )}

      {error && <p className="px-3 py-1 text-[11px] text-red-300/80">{error}</p>}
    </div>
  );
}

function Chat(props: {
  func: (value: boolean) => void;
  initialThreadId?: number | null;
  onViewProfile: (username: string) => void;
}) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<Thread | null>(null);
  const [composing, setComposing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [myProfileId, setMyProfileId] = useState<number | null>(null);
  const { confirm, node: confirmNode } = useConfirm();
  const autoSelectedRef = useRef(false);
  const initialThreadConsumedRef = useRef(false);

  // Refresh tick: keep the threads list current. Does NOT change the user's
  // current selection — only updates the unread/last_message of the active
  // thread in place. Selection logic lives in the seed effect below.
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

  // One-shot seed on mount. Decides the initial active thread:
  //  1. If initialThreadId is provided AND a thread with that id exists →
  //     open that thread directly.
  //  2. If initialThreadId is provided but no thread exists yet (the user
  //     hit "Message" from search/profile and has never messaged this
  //     friend) → synthesize a placeholder Thread from the friends list so
  //     the conversation pane opens immediately.
  //  3. Otherwise → auto-select the most recent thread.
  //  4. If there are no threads at all → drop into compose-new picker.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      authFetch('/api/users/me/')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (!cancelled && d?.profile_id != null) setMyProfileId(d.profile_id); })
        .catch(() => {});

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
          // No prior conversation — pull the friend's data so we can render
          // ChatPane straight away with an empty message list.
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

  // Keep threads + active thread metadata fresh after the initial seed.
  useEffect(() => {
    if (!seeded) return;
    const t = setInterval(refreshThreads, 4000);
    return () => clearInterval(t);
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
    initialThreadConsumedRef.current = true;
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
    <div className="font-lexend overlay-panel rounded-2xl z-50 w-full max-w-[60rem] mx-3 sm:mx-auto">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-wide">
          {t('chat.title')}
        </h2>
        <CloseButton onClick={() => props.func(false)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[260px_1fr] gap-0 sm:gap-4 px-3 sm:px-4 pb-4 h-[28rem]">
        <div className="overflow-y-auto border-b sm:border-b-0 sm:border-r border-white/5 pb-2 sm:pb-0 sm:pr-2">
          <ThreadList
            threads={threads}
            activeId={active?.profile_id ?? null}
            onSelect={(t) => { setActive(t); setComposing(false); }}
            onNew={() => { setActive(null); setComposing(true); }}
            loading={loading}
          />
        </div>
        <div className="min-h-0">
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
            <div className="flex h-full items-center justify-center text-indigo-300/40 text-xs">
              {t('chat.select_or_start')}
            </div>
          )}
        </div>
      </div>
      {confirmNode}
    </div>
  );
}

function ChatContainer(props: {
  func: (value: boolean) => void;
  initialThreadId?: number | null;
  onViewProfile: (username: string) => void;
}) {
  useLanguage();
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
        <Chat
          func={() => setVisible(false)}
          initialThreadId={props.initialThreadId}
          onViewProfile={props.onViewProfile}
        />
      </AnimatedContent>
    </AnimatedContent>
  );
}

export default ChatContainer;
export { Chat };
