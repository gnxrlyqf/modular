import { useEffect, useState } from 'react';
import { AnimatedContent } from './ReactBits/ReactBits';
import { authFetch } from './api';
import { CloseButton } from './Reusables';
import logger from './logger';

function Dashboard(props: { close: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await authFetch('/api/users/dashboard-token/');
        if (!r.ok) throw new Error('Dashboard unavailable. Try again shortly.');
        const data = await r.json() as { url: string };
        if (!cancelled) setUrl(data.url);
      } catch (err) {
        if (!cancelled) {
          logger.error('dashboard.token_fetch_failed');
          setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="font-lexend overlay-panel rounded-2xl z-50 w-full max-w-[78rem] mx-3 sm:mx-auto">
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent tracking-wide">
            Analytics
          </h2>
          <p className="text-xs text-indigo-300/50 mt-0.5 font-light">
            Personal usage, sessions, and patch performance. Click a day in the
            <span className="text-indigo-300/80"> Active Days </span> bar to filter.
          </p>
        </div>
        <CloseButton onClick={props.close} />
      </div>

      <div className="divider-glow mx-4 mt-4" />

      <div className="px-3 sm:px-5 py-5">
        {loading && (
          <div className="px-6 py-16 text-indigo-300/50 text-sm text-center font-light">
            Loading analytics…
          </div>
        )}
        {!loading && error && (
          <div className="px-6 py-12 text-center">
            <p className="text-red-300/80 text-sm">{error}</p>
            <p className="text-xs text-indigo-300/40 mt-2 font-light">
              The Metabase service may still be provisioning on first deploy.
            </p>
          </div>
        )}
        {!loading && !error && url && (
          <div className="rounded-xl overflow-hidden border border-white/10 glow-indigo bg-[#08102a]/60">
            {/*
              Fixed tall height so all 24 dashboard rows fit without the embedded
              Metabase needing to scroll internally — its scrollbar is cross-origin
              and cannot be styled away. The outer overlay-panel scrolls instead,
              using the site's existing thin webkit scrollbar.
            */}
            <iframe
              src={url}
              title="Analytics dashboard"
              scrolling="no"
              allow="downloads"
              className="w-full block"
              style={{ height: 2400, border: 0, background: 'transparent' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardContainer(props: { func: (v: boolean) => void }) {
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
        <Dashboard close={() => setVisible(false)} />
      </AnimatedContent>
    </AnimatedContent>
  );
}
