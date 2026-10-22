import React, { useState } from 'react';
import Modal from '../components/Modal.jsx';
import { fmt } from '../api.js';

function chance(power, needed) {
  if (needed === 0) return { label: 'Easy', cls: 'easy' };
  const r = power / needed;
  if (r >= 1.2) return { label: 'Easy', cls: 'easy' };
  if (r >= 0.95) return { label: 'Good chance', cls: 'good' };
  if (r >= 0.7) return { label: 'Tough', cls: 'tough' };
  return { label: 'Very tough', cls: 'hard' };
}

export default function Gigs({ state, config, act }) {
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);
  const { band } = state;

  const play = async (v) => {
    setBusy(v.id);
    const next = await act('/api/gig', { venueId: v.id });
    setBusy(null);
    if (next?.gig) setResult({ ...next.gig, icon: v.icon });
  };

  const tiers = config.TIERS.map((t, i) => ({ ...t, i, venues: config.VENUES.filter((v) => v.tier === i) }));
  const visible = tiers.filter((t) => t.i <= band.tier + 1);

  return (
    <section>
      <h2 className="display page-title">Gig board</h2>
      <p className="page-sub">
        Your band power is <strong>{fmt(band.power)}</strong>. Gigs cost energy and earn fans and cash.
        {band.streakBonus > 0 && ` Your ${band.streak}-day streak adds ${band.streakBonus}% fans.`}
      </p>
      {visible.map((t) => {
        const locked = t.i > band.tier;
        return (
          <div key={t.i} className={`tier-block ${locked ? 'locked' : ''}`}>
            <h3 className="tier-title">Level {t.i + 1}: {t.name}{locked && ` (unlocks at ${fmt(t.fans)} fans)`}</h3>
            <ul className="venues">
              {t.venues.map((v) => {
                const c = chance(band.power, v.power);
                const enough = band.energy >= v.energy;
                return (
                  <li key={v.id} className="ticket">
                    <span className="ticket-icon" aria-hidden="true">{v.icon}</span>
                    <div className="ticket-body">
                      <h4>{v.name}</h4>
                      <p className="ticket-meta">
                        Up to {fmt(Math.round(v.fans * 1.5))} fans and ${fmt(Math.round(v.money * 1.5))}.
                        {' '}Needs {fmt(v.power)} power.
                      </p>
                      {!locked && <span className={`odds ${c.cls}`}>{c.label}</span>}
                    </div>
                    <button className="btn primary ticket-btn" disabled={locked || !enough || busy === v.id} onClick={() => play(v)}>
                      {locked ? '🔒' : `Play ⚡${v.energy}`}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      {result && (
        <Modal onClose={() => setResult(null)}>
          <div className="result">
            <div className="result-icon" aria-hidden="true">{result.icon}</div>
            <h2 className="display">{result.venue}</h2>
            <p className="stars" aria-label={`${result.stars} out of 3 stars`}>
              {[0, 1, 2].map((i) => <span key={i} className={i < result.stars ? 'lit' : ''}>★</span>)}
            </p>
            <p>{result.verdict}</p>
            <p className="result-gain">+{fmt(result.fans)} fans  ·  +${fmt(result.money)}  ·  +{result.stageXp} Stage presence</p>
            {result.stars < 2 && result.power < result.needed && (
              <p className="muted">Tip: your power was {fmt(result.power)} and this gig wanted {fmt(result.needed)}. Rehearse and do tasks to get stronger.</p>
            )}
            <button className="btn primary" onClick={() => setResult(null)}>Back to the gig board</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
