import React, { useState } from 'react';

export default function CreateBand({ config, onCreate, onLogout }) {
  const [genre, setGenre] = useState(null);
  const [name, setName] = useState('');
  const [members, setMembers] = useState(['', '', '', '']);
  const [busy, setBusy] = useState(false);
  const g = genre ? config.GENRES[genre] : null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await onCreate({ genre, name, members });
    setBusy(false);
  };

  if (!g) {
    return (
      <div className="create">
        <h1 className="display create-title">Pick your sound</h1>
        <p className="create-sub">Every genre has its own bonus. You can't change it later, so pick the one you love.</p>
        <div className="genre-grid">
          {Object.entries(config.GENRES).map(([id, x]) => (
            <button key={id} className="genre-card" style={{ '--genre': x.color }} onClick={() => setGenre(id)}>
              <span className="genre-icon" aria-hidden="true">{x.icon}</span>
              <span className="genre-name">{x.name}</span>
              <span className="genre-perk">{x.perk}</span>
            </button>
          ))}
        </div>
        <button className="btn ghost" onClick={onLogout}>Log out</button>
      </div>
    );
  }

  return (
    <form className="create" style={{ '--genre': g.color }} onSubmit={submit}>
      <button type="button" className="btn ghost back" onClick={() => setGenre(null)}>Change genre</button>
      <h1 className="display create-title">{g.icon} Name your {g.name.toLowerCase()} band</h1>
      <label className="big-label">Band name
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Type a name or pick one below" required />
      </label>
      <div className="chips">
        {g.nameIdeas.map((n) => (
          <button type="button" key={n} className="chip" onClick={() => setName(n)}>{n}</button>
        ))}
      </div>
      <h2 className="section-title">Who's in the band?</h2>
      <p className="muted">Name your bandmates. Use friends, pets, or made-up names.</p>
      <div className="members-form">
        {g.roles.map((role, i) => (
          <label key={role}>{role}
            <input value={members[i]} maxLength={20} placeholder={i === 0 ? 'You!' : `Bandmate ${i + 1}`}
              onChange={(e) => setMembers(members.map((m, j) => (j === i ? e.target.value : m)))} />
          </label>
        ))}
      </div>
      <button className="btn primary big" disabled={busy || name.trim().length < 2}>{busy ? 'Plugging in…' : 'Start in the garage'}</button>
    </form>
  );
}
