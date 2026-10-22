import React, { useState } from 'react';
import { api, setToken } from '../api.js';

export default function Login({ onDone }) {
  const [mode, setMode] = useState('signup');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [parentPin, setParentPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const body = mode === 'signup' ? { username, pin, parentPin } : { username, pin };
      const { token } = await api(`/api/auth/${mode}`, { method: 'POST', body });
      setToken(token);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-screen login">
      <div className="login-hero">
        <p className="login-kicker">From the garage to the world tour</p>
        <h1 className="display login-title">Headliner</h1>
        <p className="login-sub">Do your daily tasks. Your band gets better. Play bigger gigs. Become a legend.</p>
      </div>
      <form className="panel login-form" onSubmit={submit}>
        <div className="seg" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>New player</button>
          <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>I have a band</button>
        </div>
        <label>Player name
          <input value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} autoComplete="username" autoCapitalize="none" placeholder="e.g. gavin" required />
        </label>
        <label>PIN (4 to 8 numbers)
          <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} inputMode="numeric" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} maxLength={8} required />
        </label>
        {mode === 'signup' && (
          <label>Parent PIN (optional)
            <input value={parentPin} onChange={(e) => setParentPin(e.target.value.replace(/\D/g, ''))} inputMode="numeric" type="password" autoComplete="off" maxLength={8} />
            <span className="hint">A grown-up uses this to change tasks and the daily goal.</span>
          </label>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn primary big" disabled={busy}>{busy ? 'One sec…' : mode === 'signup' ? 'Start my band' : 'Log in'}</button>
      </form>
    </div>
  );
}
