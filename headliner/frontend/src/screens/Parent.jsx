import React, { useCallback, useState } from 'react';
import Modal from '../components/Modal.jsx';
import { api } from '../api.js';

const EMPTY = { title: '', icon: '⭐', category: 'Other', stat: 'skill', amount: 5 };

export default function Parent({ hasPin, config, onClose }) {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState(EMPTY);
  const [goal, setGoal] = useState(6);
  const [newParentPin, setNewParentPin] = useState('');
  const [newPlayerPin, setNewPlayerPin] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const call = useCallback((path, opts = {}) => api(path, { ...opts, parentPin: pin }), [pin]);

  const load = useCallback(async () => {
    const d = await call('/api/parent/tasks');
    setData(d); setGoal(d.dailyGoal);
  }, [call]);

  const run = async (fn, okText) => {
    setErr(''); setMsg('');
    try { await fn(); if (okText) setMsg(okText); await load(); } catch (e) { setErr(e.message); }
  };

  const unlock = async (e) => {
    e?.preventDefault();
    setErr('');
    try { await call('/api/parent/verify', { method: 'POST' }); setUnlocked(true); await load(); } catch (x) { setErr(x.message); }
  };

  if (!unlocked) {
    return (
      <Modal onClose={onClose}>
        <form className="parent-lock" onSubmit={unlock}>
          <h2 className="display">Parent area</h2>
          {hasPin ? (
            <label>Parent PIN
              <input type="password" inputMode="numeric" value={pin} autoFocus onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
            </label>
          ) : <p>No parent PIN is set yet. You can set one inside so only grown-ups can change tasks.</p>}
          {err && <p className="form-error" role="alert">{err}</p>}
          <button className="btn primary">Open parent area</button>
        </form>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="parent">
        <h2 className="display">Parent area</h2>
        {msg && <p className="form-ok" role="status">{msg}</p>}
        {err && <p className="form-error" role="alert">{err}</p>}

        <h3 className="section-title">Daily goal</h3>
        <div className="row">
          <label className="grow">Tasks needed each day to keep the streak
            <input type="number" min={1} max={20} value={goal} onChange={(e) => setGoal(e.target.value)} />
          </label>
          <button className="btn" onClick={() => run(() => call('/api/parent/settings', { method: 'PATCH', body: { dailyGoal: goal } }), 'Daily goal saved.')}>Save goal</button>
        </div>

        <h3 className="section-title">Tasks</h3>
        <p className="muted small">Turn tasks off to hide them without losing their history.</p>
        <ul className="ptasks">
          {data?.tasks.map((t) => (
            <li key={t.id} className={t.active ? '' : 'off'}>
              <span>{t.icon} {t.title} <span className="muted small">({t.category}, {config.STATS[t.stat].label} +{t.amount})</span></span>
              <span className="ptask-actions">
                <button className="btn small" onClick={() => run(() => call(`/api/parent/tasks/${t.id}`, { method: 'PATCH', body: { active: !t.active } }))}>
                  {t.active ? 'Turn off' : 'Turn on'}
                </button>
                <button className="btn small ghost" onClick={() => { if (window.confirm(`Delete "${t.title}" and its history?`)) run(() => call(`/api/parent/tasks/${t.id}`, { method: 'DELETE' }), 'Task deleted.'); }}>Delete</button>
              </span>
            </li>
          ))}
        </ul>

        <h3 className="section-title">Add a task</h3>
        <div className="add-task">
          <label className="icon-input">Icon<input value={draft.icon} maxLength={4} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} /></label>
          <label className="grow">Task<input value={draft.title} maxLength={60} placeholder="e.g. Feed the dog" onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
          <label>Group<input value={draft.category} maxLength={20} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></label>
          <label>Grows
            <select value={draft.stat} onChange={(e) => setDraft({ ...draft, stat: e.target.value })}>
              {Object.entries(config.STATS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
          </label>
          <label>Points (1 to 15)<input type="number" min={1} max={15} value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} /></label>
          <button className="btn primary" disabled={!draft.title.trim()} onClick={() => run(async () => { await call('/api/parent/tasks', { method: 'POST', body: draft }); setDraft(EMPTY); }, 'Task added.')}>Add task</button>
        </div>

        <h3 className="section-title">PINs</h3>
        <div className="row">
          <label className="grow">New parent PIN<input type="password" inputMode="numeric" value={newParentPin} onChange={(e) => setNewParentPin(e.target.value.replace(/\D/g, ''))} /></label>
          <button className="btn" disabled={newParentPin.length < 4} onClick={() => run(async () => { await call('/api/parent/settings', { method: 'PATCH', body: { newParentPin } }); setPin(newParentPin); setNewParentPin(''); }, 'Parent PIN saved.')}>Save</button>
        </div>
        <div className="row">
          <label className="grow">New player PIN<input type="password" inputMode="numeric" value={newPlayerPin} onChange={(e) => setNewPlayerPin(e.target.value.replace(/\D/g, ''))} /></label>
          <button className="btn" disabled={newPlayerPin.length < 4} onClick={() => run(async () => { await call('/api/parent/settings', { method: 'PATCH', body: { newPlayerPin } }); setNewPlayerPin(''); }, 'Player PIN saved.')}>Save</button>
        </div>

        <h3 className="section-title">Start over</h3>
        <p className="muted small">Deletes the band, songs, and progress. Tasks and history stay.</p>
        <button className="btn danger" onClick={() => {
          if (window.confirm('Delete the band and all its progress? This cannot be undone.')) {
            run(() => call('/api/parent/reset-band', { method: 'POST' })).then(onClose);
          }
        }}>Delete band</button>
      </div>
    </Modal>
  );
}
