import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame from './GameFrame.jsx';
import { tone, LANE_NOTES } from './sound.js';

const LENGTH = 30000; // ms
const FALL = 1700; // ms a note takes to reach the line
const PERFECT = 70;
const GOOD = 150;
const KEYS = ['d', 'f', 'j', 'k'];
const LANE_NAMES = ['Kick', 'Snare', 'Tom', 'Cymbal'];

function makeChart() {
  const notes = [];
  let t = 1500;
  let id = 0;
  while (t < LENGTH - 500) {
    const progress = t / LENGTH;
    const gap = 650 - progress * 280 + Math.random() * 160;
    notes.push({ id: id++, lane: Math.floor(Math.random() * 4), t, state: 'live' });
    if (progress > 0.4 && Math.random() < 0.18) {
      notes.push({ id: id++, lane: Math.floor(Math.random() * 4), t, state: 'live' });
    }
    t += gap;
  }
  return notes;
}

export default function RhythmRush({ onFinish, onQuit }) {
  const [phase, setPhase] = useState('ready');
  const [, setFrame] = useState(0);
  const notes = useRef([]);
  const start = useRef(0);
  const stats = useRef({ perfect: 0, good: 0, miss: 0, combo: 0, best: 0 });
  const [flash, setFlash] = useState({});
  const [feedback, setFeedback] = useState('');
  const raf = useRef(0);

  const now = () => performance.now() - start.current;

  const end = useCallback(() => {
    cancelAnimationFrame(raf.current);
    setPhase('done');
    const s = stats.current;
    const total = notes.current.length;
    const accuracy = Math.round(((s.perfect + s.good * 0.6) / total) * 100);
    onFinish(accuracy, `${accuracy}% accuracy. ${s.perfect} perfect, ${s.good} good, ${s.miss} missed. Best combo ${s.best}.`);
  }, [onFinish]);

  const loop = useCallback(() => {
    const t = now();
    for (const n of notes.current) {
      if (n.state === 'live' && t > n.t + GOOD) {
        n.state = 'miss';
        stats.current.miss += 1;
        stats.current.combo = 0;
      }
    }
    setFrame((f) => f + 1);
    if (t >= LENGTH + 400) { end(); return; }
    raf.current = requestAnimationFrame(loop);
  }, [end]);

  const begin = () => {
    notes.current = makeChart();
    stats.current = { perfect: 0, good: 0, miss: 0, combo: 0, best: 0 };
    start.current = performance.now();
    setPhase('play');
    raf.current = requestAnimationFrame(loop);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const hit = useCallback((lane) => {
    if (phase !== 'play') return;
    const t = now();
    setFlash((f) => ({ ...f, [lane]: Date.now() }));
    let best = null;
    for (const n of notes.current) {
      if (n.lane !== lane || n.state !== 'live') continue;
      const d = Math.abs(n.t - t);
      if (d <= GOOD && (!best || d < Math.abs(best.t - t))) best = n;
    }
    if (!best) { setFeedback('Too early'); stats.current.combo = 0; return; }
    const d = Math.abs(best.t - t);
    best.state = 'hit';
    const s = stats.current;
    if (d <= PERFECT) { s.perfect += 1; setFeedback('Perfect!'); } else { s.good += 1; setFeedback('Good'); }
    s.combo += 1; s.best = Math.max(s.best, s.combo);
    tone(LANE_NOTES[lane], 120);
  }, [phase]);

  useEffect(() => {
    const onKey = (e) => {
      const lane = KEYS.indexOf(e.key.toLowerCase());
      if (lane >= 0 && !e.repeat) { e.preventDefault(); hit(lane); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hit]);

  const t = phase === 'play' ? now() : 0;
  const s = stats.current;

  return (
    <GameFrame title="Rhythm Rush" onQuit={() => { cancelAnimationFrame(raf.current); onQuit(); }}
      hud={phase === 'play' && <span>Combo {s.combo} · {Math.max(0, Math.ceil((LENGTH - t) / 1000))}s</span>}>
      {phase === 'ready' && (
        <div className="game-intro">
          <p>Notes fall down four lanes. Tap the lane (or press D F J K) when a note reaches the glowing line.</p>
          <p className="muted">30 seconds. Higher accuracy means more Musicianship.</p>
          <button className="btn primary big" onClick={begin}>Count me in</button>
        </div>
      )}
      {phase !== 'ready' && (
        <div className="rhythm">
          <div className="lanes">
            {[0, 1, 2, 3].map((lane) => (
              <div key={lane} className="lane">
                {notes.current.filter((n) => n.lane === lane && n.state === 'live' && n.t - t < FALL && n.t - t > -GOOD).map((n) => {
                  const pos = 1 - (n.t - t) / FALL;
                  return <span key={n.id} className={`note n${lane}`} style={{ top: `calc(${pos * 85}% - 14px)` }} />;
                })}
                <div className="hitline" />
              </div>
            ))}
          </div>
          <p className="rhythm-feedback" aria-live="polite">{feedback}</p>
          <div className="pads">
            {[0, 1, 2, 3].map((lane) => (
              <button key={lane} className={`pad p${lane} ${flash[lane] && Date.now() - flash[lane] < 120 ? 'lit' : ''}`}
                onPointerDown={(e) => { e.preventDefault(); hit(lane); }}>
                {LANE_NAMES[lane]}<span className="key">{KEYS[lane].toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </GameFrame>
  );
}
