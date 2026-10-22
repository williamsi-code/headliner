import React, { useEffect, useRef, useState } from 'react';
import GameFrame from './GameFrame.jsx';
import { tone, buzz, LANE_NOTES } from './sound.js';

const PADS = ['Drums', 'Bass', 'Guitar', 'Keys'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Soundcheck({ onFinish, onQuit }) {
  const [phase, setPhase] = useState('ready'); // ready | listen | play | done
  const [seq, setSeq] = useState([]);
  const [step, setStep] = useState(0);
  const [lit, setLit] = useState(null);
  const alive = useRef(true);

  useEffect(() => () => { alive.current = false; }, []);

  const playback = async (s) => {
    setPhase('listen');
    await sleep(600);
    const speed = Math.max(220, 520 - s.length * 22);
    for (const p of s) {
      if (!alive.current) return;
      setLit(p); tone(LANE_NOTES[p], speed * 0.8);
      await sleep(speed);
      setLit(null);
      await sleep(speed * 0.35);
    }
    if (alive.current) { setStep(0); setPhase('play'); }
  };

  const nextRound = (prev) => {
    const s = [...prev, Math.floor(Math.random() * 4)];
    setSeq(s);
    playback(s);
  };

  const press = (p) => {
    if (phase !== 'play') return;
    setLit(p); setTimeout(() => setLit(null), 150);
    if (p !== seq[step]) {
      buzz();
      const rounds = seq.length - 1;
      setPhase('done');
      onFinish(rounds, `You nailed ${rounds} round${rounds === 1 ? '' : 's'} of soundcheck.`);
      return;
    }
    tone(LANE_NOTES[p], 160);
    if (step + 1 === seq.length) nextRound(seq);
    else setStep(step + 1);
  };

  return (
    <GameFrame title="Soundcheck" onQuit={() => { alive.current = false; onQuit(); }}
      hud={phase !== 'ready' && <span>Round {seq.length}</span>}>
      {phase === 'ready' ? (
        <div className="game-intro">
          <p>The sound engineer plays a pattern. Play it back exactly. Each round adds one more note.</p>
          <p className="muted">Longer patterns give more Stage presence.</p>
          <button className="btn primary big" onClick={() => nextRound([])}>Check one, two</button>
        </div>
      ) : (
        <div className="soundcheck">
          <p className="sc-status" aria-live="polite">{phase === 'listen' ? 'Listen…' : phase === 'play' ? 'Your turn' : ''}</p>
          <div className="sc-grid">
            {PADS.map((name, i) => (
              <button key={name} className={`sc-pad p${i} ${lit === i ? 'lit' : ''}`} disabled={phase !== 'play'} onClick={() => press(i)}>{name}</button>
            ))}
          </div>
        </div>
      )}
    </GameFrame>
  );
}
