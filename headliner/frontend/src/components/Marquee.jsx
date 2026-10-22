import React from 'react';
import { fmt } from '../api.js';

// The light-up sign at the top: band name, career level, and the three resources.
export default function Marquee({ band, genre }) {
  const next = band.nextTier;
  const prevFans = next ? band.fans : 1;
  const span = next ? next.fans : 1;
  const pct = next ? Math.min(100, Math.round((prevFans / span) * 100)) : 100;
  return (
    <header className="marquee">
      <div className="marquee-sign">
        <div className="bulbs" aria-hidden="true" />
        <p className="marquee-genre">{genre.icon} {genre.name}</p>
        <h1 className="marquee-name">{band.name}</h1>
        <p className="marquee-tier">Level {band.tier + 1}: {band.tierName}</p>
        <div className="fanbar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
          aria-label={next ? `Fans toward ${next.name}` : 'Top level reached'}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="fanbar-text">
          {next ? `${fmt(band.fans)} / ${fmt(next.fans)} fans to ${next.name}` : `${fmt(band.fans)} fans. You made it to the top!`}
        </p>
      </div>
      <div className="resources">
        <span className="res" title="Energy: earn it by finishing tasks, spend it on gigs and rehearsals">⚡ {band.energy}</span>
        <span className="res" title="Fans">👥 {fmt(band.fans)}</span>
        <span className="res" title="Cash">💵 ${fmt(band.money)}</span>
        <span className="res" title="Daily goal streak">🔥 {band.streak}</span>
      </div>
    </header>
  );
}
