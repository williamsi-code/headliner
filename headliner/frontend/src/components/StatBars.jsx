import React from 'react';
import { fmt } from '../api.js';

export default function StatBars({ band, config }) {
  const max = Math.max(band.skill, band.creativity, band.stage, 50);
  return (
    <div className="stats">
      {Object.entries(config.STATS).map(([key, s]) => (
        <div className="stat" key={key}>
          <div className="stat-top">
            <span>{s.icon} {s.label}</span>
            <strong>{fmt(band[key])}</strong>
          </div>
          <div className="stat-bar"><span style={{ width: `${Math.round((band[key] / max) * 100)}%` }} /></div>
        </div>
      ))}
      <p className="power-line">Band power <strong>{fmt(band.power)}</strong> <span className="muted">(all three skills plus gear)</span></p>
    </div>
  );
}
