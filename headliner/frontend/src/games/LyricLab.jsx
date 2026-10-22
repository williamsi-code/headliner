import React, { useEffect, useRef, useState } from 'react';
import GameFrame from './GameFrame.jsx';
import { tone, buzz } from './sound.js';

const RHYMES = [
  ['cat', 'hat', 'bat', 'mat', 'flat', 'chat'],
  ['day', 'play', 'stay', 'way', 'gray', 'say'],
  ['light', 'night', 'bright', 'kite', 'write', 'flight'],
  ['song', 'long', 'strong', 'along', 'wrong'],
  ['star', 'car', 'guitar', 'far', 'jar'],
  ['beat', 'feet', 'street', 'heat', 'sweet', 'seat'],
  ['dream', 'team', 'stream', 'cream', 'beam'],
  ['sing', 'ring', 'king', 'swing', 'thing', 'spring'],
  ['rain', 'train', 'brain', 'plane', 'lane'],
  ['fun', 'sun', 'run', 'done', 'one'],
  ['blue', 'shoe', 'two', 'crew', 'new', 'zoo'],
  ['heart', 'start', 'art', 'part', 'chart'],
  ['show', 'glow', 'slow', 'know', 'snow', 'go'],
  ['ball', 'tall', 'call', 'wall', 'small'],
  ['cake', 'lake', 'make', 'shake', 'wake'],
  ['drum', 'hum', 'come', 'thumb', 'some'],
  ['bear', 'chair', 'air', 'hair', 'share'],
  ['moon', 'tune', 'soon', 'spoon', 'June'],
  ['sky', 'fly', 'high', 'why', 'try', 'pie'],
  ['loud', 'proud', 'crowd', 'cloud', 'allowed'],
  ['dance', 'chance', 'glance', 'prance'],
  ['road', 'load', 'toad', 'code', 'showed'],
];
const LENGTH = 45;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

function question() {
  const gi = Math.floor(Math.random() * RHYMES.length);
  const group = shuffle(RHYMES[gi]);
  const [word, answer] = group;
  const wrong = [];
  while (wrong.length < 3) {
    const other = Math.floor(Math.random() * RHYMES.length);
    if (other === gi) continue;
    const w = pick(RHYMES[other]);
    if (!wrong.includes(w)) wrong.push(w);
  }
  return { word, answer, options: shuffle([answer, ...wrong]) };
}

export default function LyricLab({ onFinish, onQuit }) {
  const [phase, setPhase] = useState('ready');
  const [q, setQ] = useState(question);
  const [left, setLeft] = useState(LENGTH);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [shake, setShake] = useState(null);
  const done = useRef(false);

  useEffect(() => {
    if (phase !== 'play') return undefined;
    const id = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'play' && left <= 0 && !done.current) {
      done.current = true;
      setPhase('done');
      onFinish(score, `You found ${score} rhyme${score === 1 ? '' : 's'} with ${wrong} miss${wrong === 1 ? '' : 'es'}.`);
    }
  }, [left, phase, score, wrong, onFinish]);

  const choose = (w) => {
    if (phase !== 'play') return;
    if (w === q.answer) {
      tone(660, 120); setScore((s) => s + 1); setQ(question());
    } else {
      buzz(); setWrong((x) => x + 1); setShake(w); setLeft((l) => Math.max(0, l - 2));
      setTimeout(() => setShake(null), 300);
    }
  };

  return (
    <GameFrame title="Lyric Lab" onQuit={onQuit} hud={phase === 'play' && <span>{score} rhymes · {left}s</span>}>
      {phase === 'ready' ? (
        <div className="game-intro">
          <p>You're writing a new song and need rhymes, fast. Pick the word that rhymes with the big word.</p>
          <p className="muted">45 seconds. A wrong pick costs 2 seconds.</p>
          <button className="btn primary big" onClick={() => setPhase('play')}>Grab the notebook</button>
        </div>
      ) : (
        <div className="lyric">
          <p className="lyric-prompt">What rhymes with</p>
          <p className="lyric-word">{q.word}</p>
          <div className="lyric-options">
            {q.options.map((w) => (
              <button key={w} className={`lyric-opt ${shake === w ? 'wrong' : ''}`} onClick={() => choose(w)}>{w}</button>
            ))}
          </div>
        </div>
      )}
    </GameFrame>
  );
}
