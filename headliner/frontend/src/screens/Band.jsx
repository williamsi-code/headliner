import React, { useEffect, useState } from 'react';
import StatBars from '../components/StatBars.jsx';
import Parent from './Parent.jsx';
import { api, fmt } from '../api.js';

function dayLabel(date) {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2);
}

export default function Band({ state, config, refresh, onLogout }) {
  const { band, events, user } = state;
  const [history, setHistory] = useState(null);
  const [openDay, setOpenDay] = useState(null);
  const [parentOpen, setParentOpen] = useState(false);
  const genre = config.GENRES[band.genre];

  useEffect(() => {
    api('/api/history').then(setHistory).catch(() => setHistory({ days: [] }));
  }, [state.doneToday]);

  return (
    <section>
      <h2 className="display page-title">{band.name}</h2>
      <p className="page-sub">{genre.icon} {genre.name} band. Bonus: {genre.perk.toLowerCase()}.</p>

      <ul className="members">
        {(band.members || []).map((m) => (
          <li key={m.role}><strong>{m.name}</strong><span className="muted small">{m.role}</span></li>
        ))}
      </ul>

      <h3 className="section-title">Skills</h3>
      <StatBars band={band} config={config} />

      <div className="facts">
        <div><strong>{band.streak}</strong><span>day streak</span></div>
        <div><strong>{band.bestStreak}</strong><span>best streak</span></div>
        <div><strong>{fmt(band.gigsPlayed)}</strong><span>gigs played</span></div>
        <div><strong>{state.songs.length}</strong><span>songs</span></div>
      </div>

      <h3 className="section-title">Last 14 days</h3>
      {history ? (
        <>
          <div className="calendar">
            {history.days.map((d) => (
              <button key={d.date} className={`cal-day ${d.goalMet ? 'met' : d.count ? 'some' : ''} ${openDay === d.date ? 'open' : ''}`}
                onClick={() => setOpenDay(openDay === d.date ? null : d.date)}
                aria-label={`${d.date}: ${d.count} tasks`}>
                <span className="cal-dow">{dayLabel(d.date)}</span>
                <span className="cal-count">{d.count}</span>
              </button>
            ))}
          </div>
          <p className="muted small">Gold days hit the goal of {user.dailyGoal}. Tap a day to see what got done.</p>
          {openDay && (
            <ul className="day-items">
              {(history.days.find((d) => d.date === openDay)?.items || []).map((t, i) => <li key={i}>{t}</li>)}
              {!(history.days.find((d) => d.date === openDay)?.items.length) && <li className="muted">Nothing ticked that day.</li>}
            </ul>
          )}
        </>
      ) : <p className="muted">Loading…</p>}

      <h3 className="section-title">Band news</h3>
      <ul className="news">
        {events.map((e) => <li key={e.id}><span className="muted small">{e.date}</span> {e.text}</li>)}
      </ul>

      <div className="band-actions">
        <button className="btn" onClick={() => setParentOpen(true)}>Parent area</button>
        <button className="btn ghost" onClick={onLogout}>Log out</button>
      </div>

      {parentOpen && (
        <Parent hasPin={user.hasParentPin} config={config}
          onClose={() => { setParentOpen(false); refresh(); }} />
      )}
    </section>
  );
}
