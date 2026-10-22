import React, { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import Login from './screens/Login.jsx';
import CreateBand from './screens/CreateBand.jsx';
import Today from './screens/Today.jsx';
import Rehearse from './screens/Rehearse.jsx';
import Gigs from './screens/Gigs.jsx';
import Studio from './screens/Studio.jsx';
import Band from './screens/Band.jsx';
import Marquee from './components/Marquee.jsx';
import Modal from './components/Modal.jsx';

const TABS = [
  { id: 'today', label: 'Today', icon: '✅' },
  { id: 'rehearse', label: 'Rehearse', icon: '🥁' },
  { id: 'gigs', label: 'Gigs', icon: '🎟️' },
  { id: 'studio', label: 'Studio', icon: '💿' },
  { id: 'band', label: 'Band', icon: '🎸' },
];

export default function App() {
  const [config, setConfig] = useState(null);
  const [state, setState] = useState(null);
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [tab, setTab] = useState('today');
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [levelUp, setLevelUp] = useState(null);

  const notify = useCallback((text, kind = 'good') => {
    setToast({ text, kind, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    api('/api/config').then(setConfig).catch((e) => setError(e.message));
  }, []);

  const refresh = useCallback(async () => {
    try {
      setState(await api('/api/state'));
    } catch (e) {
      if (e.status === 401) setLoggedIn(false);
      else setError(e.message);
    }
  }, []);

  useEffect(() => { if (loggedIn) refresh(); }, [loggedIn, refresh]);

  // Refresh when the app comes back into view (new day, etc.)
  useEffect(() => {
    const onShow = () => { if (document.visibilityState === 'visible' && loggedIn) refresh(); };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, [loggedIn, refresh]);

  // Every action goes through here so the screen always shows the server's truth.
  const act = useCallback(async (path, body, method = 'POST') => {
    try {
      const prevTier = state?.band?.tier;
      const next = await api(path, { method, body });
      setState(next);
      if (next.band && prevTier !== undefined && next.band.tier > prevTier) setLevelUp(next.band);
      return next;
    } catch (e) {
      notify(e.message, 'bad');
      if (e.status === 401) setLoggedIn(false);
      return null;
    }
  }, [state, notify]);

  const logout = () => { setToken(null); setState(null); setLoggedIn(false); setTab('today'); };

  if (error && !config) {
    return (
      <div className="center-screen">
        <div className="panel">
          <h1 className="display">Headliner</h1>
          <p>{error}</p>
          <button className="btn primary" onClick={() => window.location.reload()}>Try again</button>
        </div>
      </div>
    );
  }
  if (!config) return <div className="center-screen"><p className="loading">Tuning up…</p></div>;

  if (!loggedIn) return <Login onDone={() => setLoggedIn(true)} />;
  if (!state) return <div className="center-screen"><p className="loading">Loading your band…</p></div>;

  if (!state.band) {
    return <CreateBand config={config} onCreate={(body) => act('/api/band', body)} onLogout={logout} />;
  }

  const genre = config.GENRES[state.band.genre];
  const props = { state, config, act, notify, refresh };

  return (
    <div className="app" style={{ '--genre': genre.color }}>
      <Marquee band={state.band} genre={genre} />
      <main className="screen">
        {tab === 'today' && <Today {...props} />}
        {tab === 'rehearse' && <Rehearse {...props} />}
        {tab === 'gigs' && <Gigs {...props} />}
        {tab === 'studio' && <Studio {...props} />}
        {tab === 'band' && <Band {...props} onLogout={logout} />}
      </main>
      <nav className="tabbar" aria-label="Main">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'on' : ''}`}
            onClick={() => { setTab(t.id); window.scrollTo(0, 0); }}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <span className="tab-icon" aria-hidden="true">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
      {toast && <div key={toast.id} className={`toast ${toast.kind}`} role="status">{toast.text}</div>}
      {levelUp && (
        <Modal onClose={() => setLevelUp(null)}>
          <div className="levelup">
            <div className="levelup-icon" aria-hidden="true">🏆</div>
            <h2 className="display">Level up!</h2>
            <p className="levelup-name">{levelUp.tierName}</p>
            <p>{levelUp.tierBlurb}</p>
            <p className="muted">New gigs are open on the Gigs tab.</p>
            <button className="btn primary" onClick={() => { setLevelUp(null); setTab('gigs'); }}>See new gigs</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
