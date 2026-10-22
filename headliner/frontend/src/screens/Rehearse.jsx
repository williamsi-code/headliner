import React, { useState } from 'react';
import RhythmRush from '../games/RhythmRush.jsx';
import LyricLab from '../games/LyricLab.jsx';
import Soundcheck from '../games/Soundcheck.jsx';
import Modal from '../components/Modal.jsx';

const GAMES = { rhythm: RhythmRush, lyrics: LyricLab, soundcheck: Soundcheck };

export default function Rehearse({ state, config, act, notify }) {
  const [playing, setPlaying] = useState(null);
  const [result, setResult] = useState(null);
  const { band, bestScores } = state;

  const start = (id) => {
    if (band.energy < config.MINIGAMES[id].energy) {
      notify('You need 1 energy to rehearse. Finish a task on the Today tab.', 'bad');
      return;
    }
    setResult(null);
    setPlaying(id);
  };

  const finish = async (id, score, summary) => {
    setPlaying(null);
    const next = await act('/api/minigame', { game: id, score });
    if (next?.rehearsal) setResult({ id, summary, ...next.rehearsal });
  };

  if (playing) {
    const Game = GAMES[playing];
    return <Game onFinish={(score, summary) => finish(playing, score, summary)} onQuit={() => setPlaying(null)} />;
  }

  return (
    <section>
      <h2 className="display page-title">Rehearsal room</h2>
      <p className="page-sub">Each game costs ⚡1 and trains one skill. The better you play, the more you grow.</p>
      <div className="game-list">
        {Object.entries(config.MINIGAMES).map(([id, g]) => {
          const s = config.STATS[g.stat];
          return (
            <article className="game-card" key={id}>
              <span className="game-icon" aria-hidden="true">{g.icon}</span>
              <div className="game-info">
                <h3>{g.name}</h3>
                <p>{g.text}</p>
                <p className="muted small">Trains {s.icon} {s.label}{bestScores[id] !== undefined ? `. Best: ${bestScores[id]}` : ''}</p>
              </div>
              <button className="btn primary" onClick={() => start(id)}>Play ⚡1</button>
            </article>
          );
        })}
      </div>
      {result && (
        <Modal onClose={() => setResult(null)}>
          <div className="result">
            <div className="result-icon" aria-hidden="true">{config.MINIGAMES[result.id].icon}</div>
            <h2 className="display">Rehearsal done</h2>
            <p>{result.summary}</p>
            <p className="result-gain">
              {result.amount > 0 ? `+${result.amount} ${config.STATS[result.stat].label}` : 'No gain this time. Try again with more energy!'}
            </p>
            <button className="btn primary" onClick={() => setResult(null)}>Back to rehearsal room</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
