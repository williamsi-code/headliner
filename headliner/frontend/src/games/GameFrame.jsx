import React, { useEffect } from 'react';

export default function GameFrame({ title, children, onQuit, hud }) {
  // Full-screen focus while playing: hide the sign and tab bar.
  useEffect(() => {
    document.body.classList.add('in-game');
    window.scrollTo(0, 0);
    return () => document.body.classList.remove('in-game');
  }, []);
  return (
    <div className="game">
      <div className="game-top">
        <h2 className="display game-title">{title}</h2>
        <div className="game-hud">{hud}</div>
        <button className="btn ghost small" onClick={() => { if (window.confirm('Quit? You will not get a reward for this round.')) onQuit(); }}>Quit</button>
      </div>
      {children}
    </div>
  );
}
