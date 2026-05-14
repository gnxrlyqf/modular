import { useEffect, useState } from "react";
import { AnimatedContent } from './ReactBits/ReactBits';
import { CloseButton, useConfirm } from './Reusables';
import { authFetch, extractErrorMessage } from './api';
import logger from './logger';
import { t, useLanguage } from './i18n';

type ProjectRow = {
  id: string;
  name: string;
  config: Record<string, unknown> | null;
  updated_at: string | null;
  created_at: string | null;
};

type PublicProfileData = {
  id: number;
  username: string;
  display_name: string;
  bio: string;
  avatar: string | null;
  projects: ProjectRow[];
  is_friend: boolean;
  is_blocked_by_me: boolean;
};

const SYNTH_URL = (import.meta.env.VITE_SYNTHESIZER_URL as string | undefined) ?? 'http://localhost:5174';
import defaultProfileImg from './assets/default_profile.png';
const FALLBACK_AVATAR = defaultProfileImg;

function PublicProfile(props: {
  username: string;
  func: (value: boolean) => void;
  onMessage: (profileId: number) => void;
}) {
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockedByOther, setBlockedByOther] = useState(false);
  const [acting, setActing] = useState(false);
  const { confirm, node: confirmNode } = useConfirm();

  const load = async () => {
    setLoading(true);
    setError(null);
    setBlockedByOther(false);
    try {
      const res = await authFetch(`/api/users/profile/${encodeURIComponent(props.username)}/`);
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        if (body?.blocked) {
          setBlockedByOther(true);
          return;
        }
      }
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, 'Failed to load profile.'));
      }
      const body: PublicProfileData = await res.json();
      setData(body);
      logger.action('public_profile.view', { username: body.username });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [props.username]);

  const block = async () => {
    if (!data || acting) return;
    const ok = await confirm({
      title: t('profile.block_title'),
      message: t('profile.block_message'),
      confirmText: t('profile.block'),
      danger: true,
    });
    if (!ok) return;
    setActing(true);
    try {
      await authFetch('/api/users/social/friendships/block/', {
        method: 'POST',
        body: JSON.stringify({ profile_id: data.id }),
      });
      logger.action('user.blocked', { profile_id: data.id });
      load();
    } finally {
      setActing(false);
    }
  };

  const unblock = async () => {
    if (!data || acting) return;
    setActing(true);
    try {
      await authFetch('/api/users/social/friendships/unblock/', {
        method: 'POST',
        body: JSON.stringify({ profile_id: data.id }),
      });
      logger.action('user.unblocked', { profile_id: data.id });
      load();
    } finally {
      setActing(false);
    }
  };

  const handleFork = (project: ProjectRow) => {
    const scene = project.config ?? { camera: { x: 0, y: 0 }, modules: [], cables: [] };
    const bytes = new TextEncoder().encode(JSON.stringify(scene));
    const encoded = btoa(String.fromCharCode(...bytes));
    logger.action('project.fork', { source_id: project.id });
    window.open(`${SYNTH_URL}?fork_config=${encoded}`, '_blank', 'noreferrer');
  };

  if (blockedByOther) {
    return (
      <div className="font-lexend overlay-panel rounded-2xl z-50 w-full max-w-[28rem] mx-3 sm:mx-auto">
        <div className="flex items-center justify-end px-4 pt-4 pb-0">
          <CloseButton onClick={() => props.func(false)} />
        </div>
        <div className="px-6 py-8 text-center">
          <p className="text-red-300/90 text-sm font-medium">{t('profile.blocked_by')}</p>
          <p className="text-indigo-300/50 text-xs mt-2">{t('profile.blocked_by_desc')}</p>
        </div>
        {confirmNode}
      </div>
    );
  }

  return (
    <div className="font-lexend overlay-panel rounded-2xl z-50 w-full max-w-[60rem] mx-3 sm:mx-auto">
      <div className="flex items-center justify-end px-4 pt-4 pb-0">
        <CloseButton onClick={() => props.func(false)} />
      </div>

      {loading && (
        <div className="px-6 py-8 text-indigo-300/50 text-sm text-center font-light">{t('common.loading')}</div>
      )}
      {!loading && error && (
        <div className="px-6 pb-4 text-red-300/80 text-sm">{error}</div>
      )}

      {!loading && !error && data && (
        <>
          <div className="px-4 sm:px-6 py-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-5 text-center sm:text-left">
              <img
                src={data.avatar ?? FALLBACK_AVATAR}
                alt={data.display_name || data.username}
                className="w-20 h-20 rounded-full object-cover avatar-ring shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight truncate">
                  {data.display_name || data.username}
                </h2>
                <p className="text-sm text-indigo-300/60 mt-0.5">@{data.username}</p>
              </div>
              <div className="flex items-center gap-2">
                {data.is_friend && (
                  <button
                    type="button"
                    onClick={() => props.onMessage(data.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium tracking-wide cursor-pointer bg-indigo-500/25 hover:bg-indigo-500/40 border border-indigo-400/40 text-white"
                  >
                    {t('profile.message')}
                  </button>
                )}
                {data.is_blocked_by_me ? (
                  <button
                    type="button"
                    onClick={unblock}
                    disabled={acting}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium tracking-wide cursor-pointer bg-white/5 hover:bg-white/10 border border-white/15 text-indigo-200 disabled:opacity-50"
                  >
                    {t('profile.unblock')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={block}
                    disabled={acting}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium tracking-wide cursor-pointer bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 text-red-200 disabled:opacity-50"
                  >
                    {t('profile.block')}
                  </button>
                )}
              </div>
            </div>
            {data.bio && (
              <p className="mt-4 text-indigo-100/80 text-sm leading-relaxed">{data.bio}</p>
            )}
          </div>

          <div className="divider-glow mx-4" />
          {confirmNode}

          <div className="px-4 sm:px-6 py-5">
            <h3 className="text-sm font-semibold text-indigo-200 mb-3 tracking-wide">
              {t('profile.projects')}
            </h3>
            {data.projects.length === 0 ? (
              <p className="text-indigo-300/40 text-xs">{t('common.coming_soon')}</p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.projects.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => handleFork(p)}
                      className="user-row w-full text-left px-3 py-2 rounded-lg bg-white/3 border border-white/8 hover:bg-white/6 transition-colors cursor-pointer"
                    >
                      <p className="truncate text-sm text-indigo-100">{p.name}</p>
                      {p.updated_at && (
                        <p className="text-[10px] text-indigo-300/40">
                          {t('profile.updated')} {new Date(p.updated_at).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-[10px] text-indigo-400/40 mt-0.5">{t('profile.open_copy')}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PublicProfileContainer(props: {
  username: string;
  func: (value: boolean) => void;
  onMessage: (profileId: number) => void;
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
        <PublicProfile
          username={props.username}
          func={() => setVisible(false)}
          onMessage={props.onMessage}
        />
      </AnimatedContent>
    </AnimatedContent>
  );
}

export default PublicProfileContainer;
