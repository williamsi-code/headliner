import React, { useState } from 'react';
import Modal from '../components/Modal.jsx';
import { fmt } from '../api.js';

export default function Studio({ state, config, act }) {
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [song, setSong] = useState(null);
  const { band, songs } = state;
  const owned = Array.isArray(band.gear) ? band.gear : [];
  const energyNeed = config.RULES.songEnergy;
  const canRecord = band.energy >= energyNeed && band.money >= band.songCost && title.trim();

  const record = async (e) => {
    e.preventDefault();
    setBusy(true);
    const next = await act('/api/song', { title });
    setBusy(false);
    if (next?.song) { setSong(next.song); setTitle(''); }
  };

  return (
    <section>
      <h2 className="display page-title">Recording studio</h2>
      <p className="page-sub">Songs earn fans right away, then keep earning fans every day for a month. Better Songwriting and Musicianship make better songs.</p>
      <form className="panel record" onSubmit={record}>
        <label>Song title
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} placeholder="Name your new song" />
        </label>
        <button className="btn primary" disabled={!canRecord || busy}>
          {busy ? 'Recording…' : `Record ⚡${energyNeed} · $${fmt(band.songCost)}`}
        </button>
        {(band.energy < energyNeed || band.money < band.songCost) && (
          <p className="hint">You need ⚡{energyNeed} and ${fmt(band.songCost)}. You have ⚡{band.energy} and ${fmt(band.money)}.</p>
        )}
      </form>

      <h3 className="section-title">Your songs</h3>
      {songs.length === 0
        ? <p className="empty">No songs yet. Your first one could be a hit.</p>
        : (
          <ol className="songs">
            {songs.map((s) => (
              <li key={s.id}>
                <span className="song-title">💿 {s.title}</span>
                <span className="muted small">Quality {s.quality} · +{fmt(s.fans)} fans at release</span>
              </li>
            ))}
          </ol>
        )}

      <h3 className="section-title">Gear shop</h3>
      <div className="shop">
        {config.GEAR.map((g) => {
          const have = owned.includes(g.id);
          return (
            <div key={g.id} className={`shop-item ${have ? 'owned' : ''}`}>
              <span className="shop-icon" aria-hidden="true">{g.icon}</span>
              <div className="shop-body">
                <h4>{g.name}</h4>
                <p className="small">{g.text}</p>
              </div>
              {have
                ? <span className="owned-tag">Owned</span>
                : <button className="btn" disabled={band.money < g.cost} onClick={() => act(`/api/shop/${g.id}`)}>${fmt(g.cost)}</button>}
            </div>
          );
        })}
      </div>

      {song && (
        <Modal onClose={() => setSong(null)}>
          <div className="result">
            <div className="result-icon" aria-hidden="true">💿</div>
            <h2 className="display">"{song.title}"</h2>
            <p>{song.review}</p>
            <p className="result-gain">Quality {song.quality} · +{fmt(song.fans)} fans</p>
            <p className="muted">It will keep earning fans every day.</p>
            <button className="btn primary" onClick={() => setSong(null)}>Back to the studio</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
